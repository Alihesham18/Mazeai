"use server";

import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/routing";
import {
  createCurrentUserTrainingApplication,
  getPublishedTrainingProgramBySlug
} from "@/lib/directus/training";
import { profileSchema } from "@/lib/auth/validation";
import { splitPhoneForStorage } from "@/lib/phone/normalize";

export type TrainingApplicationMessage =
  | "applicationSubmitted"
  | "alreadyApplied"
  | "applicationClosed"
  | "applicationFailed"
  | "invalidPhone"
  | "programUnavailable"
  | "sessionExpired";

export interface TrainingApplicationActionState {
  status: "idle" | "error" | "success";
  message?: TrainingApplicationMessage;
}

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

export async function submitTrainingApplicationAction(
  localeValue: string,
  slug: string,
  _previousState: TrainingApplicationActionState,
  formData: FormData
): Promise<TrainingApplicationActionState> {
  const locale: Locale = isLocale(localeValue) ? localeValue : "en";
  const phone = profileSchema.shape.telephone.safeParse(value(formData, "phone"));
  const message = value(formData, "message").trim();

  if (!phone.success) return { status: "error", message: "invalidPhone" };
  if (message.length > 2000) return { status: "error", message: "applicationFailed" };

  const programResult = await getPublishedTrainingProgramBySlug(slug);
  if (!programResult.ok) {
    return {
      status: "error",
      message: programResult.error === "sessionExpired" ? "sessionExpired" : "programUnavailable"
    };
  }
  if (!programResult.data) return { status: "error", message: "programUnavailable" };
  if (!programResult.data.application_open) {
    return { status: "error", message: "applicationClosed" };
  }

  const splitPhone = splitPhoneForStorage(phone.data);
  const result = await createCurrentUserTrainingApplication({
    programId: programResult.data.id,
    phoneCountryCode: splitPhone.phone_country_code,
    phoneNumber: splitPhone.phone_number,
    message: message || null
  });

  if (!result.ok) {
    if (result.error === "alreadyApplied") return { status: "error", message: "alreadyApplied" };
    if (result.error === "sessionExpired") return { status: "error", message: "sessionExpired" };
    return { status: "error", message: "applicationFailed" };
  }

  revalidatePath(`/${locale}/account`);
  revalidatePath(`/${locale}/training/${slug}`);
  return { status: "success", message: "applicationSubmitted" };
}
