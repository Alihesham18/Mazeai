import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("server-only", () => ({}));

vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown, query: unknown) => ({
    operation: "create",
    collection,
    item,
    query
  }),
  readItems: (collection: string, query: unknown) => ({
    operation: "readItems",
    collection,
    query
  }),
  readUsers: (query: unknown) => ({ operation: "readUsers", query }),
  updateItems: (collection: string, query: unknown, item: unknown, response: unknown) => ({
    operation: "updateItems",
    collection,
    query,
    item,
    response
  }),
  withToken: (token: string, command: unknown) => ({ token, command }),
  isDirectusError: (error: unknown) =>
    Boolean(error && typeof error === "object" && "errors" in error)
}));

vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));

import {
  ensureRegisteredUserAccountNumber,
  ensureUserAccountNumber,
  generateAccountNumber
} from "@/lib/directus/account-numbers";

const uniqueConflict = {
  errors: [{ message: "Value must be unique", extensions: { code: "RECORD_NOT_UNIQUE" } }]
};

function commandAt(index: number) {
  return request.mock.calls[index][0].command;
}

describe("trusted account-number provisioning", () => {
  const previousToken = process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN;

  beforeEach(() => {
    request.mockReset();
    process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN = "account-service-token";
  });

  afterEach(() => {
    if (previousToken === undefined) {
      delete process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN;
    } else {
      process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN = previousToken;
    }
  });

  it("generates the public identifier in the required year and six-digit format", () => {
    expect(generateAccountNumber(new Date("2026-08-14T00:00:00Z"))).toMatch(/^SMA-2026-\d{6}$/);
  });

  it("preserves an existing account number permanently", async () => {
    request.mockResolvedValueOnce([
      { id: "profile-1", user: "user-1", account_number: "SMA-2026-000001" }
    ]);

    await expect(ensureUserAccountNumber("user-1")).resolves.toEqual({
      ok: true,
      accountNumber: "SMA-2026-000001"
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("creates a missing profile with a server-only candidate", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce({
      id: "profile-1",
      user: "user-1",
      account_number: "SMA-2026-123456"
    });

    await expect(
      ensureUserAccountNumber("user-1", { candidateFactory: () => "SMA-2026-123456" })
    ).resolves.toEqual({ ok: true, accountNumber: "SMA-2026-123456" });
    expect(commandAt(1)).toMatchObject({
      operation: "create",
      collection: "user_profiles",
      item: { user: "user-1", account_number: "SMA-2026-123456" }
    });
  });

  it("conditionally backfills an existing profile without overwriting a concurrent value", async () => {
    request
      .mockResolvedValueOnce([{ id: "profile-1", user: "user-1", account_number: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "profile-1", user: "user-1", account_number: "SMA-2026-654321" }
      ]);

    await expect(
      ensureUserAccountNumber("user-1", { candidateFactory: () => "SMA-2026-123456" })
    ).resolves.toEqual({ ok: true, accountNumber: "SMA-2026-654321" });
    expect(commandAt(1)).toMatchObject({
      operation: "updateItems",
      query: {
        filter: {
          id: { _eq: "profile-1" },
          account_number: { _empty: true }
        }
      },
      item: { account_number: "SMA-2026-123456" }
    });
  });

  it("retries a database uniqueness collision with a new candidate", async () => {
    const candidates = ["SMA-2026-000001", "SMA-2026-000002"];
    request
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(uniqueConflict)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        id: "profile-1",
        user: "user-1",
        account_number: "SMA-2026-000002"
      });

    await expect(
      ensureUserAccountNumber("user-1", { candidateFactory: () => candidates.shift()! })
    ).resolves.toEqual({ ok: true, accountNumber: "SMA-2026-000002" });
    expect(commandAt(1).item.account_number).toBe("SMA-2026-000001");
    expect(commandAt(3).item.account_number).toBe("SMA-2026-000002");
  });

  it("looks up a newly registered user server-side instead of accepting an account number", async () => {
    request
      .mockResolvedValueOnce([{ id: "user-1" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        id: "profile-1",
        user: "user-1",
        account_number: "SMA-2026-456789"
      });

    await expect(ensureRegisteredUserAccountNumber("ali@example.com")).resolves.toEqual({
      ok: true,
      accountNumber: expect.stringMatching(/^SMA-\d{4}-\d{6}$/)
    });
    expect(commandAt(0)).toMatchObject({
      operation: "readUsers",
      query: { fields: ["id"], filter: { email: { _eq: "ali@example.com" } }, limit: 1 }
    });
    expect(commandAt(2).item).toEqual({
      user: "user-1",
      account_number: expect.stringMatching(/^SMA-\d{4}-\d{6}$/)
    });
    expect(commandAt(2).item).not.toHaveProperty("email");
  });
});
