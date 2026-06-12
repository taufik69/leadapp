import prisma from "../../../config/prisma";
import { Queue } from "bullmq";
import redisConnection from "../../../queue/config/redis.config";
import { QUEUES, defaultJobOptions } from "../../../queue/config/queue.config";
import type { WhatsAppJobData } from "../../../queue/jobs/lead.job.types";

const whatsappQueue = new Queue<WhatsAppJobData>(QUEUES.WHATSAPP, {
  connection: redisConnection,
  defaultJobOptions,
});

export const conversationRepository = {
  findMessagesByLeadId: async (leadId: string) => {
    return prisma.whatsAppMessage.findMany({
      where: { leadId },
      orderBy: { sentAt: "asc" },
    });
  },

  createOutboundMessage: async (leadId: string, body: string) => {
    return prisma.whatsAppMessage.create({
      data: { leadId, direction: "OUTBOUND", body },
    });
  },

  dispatchReply: async (leadId: string, phoneNumber: string, message: string) => {
    return whatsappQueue.add(
      "send-whatsapp-reply",
      { leadId, phoneNumber, shopName: "", ownerName: null, whatsappMessage: message, source: "reply" },
    );
  },
};
