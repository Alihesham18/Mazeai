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

export type ScholarshipSubmissionMessage =
  "invalidSubmission" | "sessionExpired" | "submissionFailed";

export interface ScholarshipSubmissionState {
  status: "idle" | "error" | "success";
  message?: ScholarshipSubmissionMessage;
  result?: ScholarshipExamResult;
}
