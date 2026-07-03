import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["OPERATIONS", "WFM", "ADMIN"]),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(["OPERATIONS", "WFM", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});
