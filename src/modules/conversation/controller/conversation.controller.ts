import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/prisma";
import { conversationRepository } from "../repository/conversation.repository";
import { sendSuccess, sendCreated } from "../../../shared/response/api-response";
import { NotFoundError, ValidationError, BadRequestError } from "../../../shared/errors/app-error";

export const conversationController = {
  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params['id'] as string;
      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead) throw new NotFoundError("Lead");

      const messages = await conversationRepository.findMessagesByLeadId(id);

      // Leads sent before whatsapp_messages table existed have no DB records.
      // Synthesize the original outbound message from the Lead row so the
      // conversation history is never blank for successfully-sent leads.
      const hasOutbound = messages.some((m) => m.direction === "OUTBOUND");
      if (!hasOutbound && lead.whatsappMessage && lead.whatsappStatus === "SENT") {
        const synthetic = {
          id: `synthetic-${lead.id}`,
          leadId: lead.id,
          direction: "OUTBOUND",
          body: lead.whatsappMessage,
          sentAt: (lead.whatsappSentAt ?? lead.createdAt).toISOString(),
        };
        return sendSuccess(res, [synthetic, ...messages]);
      }

      sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  },

  sendReply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params['id'] as string;
      const { message } = req.body as { message?: string };

      if (!message?.trim()) throw new ValidationError("message is required");

      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead) throw new NotFoundError("Lead");

      const phone = lead.whatsappNumber ?? lead.phoneNumber;
      if (!phone) throw new BadRequestError("Lead has no WhatsApp or phone number");

      // Store immediately so it appears in the drawer right away
      const stored = await conversationRepository.createOutboundMessage(id, message.trim());
      console.log(`[Conversation] Stored outbound message ${stored.id} for lead ${id}`);

      // Enqueue — worker will send it; source:"reply" tells worker not to re-store
      const job = await conversationRepository.dispatchReply(id, phone, message.trim());
      console.log(`[Conversation] Dispatched WhatsApp reply job ${job.id} for lead ${id} → phone=${phone}`);

      sendCreated(res, stored, "Message queued");
    } catch (err) {
      next(err);
    }
  },
};
