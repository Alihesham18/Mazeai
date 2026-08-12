import { z } from "zod";
import { isValidInternationalPhone, normalizeInternationalPhone } from "@/lib/phone/normalize";

const email = z.string().trim().email();
const password = z.string().min(8).max(128);
const internationalPhone = z
  .string()
  .trim()
  .transform(normalizeInternationalPhone)
  .refine(isValidInternationalPhone);

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
});

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email,
    telephone: internationalPhone,
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
  telephone: internationalPhone
});
