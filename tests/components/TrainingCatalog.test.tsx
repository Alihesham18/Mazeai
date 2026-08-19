import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrainingCatalog } from "@/components/pages/TrainingCatalogPage/TrainingCatalog";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    key === "hours" ? `${values?.count} hours` : key
}));
vi.mock("@/components/training/TrainingProgramImage", () => ({
  TrainingProgramImage: ({
    alt,
    children,
    src
  }: {
    alt: string;
    children: React.ReactNode;
    src: string | null;
  }) => <div data-testid="training-image" data-alt={alt} data-src={src}>{children}</div>
}));

function program(title: string): PublicTrainingProgram {
  return {
    id: "directus-uuid",
    slug: "cms-only-program",
    status: "published",
    category: "bootcamp",
    title,
    shortDescription: "Localized summary",
    description: "Localized description",
    image: null,
    imageAlt: null,
    durationHours: 40,
    location: "Online",
    format: "Hybrid",
    instructor: "Ada Example",
    instructorRole: "Instructor",
    fee: 1000,
    currency: "TRY",
    certificate: true,
    hoursBreakdown: null,
    applicationOpen: true,
    curriculum: [],
    weeklyPlan: []
  };
}

describe("TrainingCatalog", () => {
  it.each([
    ["tr", "Türkçe CMS Başlığı"],
    ["ar", "عنوان عربي من Directus"],
    ["fa", "عنوان فارسی دایرکتوس"]
  ] as const)("renders localized Directus content and links for %s", (locale, title) => {
    render(
      <TrainingCatalog
        locale={locale as Locale}
        programs={[program(title)]}
        authenticated
      />
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: title })[0]).toHaveAttribute(
      "href",
      `/${locale}/training/cms-only-program`
    );
    expect(screen.queryByText("directus-uuid")).not.toBeInTheDocument();
  });

  it("passes a local public cover image and localized alt text to the image component", () => {
    render(
      <TrainingCatalog
        locale="tr"
        programs={[{
          ...program("Türkçe CMS Başlığı"),
          image: "/images/training/mobile-programming.png",
          imageAlt: "Türkçe kapak açıklaması"
        }]}
        authenticated
      />
    );

    expect(screen.getByTestId("training-image")).toHaveAttribute(
      "data-src",
      "/images/training/mobile-programming.png"
    );
    expect(screen.getByTestId("training-image")).toHaveAttribute(
      "data-alt",
      "Türkçe kapak açıklaması"
    );
  });
});
