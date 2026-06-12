import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis.config";
import { QUEUES } from "../config/queue.config";
import { SmsJobData } from "../jobs/lead.job.types";
import { sendSms, buildSmsMessage } from "../../services/sms/sms.service";
import prisma from "../../config/prisma";

export const createSmsWorker = (): Worker => {
  const worker = new Worker<SmsJobData>(
    QUEUES.SMS,
    async (job: Job<SmsJobData>) => {
      const { leadId, phoneNumber, shopName, ownerName, smsMessage } = job.data;

      console.log(`[SMS Worker] Processing job ${job.id} for lead ${leadId}`);

      const message = smsMessage?.trim() || buildSmsMessage(shopName, ownerName);
      await sendSms(phoneNumber, message);

      await prisma.lead.update({
        where: { id: leadId },
        data: { smsStatus: "SENT", smsSentAt: new Date(), lastError: null },
      });

      console.log(`[SMS Worker] SMS sent for lead ${leadId}`);
    },
    { connection: redisConnection },
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 3);
    if (isLastAttempt) {
      await prisma.lead.update({
        where: { id: job.data.leadId },
        data: { smsStatus: "FAILED", lastError: err.message },
      });
      console.error(`[SMS Worker] All retries failed for lead ${job.data.leadId}:`, err.message);
    } else {
      console.warn(`[SMS Worker] Attempt ${job.attemptsMade} failed, retrying...`);
    }
  });

  console.log(`[SMS Worker] Started — listening on "${QUEUES.SMS}"`);
  return worker;
};
