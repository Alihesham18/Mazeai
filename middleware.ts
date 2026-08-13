import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/routing";
import {
  authPersistenceCookie,
  directusAccessTokenCookie,
  directusExpiresAtCookie,
  directusRefreshTokenCookie
} from "@/lib/directus/auth";
import { getDirectusUrl } from "@/lib/directus/client";

const internationalizationMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

export default async function middleware(request: NextRequest) {
  let response = internationalizationMiddleware(request);
  const directusUrl = getDirectusUrl();
  const refreshToken = request.cookies.get(directusRefreshTokenCookie)?.value;
  const expiresAt = Number(request.cookies.get(directusExpiresAtCookie)?.value);

  if (!directusUrl || !refreshToken || (Number.isFinite(expiresAt) && expiresAt > Date.now() + 10_000)) {
    return response;
  }

  const remember = request.cookies.get(authPersistenceCookie)?.value !== "false";

  try {
    const refreshResponse = await fetch(`${directusUrl}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" })
    });

    if (!refreshResponse.ok) {
      response.cookies.delete(directusAccessTokenCookie);
      response.cookies.delete(directusRefreshTokenCookie);
      response.cookies.delete(directusExpiresAtCookie);
      response.cookies.delete(authPersistenceCookie);
      return response;
    }

    const payload = await refreshResponse.json();
    const data = payload?.data ?? payload;
    const accessToken = typeof data.access_token === "string" ? data.access_token : "";
    const nextRefreshToken =
      typeof data.refresh_token === "string" ? data.refresh_token : refreshToken;
    const nextExpiresAt =
      typeof data.expires_at === "number"
        ? data.expires_at
        : Date.now() + (typeof data.expires === "number" ? data.expires : 0);

    if (!accessToken || !Number.isFinite(nextExpiresAt)) {
      return response;
    }

    const accessMaxAge = Math.max(1, Math.floor((nextExpiresAt - Date.now()) / 1000));
    const commonOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/"
    };
    const refreshOptions = {
      ...commonOptions,
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {})
    };

    request.cookies.set(directusAccessTokenCookie, accessToken);
    request.cookies.set(directusRefreshTokenCookie, nextRefreshToken);
    request.cookies.set(directusExpiresAtCookie, String(nextExpiresAt));
    response.cookies.set(directusAccessTokenCookie, accessToken, {
      ...commonOptions,
      maxAge: accessMaxAge
    });
    response.cookies.set(directusRefreshTokenCookie, nextRefreshToken, refreshOptions);
    response.cookies.set(directusExpiresAtCookie, String(nextExpiresAt), refreshOptions);
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|tr|ar|fa)/:path*"]
};
