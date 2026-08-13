import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getScholarshipExam } from "@/data/scholarship-exams";
import {
  generateDiscountCode,
  scoreScholarshipExam,
  selectScholarshipRule
} from "@/lib/scholarship/scoring.server";
import type { DirectusScholarshipRule } from "@/lib/directus/types";

function answers(selectedOption = 0) {
  return Array.from({ length: 10 }, (_, index) => ({
    questionId: `q${index + 1}`,
    selectedOption
  }));
}

function rule(
  id: string,
  minimum: number,
  discount: number,
  program: string | null = null
): DirectusScholarshipRule {
  return {
    id,
    training_program: program,
    minimum_percentage: minimum,
    discount_percentage: discount,
    active: true
  };
}

describe("scholarship scoring", () => {
  it("scores correct answers only on the server", () => {
    expect(scoreScholarshipExam("mobile-programming", answers())).toEqual({
      score: 10,
      totalQuestions: 10,
      percentage: 100
    });
    expect(scoreScholarshipExam("mobile-programming", answers(1))).toEqual({
      score: 0,
      totalQuestions: 10,
      percentage: 0
    });
  });

  it("rejects unknown, duplicate, missing, and invalid answers", () => {
    expect(
      scoreScholarshipExam("mobile-programming", [
        ...answers().slice(0, 9),
        { questionId: "unknown", selectedOption: 0 }
      ])
    ).toBeNull();
    expect(
      scoreScholarshipExam("mobile-programming", [
        ...answers().slice(0, 9),
        { questionId: "q1", selectedOption: 0 }
      ])
    ).toBeNull();
    expect(scoreScholarshipExam("mobile-programming", answers().slice(0, 9))).toBeNull();
    expect(
      scoreScholarshipExam(
        "mobile-programming",
        answers().map((answer, index) => (index === 0 ? { ...answer, selectedOption: 99 } : answer))
      )
    ).toBeNull();
  });

  it("prioritizes program rules and selects the highest eligible discount", () => {
    const rules = [
      rule("global-60", 60, 10),
      rule("global-90", 90, 40),
      rule("program-70", 70, 25, "program-1"),
      rule("program-90", 90, 45, "program-1")
    ];

    expect(selectScholarshipRule(rules, "program-1", 85)?.id).toBe("program-70");
    expect(selectScholarshipRule(rules, "program-2", 95)?.id).toBe("global-90");
  });

  it("uses a cryptographic byte source and never Math.random", () => {
    const random = vi.fn(() => Buffer.from([0, 1, 2, 3, 4, 5]));
    expect(generateDiscountCode(random)).toBe("SYNERGY-ABCDEF");
    expect(random).toHaveBeenCalledWith(6);

    const source = readFileSync("src/lib/scholarship/scoring.server.ts", "utf8");
    expect(source).toContain('from "node:crypto"');
    expect(source).not.toContain("Math.random");
  });

  it("keeps client question data free of answer keys", () => {
    for (const slug of [
      "mobile-programming",
      "data-science-machine-learning",
      "web-development-dotnet",
      "cybersecurity"
    ]) {
      const exam = getScholarshipExam(slug);
      expect(exam?.questions).toHaveLength(10);
      expect(exam?.questions.every((question) => !("answer" in question))).toBe(true);
    }

    const client = readFileSync(
      "src/components/training/ScholarshipExam/ScholarshipExam.tsx",
      "utf8"
    );
    expect(client).not.toContain("answer-keys.server");
    expect(client).not.toContain("scoring.server");
  });

  it("keeps the scholarship service credential behind a server-only boundary", () => {
    const service = readFileSync("src/lib/directus/scholarship.ts", "utf8");
    const client = readFileSync(
      "src/components/training/ScholarshipExam/ScholarshipExam.tsx",
      "utf8"
    );

    expect(service.startsWith('import "server-only"')).toBe(true);
    expect(service).toContain("process.env.DIRECTUS_SCHOLARSHIP_TOKEN");
    expect(service).not.toContain("NEXT_PUBLIC_DIRECTUS_SCHOLARSHIP_TOKEN");
    expect(client).not.toContain("DIRECTUS_SCHOLARSHIP_TOKEN");
  });
});
