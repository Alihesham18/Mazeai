"use client";

import { useTranslations } from "next-intl";

export default function Error() {
  const t = useTranslations("states");
  return (
    <div role="alert">
      <h1>{t("error")}</h1>
    </div>
  );
}
