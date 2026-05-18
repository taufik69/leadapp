import prisma from "../../../config/prisma";
import { CreateLeadInput, UpdateLeadInput } from "../dto/lead.dto";

export const leadRepository = {
  findAll: () =>
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string) => prisma.lead.findUnique({ where: { id } }),

  create: (data: CreateLeadInput) => prisma.lead.create({ data }),

  update: (id: string, data: UpdateLeadInput) =>
    prisma.lead.update({ where: { id }, data }),

  updateStatus: (
    id: string,
    data: {
      emailStatus?: "PENDING" | "SENT" | "FAILED";
      whatsappStatus?: "PENDING" | "SENT" | "FAILED";
      emailSentAt?: Date;
      whatsappSentAt?: Date;
      lastError?: string | null;
    },
  ) => prisma.lead.update({ where: { id }, data }),

  delete: (id: string) => prisma.lead.delete({ where: { id } }),
};
