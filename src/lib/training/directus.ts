import type { DirectusTrainingProgram } from "@/lib/directus/types";
import { getDirectusUrl } from "@/lib/directus/client";
import { getTrainingProgram, trainingPrograms, type TrainingProgram } from "@/data/training-programs";
import type { LocalizedText } from "@/types/content";

function localized(value: string): LocalizedText {
  return { en: value, tr: value, ar: value, fa: value };
}

function imageUrl(value: string | null, fallback: string) {
  if (!value) return fallback;
  if (/^https?:\/\//.test(value)) return value;
  const directusUrl = getDirectusUrl();
  return directusUrl ? `${directusUrl}${value.startsWith("/") ? "" : "/"}${value}` : fallback;
}

export function mergeDirectusTrainingProgram(
  local: TrainingProgram,
  directus: DirectusTrainingProgram
): TrainingProgram {
  const duration = directus.duration_hours
    ? {
        en: `${directus.duration_hours} hours`,
        tr: `${directus.duration_hours} saat`,
        ar: `${directus.duration_hours} ساعة`,
        fa: `${directus.duration_hours} ساعت`
      }
    : local.duration;

  return {
    ...local,
    directusId: directus.id,
    title: localized(directus.title),
    category:
      directus.category === "short-course" || directus.category === "bootcamp"
        ? directus.category
        : local.category,
    format: directus.format ? localized(directus.format) : local.format,
    duration,
    fee: directus.fee ?? local.fee,
    location: directus.location ? localized(directus.location) : local.location,
    certificate: directus.certificate_available,
    instructor: directus.instructor_name || local.instructor,
    instructorRole: directus.instructor_role
      ? localized(directus.instructor_role)
      : local.instructorRole,
    shortDescription: directus.short_description
      ? localized(directus.short_description)
      : local.shortDescription,
    description: directus.about ? localized(directus.about) : local.description,
    image: imageUrl(directus.image_url, local.image),
    applicationOpen: directus.application_open,
    directusAvailable: true
  };
}

export function mergePublishedTrainingPrograms(directusPrograms: DirectusTrainingProgram[]) {
  return directusPrograms.flatMap((directus) => {
    const local = getTrainingProgram(directus.slug);
    return local ? [mergeDirectusTrainingProgram(local, directus)] : [];
  });
}

export function unavailableTrainingPrograms(allowLoginRedirect = false) {
  return trainingPrograms.map((program) => ({
    ...program,
    applicationOpen: allowLoginRedirect,
    directusAvailable: false
  }));
}
