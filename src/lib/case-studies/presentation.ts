import type { CaseStudy } from "@/lib/directus/case-studies";

const internalDemonstrationSlugs = new Set(["ai-document-automation"]);
const placeholderContent = new Set([
  "a longer description of the project can go here. for now, a short paragraph is enough for testing."
]);

export function isInternalDemonstration(caseStudy: Pick<CaseStudy, "client" | "slug">) {
  return (
    internalDemonstrationSlugs.has(caseStudy.slug) ||
    caseStudy.client?.trim().toLocaleLowerCase("en-US") === "synergymazeai demo"
  );
}

export function hasPublishableCaseStudyContent(content: string | null) {
  if (!content) return false;
  return !placeholderContent.has(content.trim().toLocaleLowerCase("en-US"));
}
