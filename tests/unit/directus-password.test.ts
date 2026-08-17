import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet, request } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  request: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: cookieGet,
    set: vi.fn(),
    delete: vi.fn()
  })
}));

vi.mock("@directus/sdk", () => ({
  isDirectusError: (error: unknown) =>
    Boolean(error && typeof error === "object" && "errors" in error),
  login: (input: unknown, options: unknown) => ({ operation: "login", input, options }),
  logout: (input: unknown) => ({ operation: "logout", input }),
  passwordRequest: vi.fn(),
  passwordReset: vi.fn(),
  readMe: (query: unknown) => ({ operation: "readMe", query }),
  refresh: vi.fn(),
  registerUser: vi.fn(),
  updateMe: (item: unknown) => ({ operation: "updateMe", item }),
  withToken: (token: string, command: unknown) => ({ token, command })
}));

vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));

import {
  changeCurrentDirectusPassword,
  directusAccessTokenCookie,
  directusExpiresAtCookie,
  directusRefreshTokenCookie
} from "@/lib/directus/auth";

function authenticatedCookies() {
  cookieGet.mockImplementation((name: string) => {
    const values: Record<string, string> = {
      [directusAccessTokenCookie]: "current-access-token",
      [directusRefreshTokenCookie]: "current-refresh-token",
      [directusExpiresAtCookie]: String(Date.now() + 60_000)
    };
    return values[name] ? { value: values[name] } : undefined;
  });
}

function directusCommandAt(index: number) {
  const call = request.mock.calls[index][0];
  return call.command ?? call;
}

describe("authenticated Directus password change", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    request.mockReset();
  });

  it("verifies the current password and updates through a temporary authenticated session", async () => {
    authenticatedCookies();
    request
      .mockResolvedValueOnce({ email: "ali@example.com" })
      .mockResolvedValueOnce({
        access_token: "verification-access-token",
        refresh_token: "verification-refresh-token",
        expires: 60_000,
        expires_at: null
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await changeCurrentDirectusPassword({
      currentPassword: "current-secret",
      newPassword: "new-secret-value"
    });

    expect(result).toEqual({ ok: true });
    expect(directusCommandAt(1)).toMatchObject({
      operation: "login",
      input: { email: "ali@example.com", password: "current-secret" }
    });
    expect(request.mock.calls[2][0]).toMatchObject({
      token: "verification-access-token",
      command: { operation: "updateMe", item: { password: "new-secret-value" } }
    });
    expect(directusCommandAt(3)).toMatchObject({
      operation: "logout",
      input: { refresh_token: "verification-refresh-token", mode: "json" }
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("rejects an incorrect current password without attempting an update", async () => {
    authenticatedCookies();
    request
      .mockResolvedValueOnce({ email: "ali@example.com" })
      .mockRejectedValueOnce({ errors: [{ message: "Invalid user credentials" }] });

    await expect(
      changeCurrentDirectusPassword({
        currentPassword: "wrong-secret",
        newPassword: "new-secret-value"
      })
    ).resolves.toEqual({ ok: false, error: "invalidCredentials" });
    expect(request).toHaveBeenCalledTimes(2);
    expect(
      request.mock.calls.some(([call]) => (call.command ?? call).operation === "updateMe")
    ).toBe(false);
  });

  it("rejects an unauthenticated request before credentials reach Directus", async () => {
    cookieGet.mockReturnValue(undefined);

    await expect(
      changeCurrentDirectusPassword({
        currentPassword: "current-secret",
        newPassword: "new-secret-value"
      })
    ).resolves.toEqual({ ok: false, error: "sessionExpired" });
    expect(request).not.toHaveBeenCalled();
  });
});
