import { leadRepository } from "../repository/lead.repository";
import { CreateLeadInput, UpdateLeadInput, BulkLeadInput } from "../dto/lead.dto";
import { NotFoundError } from "../../../shared/errors/app-error";
import { dispatchLeadJobs } from "../../../queue/producers/lead.producer";
import { Prisma } from "../../../generated/prisma";

export const leadService = {
  getAllLeads: async () => {
    return leadRepository.findAll();
  },

  getLeadById: async (id: string) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new NotFoundError("Lead");
    return lead;
  },

  createLead: async (data: CreateLeadInput) => {
    const lead = await leadRepository.create(data);

    // Background queue — API response কে block করে না
    dispatchLeadJobs({
      leadId: lead.id,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      whatsappNumber: lead.whatsappNumber,
      shopName: lead.shopName,
      ownerName: lead.ownerName,
    }).catch((err) =>
      console.error("[Lead Service] Queue dispatch failed:", err),
    );

    return lead;
  },

  bulkCreateLeads: async (payload: BulkLeadInput) => {
    const created = [] as Array<Awaited<ReturnType<typeof leadRepository.create>>>;
    let skipped = 0;

    for (const item of payload.leads) {
      try {
        const lead = await leadRepository.create({
          ...item,
          whatsappMessage: payload.whatsappMessage ?? "",
        });

        dispatchLeadJobs({
          leadId: lead.id,
          email: lead.email,
          phoneNumber: lead.phoneNumber,
          whatsappNumber: lead.whatsappNumber,
          shopName: lead.shopName,
          ownerName: lead.ownerName,
          whatsappMessage: payload.whatsappMessage,
          smsMessage: payload.smsMessage,
        }).catch((err) =>
          console.error("[Lead Service] Queue dispatch failed:", err),
        );

        created.push(lead);
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return {
      created: created.length,
      skipped,
      leads: created,
    };
  },

  updateLead: async (id: string, data: UpdateLeadInput) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError("Lead");
    return leadRepository.update(id, data);
  },

  deleteLead: async (id: string) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError("Lead");
    await leadRepository.delete(id);
  },
};
