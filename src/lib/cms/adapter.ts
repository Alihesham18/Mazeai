export interface CmsAdapterStatus {
  provider: "mock" | "sanity";
  ready: boolean;
}

export function getCmsAdapterStatus(): CmsAdapterStatus {
  return {
    provider: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? "sanity" : "mock",
    ready: Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
  };
}
