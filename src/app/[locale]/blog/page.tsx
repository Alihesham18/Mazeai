import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BlogOverviewPage } from "@/components/pages/BlogOverviewPage";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "pages.blog" });
  return {
    title: `${t("title")} | SynergyMazeAI`,
    description: t("description"),
    alternates: { canonical: `/${params.locale}/blog` }
  };
}

export default function BlogPage({ params }: { params: { locale: Locale } }) {
  return <BlogOverviewPage locale={params.locale} />;
}
