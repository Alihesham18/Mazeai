import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/admin/AdminPlaceholder", () => ({
  AdminPlaceholder: ({ titleKey }: { titleKey: string }) => <h1>{titleKey}</h1>
}));

import AdminBlogPage from "@/app/[locale]/admin/blog/page";
import AdminCaseStudiesPage from "@/app/[locale]/admin/case-studies/page";
import AdminDiscountsPage from "@/app/[locale]/admin/discounts/page";
import AdminEventsPage from "@/app/[locale]/admin/events/page";
import AdminEventRegistrationsPage from "@/app/[locale]/admin/events/registrations/page";
import AdminResearchPage from "@/app/[locale]/admin/research/page";
import AdminScholarshipsPage from "@/app/[locale]/admin/scholarships/page";
import AdminTrainingApplicationsPage from "@/app/[locale]/admin/training/applications/page";
import AdminTrainingEnrollmentsPage from "@/app/[locale]/admin/training/enrollments/page";
import AdminTrainingProgramsPage from "@/app/[locale]/admin/training/programs/page";

const routes = [
  [AdminTrainingProgramsPage, "navigation.trainingPrograms"],
  [AdminTrainingApplicationsPage, "navigation.trainingApplications"],
  [AdminTrainingEnrollmentsPage, "navigation.enrolledTrainings"],
  [AdminScholarshipsPage, "navigation.scholarships"],
  [AdminDiscountsPage, "navigation.discountCodes"],
  [AdminEventsPage, "navigation.events"],
  [AdminEventRegistrationsPage, "navigation.eventRegistrations"],
  [AdminCaseStudiesPage, "navigation.caseStudies"],
  [AdminBlogPage, "navigation.blog"],
  [AdminResearchPage, "navigation.research"]
] as const;

describe("admin placeholder routes", () => {
  it.each(routes)("renders the expected placeholder for %s", (Page, titleKey) => {
    render(<Page params={{ locale: "en" }} />);
    expect(screen.getByRole("heading", { name: titleKey })).toBeInTheDocument();
  });
});
