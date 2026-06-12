import { Worker, Job } from "bullmq";
import type { Redis } from "ioredis";
import redisConnection from "../config/redis.config";
import { QUEUES } from "../config/queue.config";
import { WhatsAppJobData } from "../jobs/lead.job.types";
import { sendWhatsAppMessage, buildWhatsAppMessage } from "../../services/whatsapp/wweb.service";
import prisma from "../../config/prisma";

export const WA_LID_MAP_KEY = "whatsapp:lid_map";

export const createWhatsAppWorker = (redis: Redis): Worker => {
  const worker = new Worker<WhatsAppJobData>(
    QUEUES.WHATSAPP,
    async (job: Job<WhatsAppJobData>) => {
      const { leadId, phoneNumber, shopName, ownerName, whatsappMessage, source } = job.data;

      console.log(`[WhatsApp Worker] Processing job ${job.id} for lead ${leadId}`);

      const message = whatsappMessage?.trim() || buildWhatsAppMessage(shopName, ownerName);
      const remoteLid = await sendWhatsAppMessage(phoneNumber, message);

      // Store @lid → leadId mapping so inbound replies can be matched (newer WhatsApp uses @lid)
      if (remoteLid) {
        await redis.hset(WA_LID_MAP_KEY, remoteLid, leadId);
        console.log(`[WhatsApp Worker] Stored @lid map: ${remoteLid} → ${leadId}`);
      }

      // Store outbound message in conversation history (skip for reply — already stored by API)
      if (source !== "reply") {
        await prisma.whatsAppMessage.create({
          data: { leadId, direction: "OUTBOUND", body: message },
        });
      }

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          whatsappStatus: "SENT",
          whatsappSentAt: new Date(),
          lastError: null,
        },
      });

      console.log(`[WhatsApp Worker] ✅ WhatsApp sent for lead ${leadId}`);
    },
    { connection: redisConnection }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 3);

    // Log every attempt so we can see what's actually failing
    console.error(
      `[WhatsApp Worker] ❌ Job ${job.id} attempt ${job.attemptsMade}/${job.opts.attempts ?? 3} failed for lead ${job.data.leadId} phone=${job.data.phoneNumber}:`,
      err.message,
      err.stack,
    );

    if (isLastAttempt) {
      await prisma.lead.update({
        where: { id: job.data.leadId },
        data: {
          whatsappStatus: "FAILED",
          lastError: err.message,
        },
      });
      console.error(`[WhatsApp Worker] ❌ All retries exhausted for lead ${job.data.leadId}`);
    }
  });

  console.log(`[WhatsApp Worker] Started — listening on "${QUEUES.WHATSAPP}"`);
  return worker;
};
