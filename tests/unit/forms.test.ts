import { describe, expect, it } from "vitest";
import { eventRegistrationSchema, trainingApplicationSchema } from "@/lib/validation/forms";

describe("form validation schemas", () => {
  it("requires consent for event registration", () => {
    const result = eventRegistrationSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+905551112233",
      organization: "Sample University",
      role: "Researcher",
      country: "Türkiye",
      preferredLanguage: "en",
      privacyConsent: false
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid event registration input", () => {
    const result = eventRegistrationSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+905551112233",
      organization: "Sample University",
      role: "Researcher",
      country: "Türkiye",
      preferredLanguage: "en",
      privacyConsent: true,
      marketingConsent: false
    });

    expect(result.success).toBe(true);
  });

  it("validates required training application fields", () => {
    const result = trainingApplicationSchema.safeParse({
      fullName: "A",
      email: "not-email",
      privacyConsent: true
    });

    expect(result.success).toBe(false);
  });
});
