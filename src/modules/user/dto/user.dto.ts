import { z } from "zod";

export const CreateUserDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
});

export const UpdateUserDto = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  isActive: z.boolean().optional(),
});

export const UserIdParamDto = z.object({
  id: z.string().min(1, "Invalid user ID"),
});

export type CreateUserInput = z.infer<typeof CreateUserDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;
export type UserIdParam = z.infer<typeof UserIdParamDto>;
