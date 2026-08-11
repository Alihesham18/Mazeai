import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
//import { InteractiveBackground } from "@/components/effects/InteractiveBackground";
import { PageBackground } from "@/components/effects/PageBackground";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { siteConfig } from "@/config/site";
import { getDirection, isLocale, locales, type Locale } from "@/i18n/routing";

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = await getTranslations({ locale: params.locale, namespace: "meta" });
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${siteConfig.url}/${locale}`])
  );

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: `/${params.locale}`,
      languages
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteConfig.url}/${params.locale}`,
      siteName: siteConfig.name,
      locale: params.locale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description")
    }
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "common" });
  const direction = getDirection(locale);

  const themeScript = `(() => { try { const saved = localStorage.getItem("synergymazeai-theme"); const theme = saved === "light" || saved === "dark" ? saved : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); document.documentElement.dataset.theme = theme; } catch { document.documentElement.dataset.theme = "dark"; } })();`;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {/* <InteractiveBackground /> */}
            <PageBackground />
            <a className="skip-link" href="#main-content">
              {t("skip")}
            </a>
            <Header locale={locale} />
            <main id="main-content">{children}</main>
            <Footer locale={locale} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
