import "dotenv/config";
// import { createEmailWorker } from "./workers/email.worker"; // hold
import { createWhatsAppWorker, WA_LID_MAP_KEY } from "./workers/whatsapp.worker";
import { createSmsWorker } from "./workers/sms.worker";
import {
  initializeWhatsAppClient,
  waitForWhatsAppReady,
  shutdownWhatsAppClient,
  setIncomingMessageHandler,
  getLidForChatId,
} from "../services/whatsapp/wweb.service";
import { createRedisPublisher, WA_REPLY_CHANNEL } from "../services/whatsapp/redis-pubsub";
import prisma from "../config/prisma";
import type { Worker } from "bullmq";

console.log("Worker process starting...");

let whatsappWorker: Worker | null = null;
let smsWorker: Worker | null = null;
const redisPublisher = createRedisPublisher();

const shutdown = async () => {
  console.log("\nShutting down workers...");
  await Promise.all([whatsappWorker?.close(), smsWorker?.close()]);
  await shutdownWhatsAppClient();
  await redisPublisher.quit();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const start = async (): Promise<void> => {
  // SMS worker starts immediately — stateless HTTP, no auth required
  smsWorker = createSmsWorker();

  // Register incoming WhatsApp reply handler before client initializes
  setIncomingMessageHandler(async (from: string, body: string) => {
    console.log(`[Worker] ↙ Incoming message from=${from} body="${body.slice(0, 80)}"`);

    let lead = null;

    // Strategy 1: @lid → leadId map (populated when we send messages in newer WhatsApp)
    if (from.endsWith("@lid")) {
      const leadId = await redisPublisher.hget(WA_LID_MAP_KEY, from);
      if (leadId) {
        lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (lead) console.log(`[Worker] ✓ Matched lead ${lead.id} via @lid map (${lead.shopName})`);
      }
      if (!lead) console.warn(`[Worker] @lid ${from} not in lid_map — falling back to phone suffix`);
    }

    // Strategy 2: phone suffix matching (classic @c.us or unresolved @lid)
    if (!lead) {
      const normalized = from.replace(/@c\.us$/, "").replace(/@lid$/, "");
      const suffix9 = normalized.slice(-9);
      const suffix10 = normalized.slice(-10);
      console.log(`[Worker] Matching phone — normalized=${normalized} suffix9=${suffix9}`);

      lead = await prisma.lead.findFirst({
        where: {
          OR: [
            { phoneNumber: normalized },
            { whatsappNumber: normalized },
            { phoneNumber: { endsWith: suffix9 } },
            { whatsappNumber: { endsWith: suffix9 } },
            { phoneNumber: { endsWith: suffix10 } },
            { whatsappNumber: { endsWith: suffix10 } },
          ],
        },
      });

      if (!lead) {
        console.warn(`[Worker] ⚠ No lead found for number: ${normalized} (suffix9=${suffix9})`);
        return;
      }
    }

    console.log(`[Worker] ✓ Matched lead ${lead.id} (${lead.shopName})`);

    const msg = await prisma.whatsAppMessage.create({
      data: { leadId: lead.id, direction: "INBOUND", body },
    });

    console.log(`[Worker] ✓ Stored message ${msg.id} in DB`);

    const published = await redisPublisher.publish(
      WA_REPLY_CHANNEL,
      JSON.stringify({
        leadId: lead.id,
        message: {
          id: msg.id,
          leadId: lead.id,
          direction: "INBOUND",
          body,
          sentAt: msg.sentAt.toISOString(),
        },
      }),
    );

    console.log(`[Worker] ✓ Published to Redis (${published} SSE client(s) notified) for lead ${lead.shopName}`);
  });

  // WhatsApp needs Chrome + session before it can process jobs
  initializeWhatsAppClient();
  console.log("[Worker] Waiting for WhatsApp to be ready (scan QR if prompted)...");
  await waitForWhatsAppReady(300_000);
  console.log("[Worker] WhatsApp ready — starting WhatsApp job queue");

  // Backfill @lid map for leads that were already sent before this fix was deployed.
  // For each sent lead, ask the WhatsApp Web page for the @lid assigned to that phone.
  void (async () => {
    try {
      const sentLeads = await prisma.lead.findMany({
        where: { whatsappStatus: "SENT" },
        select: { id: true, phoneNumber: true, whatsappNumber: true },
      });
      console.log(`[Worker] Scanning @lid for ${sentLeads.length} sent leads...`);
      let mapped = 0;
      for (const lead of sentLeads) {
        const phone = lead.whatsappNumber ?? lead.phoneNumber;
        if (!phone) continue;
        const digits = phone.replace(/[^\d]/g, "");
        const normalized = digits.startsWith("880") ? digits : "880" + digits.replace(/^0/, "");
        const chatId = `${normalized}@c.us`;
        try {
          const lid = await getLidForChatId(chatId);
          if (lid) {
            await redisPublisher.hset(WA_LID_MAP_KEY, lid, lead.id);
            mapped++;
          }
        } catch { /* skip */ }
      }
      console.log(`[Worker] @lid backfill done: ${mapped}/${sentLeads.length} leads mapped`);
    } catch (err) {
      console.error("[Worker] @lid backfill error:", err);
    }
  })();

  // createEmailWorker(); // hold
  whatsappWorker = createWhatsAppWorker(redisPublisher);

  console.log("All workers started");
};

start().catch((err) => {
  console.error("[Worker] Startup failed:", err);
  process.exit(1);
});
