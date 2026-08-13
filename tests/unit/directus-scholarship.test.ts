import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  withToken: (token: string, command: unknown) => ({ token, command }),
  isDirectusError: (error: unknown) =>
    typeof error === "object" && error !== null && "errors" in error
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));
vi.mock("@/lib/directus/auth", () => ({
  directusAuthErrorCode: vi.fn(() => "serverFailure"),
  getAuthenticatedDirectusSession: vi.fn(async () => ({ accessToken: "user-token" }))
}));

import {
  createTrustedScholarshipAttempt,
  getActiveScholarshipRules
} from "@/lib/directus/scholarship";

const input = {
  userId: "user-1",
  programId: "program-1",
  score: 9,
  totalQuestions: 10,
  percentage: 90,
  scholarshipPercentage: 40,
  status: "eligible" as const
};

describe("Directus scholarship service", () => {
  beforeEach(() => {
    request.mockReset();
    process.env.DIRECTUS_SCHOLARSHIP_TOKEN = "private-service-token";
  });

  it("uses the service token to read only active rules", async () => {
    request.mockResolvedValueOnce([]);

    await expect(getActiveScholarshipRules()).resolves.toEqual({ ok: true, data: [] });
    expect(request).toHaveBeenCalledWith({
      token: "private-service-token",
      command: expect.objectContaining({
        operation: "read",
        collection: "scholarship_rules",
        query: expect.objectContaining({ filter: { active: { _eq: true } } })
      })
    });
  });

  it("creates only trusted attempt fields", async () => {
    request.mockResolvedValueOnce({ id: "attempt-1" });

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-ABC234" })
    ).resolves.toEqual({ ok: true, data: { discountCode: "SYNERGY-ABC234" } });

    const item = request.mock.calls[0][0].command.item;
    expect(item).toEqual({
      user: "user-1",
      training_program: "program-1",
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      discount_code: "SYNERGY-ABC234",
      status: "eligible"
    });
    expect(item).not.toHaveProperty("id");
    expect(item).not.toHaveProperty("date_created");
    expect(item).not.toHaveProperty("date_updated");
  });

  it("retries with a new code when Directus reports a unique collision", async () => {
    request
      .mockRejectedValueOnce({ errors: [{ message: "Value has to be unique" }] })
      .mockResolvedValueOnce({ id: "attempt-1" });
    const codes = ["SYNERGY-FIRST1", "SYNERGY-SECOND"];

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => String(codes.shift()) })
    ).resolves.toEqual({ ok: true, data: { discountCode: "SYNERGY-SECOND" } });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("fails safely when the service token is missing", async () => {
    delete process.env.DIRECTUS_SCHOLARSHIP_TOKEN;

    await expect(getActiveScholarshipRules()).resolves.toEqual({
      ok: false,
      error: "configuration"
    });
    expect(request).not.toHaveBeenCalled();
  });
});
