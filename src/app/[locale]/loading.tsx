import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("states");
  return <p role="status" aria-live="polite">{t("loading")}</p>;
}
