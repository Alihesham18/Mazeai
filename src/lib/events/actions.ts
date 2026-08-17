"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/auth/validation";
import {
  createCurrentUserEventRegistration,
  getPublishedEventBySlug
} from "@/lib/directus/events";
import { isLocale, type Locale } from "@/i18n/routing";
import { splitPhoneForStorage } from "@/lib/phone/normalize";

export type EventRegistrationMessage =
  | "registrationSuccessful"
  | "alreadyRegistered"
  | "registrationClosed"
  | "eventFull"
  | "invalidPhone"
  | "registrationFailed"
  | "sessionExpired";

export interface EventRegistrationActionState {
  status: "idle" | "error" | "success";
  message?: EventRegistrationMessage;
}

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

export async function submitEventRegistrationAction(
  localeValue: string,
  slug: string,
  _previousState: EventRegistrationActionState,
  formData: FormData
): Promise<EventRegistrationActionState> {
  const locale: Locale = isLocale(localeValue) ? localeValue : "en";
  const phone = profileSchema.shape.telephone.safeParse(value(formData, "phone"));
  const message = value(formData, "message").trim();
  if (!phone.success) return { status: "error", message: "invalidPhone" };
  if (message.length > 2000) return { status: "error", message: "registrationFailed" };

  const eventResult = await getPublishedEventBySlug(slug);
  if (!eventResult.ok || !eventResult.data) {
    return { status: "error", message: "registrationFailed" };
  }
  if (!eventResult.data.registration_open) {
    return { status: "error", message: "registrationClosed" };
  }

  const splitPhone = splitPhoneForStorage(phone.data);
  const result = await createCurrentUserEventRegistration({
    event: eventResult.data,
    phoneCountryCode: splitPhone.phone_country_code,
    phoneNumber: splitPhone.phone_number,
    message: message || null
  });
  if (!result.ok) return { status: "error", message: result.error };

  revalidatePath(`/${locale}/events/${slug}`);
  revalidatePath(`/${locale}/account/event-registrations`);
  return { status: "success", message: "registrationSuccessful" };
}
