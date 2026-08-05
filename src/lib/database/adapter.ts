export interface DatabaseAdapterStatus {
  provider: "mock" | "supabase";
  ready: boolean;
}

export function getDatabaseAdapterStatus(): DatabaseAdapterStatus {
  return {
    provider: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase" : "mock",
    ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  };
}
