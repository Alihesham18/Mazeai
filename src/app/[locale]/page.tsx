import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/sections/HomePage";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${params.locale}`
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        email: siteConfig.email,
        address: {
          "@type": "PostalAddress",
          addressCountry: "TR"
        }
      })
    }
  };
}

export default function LocaleHomePage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  return <HomePage locale={params.locale} />;
}
