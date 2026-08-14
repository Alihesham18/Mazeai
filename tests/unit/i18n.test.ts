import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import { getDirection, isLocale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";

describe("locale routing", () => {
  it("accepts configured locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("uses RTL for Arabic and Farsi and LTR for English and Turkish", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("tr")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("fa")).toBe("rtl");
  });

  it("builds locale-prefixed paths", () => {
    expect(localizedPath("en", "/services")).toBe("/en/services");
    expect(localizedPath("ar", "/")).toBe("/ar");
  });

  it("returns localized copy with English fallback", () => {
    expect(localize({ en: "Services", tr: "Hizmetler", ar: "الخدمات" }, "tr")).toBe("Hizmetler");
  });

  it("provides the new account and password copy in every supported locale", () => {
    const requiredAuthKeys = [
      "personalInformation",
      "contactInformation",
      "accountInformation",
      "accountNumber",
      "memberSince",
      "lastUpdated",
      "activeAccount",
      "passwordSecurity",
      "changePassword",
      "currentPassword",
      "newPassword",
      "confirmNewPassword",
      "showPassword",
      "hidePassword"
    ] as const;

    for (const messages of [en, tr, ar, fa]) {
      for (const key of requiredAuthKeys) {
        expect(messages.auth[key]).toBeTruthy();
      }
      expect(messages.auth.messages.passwordUpdated).toBeTruthy();
      expect(messages.auth.messages.passwordMismatch).toBeTruthy();
      expect(messages.auth.messages.incorrectCurrentPassword).toBeTruthy();
      expect(messages.auth.messages.newPasswordSame).toBeTruthy();
    }
  });
});
