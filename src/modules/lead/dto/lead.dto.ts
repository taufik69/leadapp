import { z } from "zod";
import { id } from "zod/locales";

export const CreateLeadDto = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().optional().nullable(),
  shopAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  facebookPage: z.string().optional().nullable(),
  instagramPage: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const UpdateLeadDto = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().optional().nullable(),
  shopAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  facebookPage: z.string().optional().nullable(),
  instagramPage: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const LeadIdParamDto = z.object({
  id: z.string().min(1, "Invalid lead ID"),
});

export type CreateLeadInput = z.infer<typeof CreateLeadDto>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadDto>;
export type LeadIdParam = z.infer<typeof LeadIdParamDto>;
