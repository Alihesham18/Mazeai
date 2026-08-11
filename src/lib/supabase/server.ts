import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authPersistenceCookie, getSupabaseConfig, supabaseCookieOptions } from "./config";

interface ServerClientOptions {
  remember?: boolean;
}

function sessionCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  remember: boolean
): T {
  if (remember || options.maxAge === 0) {
    return options;
  }

  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions as T;
}

export function createSupabaseServerClient(options: ServerClientOptions = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const cookieStore = cookies();
  const remember =
    options.remember ?? cookieStore.get(authPersistenceCookie)?.value !== "false";

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(name, value, sessionCookieOptions(cookieOptions, remember));
          });
        } catch {
          // Server Components cannot write cookies; middleware refreshes them.
        }
      }
    }
  });
}
