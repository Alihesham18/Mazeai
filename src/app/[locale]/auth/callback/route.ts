import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(value: string | null, locale: string) {
  const localeRoot = `/${locale}`;
  return value === localeRoot || value?.startsWith(`${localeRoot}/`) ? value : `${localeRoot}/account`;
}

export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : "en";
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeNext(request.nextUrl.searchParams.get("next"), locale);
  const supabase = createSupabaseServerClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(new URL(`/${locale}/login?error=callback`, request.url));
}
