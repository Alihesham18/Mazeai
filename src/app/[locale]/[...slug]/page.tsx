import { createPageMetadata, StandalonePage } from "@/components/pages/StandalonePage";
import { getPageShell } from "@/data/page-shells";
import type { Locale } from "@/i18n/routing";

interface ShellPageProps {
  params: {
    locale: Locale;
    slug: string[];
  };
}

export function generateMetadata({ params }: ShellPageProps) {
  const shell = getPageShell(params.slug.join("/"));
  return createPageMetadata(shell)({ params });
}

export default function ShellPage({ params }: ShellPageProps) {
  const path = params.slug.join("/");
  const shell = getPageShell(path);

  return (
    <StandalonePage
      locale={params.locale}
      page={{ ...shell, legal: /privacy|cookies|terms|personal-data/.test(path) }}
    />
  );
}
