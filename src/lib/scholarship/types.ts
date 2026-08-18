export interface ScholarshipAnswerSubmission {
  questionId: string;
  selectedOption: number;
}

export type ScholarshipAttemptStatus = "eligible" | "not_eligible" | "under_review" | "completed";

export interface ScholarshipExamResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  scholarshipPercentage: number | null;
  discountCode: string | null;
  discountReady: boolean;
  status: ScholarshipAttemptStatus;
}

export interface ScholarshipCompletedAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scholarshipPercentage: number | null;
  discountCode: string | null;
  discountReady: boolean;
  status: ScholarshipAttemptStatus;
}

export type ScholarshipSubmissionMessage =
  | "invalidSubmission"
  | "sessionExpired"
  | "submissionFailed"
  | "alreadyAttempted"
  | "attemptVerificationFailed"
  | "examUnavailable"
  | "incompleteSubmission";

export type ScholarshipSubmissionState =
  | { status: "idle" }
  | {
      status: "error";
      message: Exclude<ScholarshipSubmissionMessage, "alreadyAttempted">;
    }
  | {
      status: "alreadyAttempted";
      message: "alreadyAttempted";
      existingAttempt: ScholarshipCompletedAttempt;
    }
  | { status: "success"; result: ScholarshipExamResult };
