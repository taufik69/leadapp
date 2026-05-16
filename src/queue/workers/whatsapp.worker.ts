import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis.config";
import { QUEUES } from "../config/queue.config";
import { WhatsAppJobData } from "../jobs/lead.job.types";
import { sendWhatsAppMessage, buildWhatsAppMessage } from "../../services/whatsapp/wweb.service";
import prisma from "../../config/prisma";

export const createWhatsAppWorker = (): Worker => {
  const worker = new Worker<WhatsAppJobData>(
    QUEUES.WHATSAPP,
    async (job: Job<WhatsAppJobData>) => {
      const { leadId, phoneNumber, shopName, ownerName } = job.data;

      console.log(`[WhatsApp Worker] Processing job ${job.id} for lead ${leadId}`);

      const message = buildWhatsAppMessage(shopName, ownerName);
      await sendWhatsAppMessage(phoneNumber, message);

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

    if (isLastAttempt) {
      await prisma.lead.update({
        where: { id: job.data.leadId },
        data: {
          whatsappStatus: "FAILED",
          lastError: err.message,
        },
      });
      console.error(`[WhatsApp Worker] ❌ All retries failed for lead ${job.data.leadId}:`, err.message);
    } else {
      console.warn(`[WhatsApp Worker] ⚠️ Attempt ${job.attemptsMade} failed, retrying...`);
    }
  });

  console.log(`[WhatsApp Worker] Started — listening on "${QUEUES.WHATSAPP}"`);
  return worker;
};
