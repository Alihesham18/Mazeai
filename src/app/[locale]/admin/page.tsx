import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "adminAuth" });

  return (
    <section>
      <Container>
        <h1>{t("title")}</h1>
        <p>{t("confirmed")}</p>
      </Container>
    </section>
  );
}
