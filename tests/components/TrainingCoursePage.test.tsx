import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicTrainingProgram } from "@/lib/training/types";

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string, values?: { count?: number }) =>
    key === "hours" ? `${values?.count} localized-hours` : key
  )
}));
vi.mock("@/components/training/TrainingProgramImage", () => ({
  TrainingProgramImage: ({ alt, children, src }: {
    alt: string;
    children: React.ReactNode;
    src: string | null;
  }) => (
    <div data-testid="training-image" data-alt={alt} data-src={src}>{children}</div>
  )
}));
vi.mock("@/components/training/TrainingCurriculum", () => ({
  TrainingCurriculum: ({ program }: { program: PublicTrainingProgram }) => (
    <ol data-testid="curriculum">
      {program.curriculum.map((item) => <li key={item.id}>{item.title}</li>)}
    </ol>
  )
}));
vi.mock("@/components/training/TrainingTimeline", () => ({
  TrainingTimeline: ({ program }: { program: PublicTrainingProgram }) => (
    <ol data-testid="weekly-plan">
      {program.weeklyPlan.map((item) => <li key={item.id}>{item.title}</li>)}
    </ol>
  )
}));
vi.mock("@/components/training/TrainingApplicationForm", () => ({
  TrainingApplicationForm: () => <div data-testid="application-form" />
}));

import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";

const program: PublicTrainingProgram = {
  id: "trusted-program-uuid",
  slug: "localized-program",
  status: "published",
  category: "bootcamp",
  title: "Türkçe başlık",
  shortDescription: "Türkçe kısa açıklama",
  description: "Türkçe tam açıklama",
  image: "/images/data-science-machine-learning-bootcamp.png",
  imageAlt: "Türkçe görsel açıklaması",
  durationHours: 120,
  location: "Istanbul + Online",
  format: "Hybrid",
  instructor: "Dr. Ada Example",
  instructorRole: "Baş Eğitmen",
  fee: 90000,
  currency: "TRY",
  certificate: true,
  hoursBreakdown: "Türkçe saat dağılımı",
  applicationOpen: true,
  curriculum: [
    { id: "c1", sort: 1, title: "Müfredat bir", description: null },
    { id: "c2", sort: 2, title: "Müfredat iki", description: null }
  ],
  weeklyPlan: [
    { id: "w1", sort: 1, title: "Hafta bir", description: null },
    { id: "w2", sort: 2, title: "Hafta iki", description: null }
  ]
};

describe("TrainingCoursePage", () => {
  it("renders normalized localized content and trusted operational fields", async () => {
    render(await TrainingCoursePage({ locale: "tr", program, user: null }));

    expect(screen.getByRole("heading", { name: "Türkçe başlık" })).toBeInTheDocument();
    expect(screen.getByText("Türkçe kısa açıklama")).toBeInTheDocument();
    expect(screen.getByText("Türkçe tam açıklama")).toBeInTheDocument();
    expect(screen.getByText("Türkçe saat dağılımı")).toBeInTheDocument();
    expect(screen.getAllByText("Dr. Ada Example")).toHaveLength(2);
    expect(screen.getByText(/₺90\.000/)).toBeInTheDocument();
    expect(screen.getByTestId("training-image")).toHaveAttribute(
      "data-alt",
      "Türkçe görsel açıklaması"
    );
    expect(screen.getByTestId("training-image")).toHaveAttribute(
      "data-src",
      "/images/data-science-machine-learning-bootcamp.png"
    );
    expect(screen.getByTestId("curriculum")).toHaveTextContent("Müfredat birMüfredat iki");
    expect(screen.getByTestId("weekly-plan")).toHaveTextContent("Hafta birHafta iki");
  });
});
