import { z } from "zod";

const email = z.string().trim().email();
const password = z.string().min(8).max(128);

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
});

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email,
    telephone: z.string().trim().min(6).max(30),
    password,
    confirmPassword: z.string().min(8).max(128),
    consent: z.literal("on")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"]
  });

export const resetRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(8).max(128)
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"]
  });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  telephone: z.string().trim().min(6).max(30)
});
