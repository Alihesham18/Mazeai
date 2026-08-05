import { describe, expect, it } from "vitest";
import { getDirection, isLocale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";

describe("locale routing", () => {
  it("accepts configured locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("uses RTL for Arabic and LTR for English and Turkish", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("tr")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
  });

  it("builds locale-prefixed paths", () => {
    expect(localizedPath("en", "/services")).toBe("/en/services");
    expect(localizedPath("ar", "/")).toBe("/ar");
  });

  it("returns localized copy with English fallback", () => {
    expect(localize({ en: "Services", tr: "Hizmetler", ar: "الخدمات" }, "tr")).toBe("Hizmetler");
  });
});
