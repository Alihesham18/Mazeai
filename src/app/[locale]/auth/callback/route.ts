import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/i18n/routing";

function safeNext(value: string | null, locale: string) {
  const localeRoot = `/${locale}`;
  return value === localeRoot || value?.startsWith(`${localeRoot}/`) ? value : `${localeRoot}/account`;
}

export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : "en";
  const token = request.nextUrl.searchParams.get("token");
  const destination = safeNext(request.nextUrl.searchParams.get("next"), locale);

  if (token) {
    const url = new URL(destination, request.url);
    url.searchParams.set("token", token);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(`/${locale}/login?error=callback`, request.url));
}
