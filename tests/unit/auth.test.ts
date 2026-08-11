import { describe, expect, it } from "vitest";
import { loginSchema, registrationSchema } from "@/lib/auth/validation";

describe("authentication validation", () => {
  it("rejects invalid login input", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
  });

  it("requires matching registration passwords and consent", () => {
    const base = {
      firstName: "Ali",
      lastName: "Hesham",
      email: "ali@example.com",
      telephone: "+90 555 000 0000",
      password: "secure-password",
      confirmPassword: "different-password",
      consent: "on"
    };

    expect(registrationSchema.safeParse(base).success).toBe(false);
    expect(
      registrationSchema.safeParse({ ...base, confirmPassword: base.password, consent: "" }).success
    ).toBe(false);
    expect(
      registrationSchema.safeParse({ ...base, confirmPassword: base.password }).success
    ).toBe(true);
  });
});
