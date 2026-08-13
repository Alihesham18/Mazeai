import "server-only";

import { randomBytes } from "node:crypto";
import { getScholarshipExam } from "@/data/scholarship-exams";
import type { DirectusScholarshipRule } from "@/lib/directus/types";
import { getScholarshipAnswerKey } from "./answer-keys.server";
import type { ScholarshipAnswerSubmission } from "./types";

const discountAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function scoreScholarshipExam(
  programSlug: string,
  answers: readonly ScholarshipAnswerSubmission[]
) {
  const exam = getScholarshipExam(programSlug);
  const answerKey = getScholarshipAnswerKey(programSlug);
  if (!exam || !answerKey || answers.length !== exam.questions.length) return null;

  const submitted = new Map<string, number>();
  for (const answer of answers) {
    const question = exam.questions.find((candidate) => candidate.id === answer.questionId);
    if (
      !question ||
      submitted.has(answer.questionId) ||
      !Number.isInteger(answer.selectedOption) ||
      answer.selectedOption < 0 ||
      answer.selectedOption >= question.options.length
    ) {
      return null;
    }
    submitted.set(answer.questionId, answer.selectedOption);
  }

  if (exam.questions.some((question) => !submitted.has(question.id))) return null;

  const score = exam.questions.reduce(
    (total, question) => total + (submitted.get(question.id) === answerKey[question.id] ? 1 : 0),
    0
  );
  const totalQuestions = exam.questions.length;

  return {
    score,
    totalQuestions,
    percentage: Math.round((score / totalQuestions) * 100)
  };
}

function ruleProgramId(rule: DirectusScholarshipRule) {
  if (!rule.training_program) return null;
  return typeof rule.training_program === "string"
    ? rule.training_program
    : rule.training_program.id;
}

export function selectScholarshipRule(
  rules: readonly DirectusScholarshipRule[],
  programId: string,
  percentage: number
) {
  const programRules = rules.filter((rule) => ruleProgramId(rule) === programId);
  const applicableRules =
    programRules.length > 0 ? programRules : rules.filter((rule) => ruleProgramId(rule) === null);

  return (
    applicableRules
      .filter((rule) => rule.minimum_percentage <= percentage)
      .sort(
        (left, right) =>
          right.discount_percentage - left.discount_percentage ||
          right.minimum_percentage - left.minimum_percentage
      )[0] ?? null
  );
}

export function generateDiscountCode(random = randomBytes) {
  const bytes = random(6);
  let suffix = "";
  for (const byte of bytes) suffix += discountAlphabet[byte % discountAlphabet.length];
  return `SYNERGY-${suffix}`;
}
