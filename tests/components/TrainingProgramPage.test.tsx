import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProgram, getCurrentUser, getProfile, notFound } = vi.hoisted(() => ({
  getProgram: vi.fn(),
  getCurrentUser: vi.fn(),
  getProfile: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/lib/directus/training", () => ({
  getLocalizedPublishedTrainingProgramBySlug: getProgram
}));
vi.mock("@/lib/auth/user", () => ({
  getCurrentUserProfile: getCurrentUser,
  withDirectusProfilePhone: (user: unknown) => user
}));
vi.mock("@/lib/directus/profile", () => ({
  getCurrentUserDirectusProfile: getProfile
}));
vi.mock("@/components/pages/TrainingCoursePage", () => ({
  TrainingCoursePage: ({ program }: { program: { title: string; id: string } }) => (
    <div>
      <h1>{program.title}</h1>
      <span data-testid="program-id">{program.id}</span>
    </div>
  )
}));

import TrainingProgramPage from "@/app/[locale]/training/[slug]/page";

const localizedProgram = {
  id: "trusted-directus-uuid",
  slug: "cms-program",
  title: "Türkçe program"
};

describe("TrainingProgramPage", () => {
  beforeEach(() => {
    getProgram.mockReset();
    getCurrentUser.mockReset();
    getProfile.mockReset();
    notFound.mockClear();
    getCurrentUser.mockResolvedValue(null);
  });

  it("renders the localized Directus program without a hardcoded slug lookup", async () => {
    getProgram.mockResolvedValue({ ok: true, data: localizedProgram });

    render(await TrainingProgramPage({ params: { locale: "tr", slug: "cms-program" } }));

    expect(getProgram).toHaveBeenCalledWith("cms-program", "tr");
    expect(screen.getByRole("heading", { name: "Türkçe program" })).toBeInTheDocument();
    expect(screen.getByTestId("program-id")).toHaveTextContent("trusted-directus-uuid");
  });

  it("uses not-found for unknown, draft, or untranslated programs", async () => {
    getProgram.mockResolvedValue({ ok: true, data: null });

    await expect(
      TrainingProgramPage({ params: { locale: "en", slug: "not-public" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("shows a safe error when Directus is unavailable", async () => {
    getProgram.mockResolvedValue({ ok: false, error: "serverFailure" });

    render(await TrainingProgramPage({ params: { locale: "en", slug: "cms-program" } }));

    expect(screen.getByRole("alert")).toHaveTextContent("unavailable");
    expect(notFound).not.toHaveBeenCalled();
  });
});
