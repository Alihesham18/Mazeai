import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccountUser, getAcceptedTrainings } = vi.hoisted(() => ({
  requireAccountUser: vi.fn(),
  getAcceptedTrainings: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/lib/auth/account", () => ({ requireAccountUser }));
vi.mock("@/lib/directus/training", () => ({
  getCurrentUserAcceptedTrainingApplications: getAcceptedTrainings
}));

import MyTrainingsPage from "@/app/[locale]/account/my-trainings/page";

const acceptedTraining = {
  applicationId: "application-1",
  status: "accepted" as const,
  dateCreated: "2026-08-01T10:00:00Z",
  program: {
    id: "program-1",
    slug: "ai-foundations",
    title: "AI Foundations",
    category: "Short Course",
    format: "Hybrid",
    duration_hours: 24,
    fee: 5000,
    location: "Istanbul + Online",
    certificate_available: true,
    instructor_name: "Dr. Ada Example",
    instructor_role: "Lead Instructor",
    short_description: "Build a practical foundation in artificial intelligence.",
    image_url: null,
    application_open: true,
    status: "published"
  }
};

describe("MyTrainingsPage", () => {
  beforeEach(() => {
    requireAccountUser.mockReset();
    getAcceptedTrainings.mockReset();
    requireAccountUser.mockResolvedValue({ id: "current-user-uuid" });
  });

  it("keeps the existing empty state when there are no accepted trainings", async () => {
    getAcceptedTrainings.mockResolvedValue({ ok: true, data: [] });

    render(await MyTrainingsPage({ params: { locale: "en" } }));

    expect(requireAccountUser).toHaveBeenCalledWith("en", "/account/my-trainings");
    expect(screen.getByText("noTrainings")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browseTrainings" })).toHaveAttribute(
      "href",
      "/en/training"
    );
  });

  it("renders accepted training program information and its localized detail link", async () => {
    getAcceptedTrainings.mockResolvedValue({ ok: true, data: [acceptedTraining] });

    render(await MyTrainingsPage({ params: { locale: "en" } }));

    expect(screen.getByRole("heading", { name: "AI Foundations" })).toBeInTheDocument();
    expect(screen.getByText("trainingStatus.accepted")).toBeInTheDocument();
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
    expect(screen.getByText(/24 trainingHours/)).toBeInTheDocument();
    expect(screen.getByText("Istanbul + Online")).toBeInTheDocument();
    expect(screen.getByText("trainingCertificateAvailable")).toBeInTheDocument();
    expect(screen.getByText("Dr. Ada Example")).toBeInTheDocument();
    expect(screen.getByText("Lead Instructor")).toBeInTheDocument();
    expect(screen.getByText(acceptedTraining.program.short_description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewTraining" })).toHaveAttribute(
      "href",
      "/en/training/ai-foundations"
    );
    expect(screen.queryByText("noTrainings")).not.toBeInTheDocument();
  });

  it("shows a safe error state when Directus cannot load trainings", async () => {
    getAcceptedTrainings.mockResolvedValue({ ok: false, error: "serverFailure" });

    render(await MyTrainingsPage({ params: { locale: "en" } }));

    expect(screen.getByRole("alert")).toHaveTextContent("trainingsUnavailable");
  });
});
