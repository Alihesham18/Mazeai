import { describe, expect, it } from "vitest";
import {
  getScholarshipProgram,
  scholarshipPrograms
} from "@/data/scholarship-programs";

describe("scholarship program registry", () => {
  it("contains exactly the four supported scholarship program slugs", () => {
    expect(scholarshipPrograms.map((program) => program.slug)).toEqual([
      "data-science-machine-learning",
      "mobile-programming",
      "web-development-dotnet",
      "cybersecurity"
    ]);
  });

  it("preserves localized titles for every supported locale", () => {
    expect(getScholarshipProgram("mobile-programming")?.title).toEqual({
      en: "Mobile Programming",
      tr: "Mobil Programlama",
      ar: "برمجة تطبيقات الهاتف المحمول",
      fa: "برنامه‌نویسی موبایل"
    });
    expect(
      scholarshipPrograms.every((program) =>
        ["en", "tr", "ar", "fa"].every((locale) => program.title[locale as keyof typeof program.title])
      )
    ).toBe(true);
  });

  it("returns no definition for unsupported slugs", () => {
    expect(getScholarshipProgram("unsupported-program")).toBeUndefined();
  });
});
