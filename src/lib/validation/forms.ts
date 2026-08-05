import { z } from "zod";

export const consentSchema = z.object({
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "validation.requiredConsent" })
  }),
  marketingConsent: z.boolean().optional()
});

export const eventRegistrationSchema = consentSchema.extend({
  fullName: z.string().min(2, "validation.required"),
  email: z.string().email("validation.email"),
  phone: z.string().min(6, "validation.required"),
  organization: z.string().min(2, "validation.required"),
  role: z.string().min(2, "validation.required"),
  country: z.string().min(2, "validation.required"),
  preferredLanguage: z.enum(["en", "tr", "ar"]),
  accessibility: z.string().optional()
});

export const trainingApplicationSchema = consentSchema.extend({
  fullName: z.string().min(2, "validation.required"),
  email: z.string().email("validation.email"),
  phone: z.string().min(6, "validation.required"),
  country: z.string().min(2, "validation.required"),
  organization: z.string().min(2, "validation.required"),
  currentRole: z.string().min(2, "validation.required"),
  program: z.string().min(2, "validation.required"),
  experienceLevel: z.string().min(2, "validation.required"),
  objectives: z.string().min(10, "validation.required"),
  preferredDates: z.string().min(2, "validation.required"),
  preferredLanguage: z.enum(["en", "tr", "ar"]),
  format: z.string().min(2, "validation.required"),
  notes: z.string().optional()
});
