import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useFormState, useFormStatus } = vi.hoisted(() => ({
  useFormState: vi.fn(),
  useFormStatus: vi.fn()
}));

vi.mock("react-dom", () => ({
  useFormState,
  useFormStatus
}));
vi.mock("@/lib/scholarship/actions", () => ({
  submitScholarshipExamAction: vi.fn()
}));

import { ScholarshipExam } from "@/components/training/ScholarshipExam";
import { getScholarshipExam } from "@/data/scholarship-exams";
import { getTrainingProgram } from "@/data/training-programs";

const program = getTrainingProgram("mobile-programming")!;
const exam = getScholarshipExam("mobile-programming")!;
const attemptLabels = {
  completedTitle: "Scholarship Exam Completed",
  alreadyCompleted: "You have already completed this scholarship exam.",
  viewAttempts: "View Scholarship Attempts",
  oneAttemptOnly: "This exam can only be taken once.",
  unableVerifyPreviousAttempts: "Unable to verify previous attempts. Please try again.",
  authenticationRequired: "Your session has expired. Please log in again.",
  unansweredQuestions: "Please answer every question before submitting the exam.",
  invalidSubmission: "The exam submission is invalid.",
  examUnavailable: "This scholarship exam is currently unavailable.",
  submissionFailure: "Exam submission failed. Please try again.",
  discountPreparing: "Your scholarship result was saved. Your discount is being prepared."
};
const user = {
  id: "user-1",
  email: "user@example.com",
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  telephone: "+905551234567"
};

describe("ScholarshipExam one-attempt state", () => {
  beforeEach(() => {
    useFormState.mockReset().mockReturnValue([{ status: "idle" }, "/submit"]);
    useFormStatus.mockReset().mockReturnValue({ pending: false });
  });

  it("hides the exam form and shows the historic eligible attempt", () => {
    const { container } = render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={{
          id: "attempt-1",
          score: 8,
          totalQuestions: 10,
          percentage: 80,
          scholarshipPercentage: 30,
          discountCode: "SYNERGY-EXISTING",
          discountReady: true,
          hasHistoricDuplicates: false,
          status: "eligible",
          dateCreated: "2026-01-01T00:00:00Z"
        }}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByText("Scholarship Exam Completed")).toBeInTheDocument();
    expect(screen.getByText("You have already completed this scholarship exam.")).toBeInTheDocument();
    expect(screen.getByText(/Score: 8 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText("Percentage: 80%")).toBeInTheDocument();
    expect(screen.getByText("Scholarship Award: 30%")).toBeInTheDocument();
    expect(screen.getByText(/Discount Code: SYNERGY-EXISTING/)).toBeInTheDocument();
    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit exam" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Scholarship Attempts" })).toHaveAttribute(
      "href",
      "/en/account/scholarship-exams"
    );
  });

  it("blocks the form when previous attempts cannot be verified", () => {
    render(
      <ScholarshipExam
        attemptCheckFailed
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to verify previous attempts. Please try again."
    );
    expect(screen.queryByRole("button", { name: "Submit exam" })).not.toBeInTheDocument();
  });

  it("switches to completed UI when the server action returns alreadyAttempted", () => {
    useFormState.mockReturnValueOnce([
      {
        status: "alreadyAttempted",
        message: "alreadyAttempted",
        existingAttempt: {
          id: "attempt-1",
          score: 7,
          totalQuestions: 10,
          percentage: 70,
          scholarshipPercentage: 20,
          discountCode: null,
          discountReady: false,
          status: "eligible"
        }
      },
      "/submit"
    ]);

    const { container } = render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByText(/Score: 7 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText("Percentage: 70%")).toBeInTheDocument();
    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit exam" })).not.toBeInTheDocument();
  });

  it("shows completed results immediately after a successful first submission", () => {
    useFormState.mockReturnValueOnce([
      {
        status: "success",
        result: {
          score: 9,
          totalQuestions: 10,
          percentage: 90,
          scholarshipPercentage: 40,
          discountCode: "SYNERGY-FIRST",
          discountReady: true,
          status: "eligible"
        }
      },
      "/submit"
    ]);

    const { container } = render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByText("Exam completed")).toBeInTheDocument();
    expect(screen.getByText(/Score: 9 \/ 10/)).toBeInTheDocument();
    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit exam" })).not.toBeInTheDocument();
  });

  it("uses radio semantics and prevents advancing with an unanswered question", () => {
    render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please answer every question before submitting the exam."
    );
    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });

  it("disables the submit control and shows loading text while pending", () => {
    useFormStatus.mockReturnValue({ pending: true });
    render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    for (let index = 0; index < exam.questions.length; index += 1) {
      fireEvent.click(screen.getAllByRole("radio")[0]);
      if (index < exam.questions.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
      }
    }

    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submitting..." })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("uses the localized login return path for unauthenticated visitors", () => {
    render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="tr"
        program={program}
        exam={exam}
        user={null}
      />
    );

    expect(screen.getByRole("link", { name: "Bursluluk sınavına girmek için giriş yapın" }))
      .toHaveAttribute(
        "href",
        `/tr/login?next=${encodeURIComponent(`/tr/training/${program.slug}/scholarship`)}`
      );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("renders not eligible as a successful completion without award or discount", () => {
    useFormState.mockReturnValueOnce([
      {
        status: "success",
        result: {
          score: 3,
          totalQuestions: 10,
          percentage: 30,
          scholarshipPercentage: null,
          discountCode: null,
          discountReady: false,
          status: "not_eligible"
        }
      },
      "/submit"
    ]);

    render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByText("Not Eligible")).toBeInTheDocument();
    expect(screen.queryByText(/Scholarship Award:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Discount Code:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("shows a safe preparing state when an eligible result has no ready discount", () => {
    useFormState.mockReturnValueOnce([
      {
        status: "success",
        result: {
          score: 8,
          totalQuestions: 10,
          percentage: 80,
          scholarshipPercentage: 30,
          discountCode: null,
          discountReady: false,
          status: "eligible"
        }
      },
      "/submit"
    ]);

    render(
      <ScholarshipExam
        attemptCheckFailed={false}
        attemptLabels={attemptLabels}
        existingAttempt={null}
        locale="en"
        program={program}
        exam={exam}
        user={user}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(attemptLabels.discountPreparing);
    expect(screen.queryByText(/Discount Code:/)).not.toBeInTheDocument();
  });
});
