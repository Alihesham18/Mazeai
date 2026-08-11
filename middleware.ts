import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/routing";
import {
  authPersistenceCookie,
  getSupabaseConfig,
  supabaseCookieOptions
} from "@/lib/supabase/config";

const internationalizationMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

export default async function middleware(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = internationalizationMiddleware(request);

  if (!config) {
    return response;
  }

  const remember = request.cookies.get(authPersistenceCookie)?.value !== "false";
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => {
          const responseOptions = { ...options };
          if (!remember && responseOptions.maxAge !== 0) {
            delete responseOptions.maxAge;
            delete responseOptions.expires;
          }
          response.cookies.set(name, value, responseOptions);
        });
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      }
    }
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/", "/(en|tr|ar|fa)/:path*"]
};
