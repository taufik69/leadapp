import { Worker, Job } from "bullmq";
import redisConnection from "../config/redis.config";
import { QUEUES } from "../config/queue.config";
import { EmailJobData } from "../jobs/lead.job.types";
import { sendLeadEmail } from "../../services/email/resend.service";
import prisma from "../../config/prisma";

export const createEmailWorker = (): Worker => {
  const worker = new Worker<EmailJobData>(
    QUEUES.EMAIL,
    async (job: Job<EmailJobData>) => {
      const { leadId, email, shopName, ownerName, phoneNumber } = job.data;

      console.log(`[Email Worker] Processing job ${job.id} for lead ${leadId}`);

      await sendLeadEmail({ to: email, shopName, ownerName, phoneNumber });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          emailStatus: "SENT",
          emailSentAt: new Date(),
          lastError: null,
        },
      });

      console.log(`[Email Worker] ✅ Email sent for lead ${leadId}`);
    },
    { connection: redisConnection }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 3);

    if (isLastAttempt) {
      await prisma.Lead.update({
        where: { id: job.data.leadId },
        data: {
          emailStatus: "FAILED",
          lastError: err.message,
        },
      });
      console.error(`[Email Worker] ❌ All retries failed for lead ${job.data.leadId}:`, err.message);
    } else {
      console.warn(`[Email Worker] ⚠️ Attempt ${job.attemptsMade} failed, retrying...`);
    }
  });

  console.log(`[Email Worker] Started — listening on "${QUEUES.EMAIL}"`);
  return worker;
};
