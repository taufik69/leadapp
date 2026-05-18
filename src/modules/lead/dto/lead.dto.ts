import { z } from "zod";

const bdPhone = z
  .string()
  .transform((val) => val.replace(/[^\d]/g, ""))
  .refine((val) => /^01\d{9}$/.test(val), {
    message: "Phone must start with 01 and contain exactly 11 digits",
  })
  .optional()
  .nullable();

export const CreateLeadDto = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().optional().nullable(),
  shopAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  facebookPage: z.string().optional().nullable(),
  instagramPage: z.string().optional().nullable(),
  phoneNumber: bdPhone,
  whatsappNumber: bdPhone,
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const UpdateLeadDto = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().optional().nullable(),
  shopAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  facebookPage: z.string().optional().nullable(),
  instagramPage: z.string().optional().nullable(),
  phoneNumber: bdPhone,
  whatsappNumber: bdPhone,
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const LeadIdParamDto = z.object({
  id: z.string().min(1, "Invalid lead ID"),
});

export type CreateLeadInput = z.infer<typeof CreateLeadDto>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadDto>;
export type LeadIdParam = z.infer<typeof LeadIdParamDto>;
