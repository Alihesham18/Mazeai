import { describe, expect, it } from "vitest";
import {
  combineStoredPhone,
  isValidInternationalPhone,
  normalizeInternationalPhone,
  normalizePhoneNumber,
  splitInternationalPhone,
  splitPhoneForStorage
} from "@/lib/phone/normalize";

describe("phone number normalization", () => {
  it("combines a selected country code with a local number", () => {
    expect(normalizePhoneNumber("+90", "532 123 45 67")).toBe("+905321234567");
  });

  it("removes a national trunk prefix before submission", () => {
    expect(normalizePhoneNumber("+90", "0532 123 45 67")).toBe("+905321234567");
  });

  it("avoids duplicating an international prefix typed into the local field", () => {
    expect(normalizePhoneNumber("+90", "+90 532 123 45 67")).toBe("+905321234567");
  });

  it("normalizes already international values", () => {
    expect(normalizeInternationalPhone("+90 555 000 0000")).toBe("+905550000000");
  });

  it("splits international values for editing", () => {
    expect(splitInternationalPhone("+201001112233")).toEqual({
      country: expect.objectContaining({ iso2: "EG", callingCode: "+20" }),
      localNumber: "1001112233"
    });
  });

  it("rejects values that are too short for international format", () => {
    expect(isValidInternationalPhone("+9012")).toBe(false);
  });

  it("splits the normalized phone into Directus profile fields", () => {
    expect(splitPhoneForStorage("+905525073889")).toEqual({
      phone_country_code: "+90",
      phone_number: "5525073889"
    });
  });

  it("combines stored profile fields for the phone input", () => {
    expect(combineStoredPhone("+90", "0552 507 38 89")).toBe("+905525073889");
    expect(combineStoredPhone(null, null)).toBe("");
  });
});
