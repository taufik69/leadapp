import { Queue } from "bullmq";
import redisConnection from "../config/redis.config";
import { QUEUES, defaultJobOptions } from "../config/queue.config";
import { EmailJobData, WhatsAppJobData } from "../jobs/lead.job.types";

const emailQueue = new Queue<EmailJobData>(QUEUES.EMAIL, {
  connection: redisConnection,
  defaultJobOptions,
});

const whatsappQueue = new Queue<WhatsAppJobData>(QUEUES.WHATSAPP, {
  connection: redisConnection,
  defaultJobOptions,
});

interface LeadJobPayload {
  leadId: string;
  email?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  shopName: string;
  ownerName?: string | null;
}

export const dispatchLeadJobs = async (lead: LeadJobPayload): Promise<void> => {
  const jobs: Promise<unknown>[] = [];

  if (lead.email) {
    jobs.push(
      emailQueue.add("send-email", {
        leadId: lead.leadId,
        email: lead.email,
        shopName: lead.shopName,
        ownerName: lead.ownerName,
        phoneNumber: lead.phoneNumber,
      })
    );
  }

  const whatsappPhone = lead.whatsappNumber ?? lead.phoneNumber;
  if (whatsappPhone) {
    jobs.push(
      whatsappQueue.add("send-whatsapp", {
        leadId: lead.leadId,
        phoneNumber: whatsappPhone,
        shopName: lead.shopName,
        ownerName: lead.ownerName,
      })
    );
  }

  await Promise.all(jobs);
  console.log(`[Producer] Jobs dispatched for lead ${lead.leadId}`);
};
