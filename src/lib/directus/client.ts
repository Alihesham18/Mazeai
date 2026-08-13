import { createDirectus, rest } from "@directus/sdk";
import type { DirectusSchema } from "./types";

export function getDirectusUrl() {
  return process.env.NEXT_PUBLIC_DIRECTUS_URL?.replace(/\/$/, "") || null;
}

export function createDirectusRestClient() {
  const url = getDirectusUrl();

  if (!url) {
    return null;
  }

  return createDirectus<DirectusSchema>(url).with(rest());
}
