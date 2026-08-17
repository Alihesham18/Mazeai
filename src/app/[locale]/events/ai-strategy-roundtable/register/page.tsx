import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";

export default function AiStrategyRoundtableRegisterPage({ params }: { params: { locale: Locale } }) {
  redirect(`${localizedPath(params.locale, "/events/ai-strategy-roundtable")}#registration`);
}
