import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";

export default function EducationAiLabRegisterPage({ params }: { params: { locale: Locale } }) {
  redirect(`${localizedPath(params.locale, "/events/education-ai-lab")}#registration`);
}
