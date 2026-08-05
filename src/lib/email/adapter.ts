export interface EmailAdapterStatus {
  provider: "mock" | "resend";
  ready: boolean;
}

export function getEmailAdapterStatus(): EmailAdapterStatus {
  return {
    provider: process.env.RESEND_API_KEY ? "resend" : "mock",
    ready: Boolean(process.env.RESEND_API_KEY)
  };
}
