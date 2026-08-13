export type AuthMessageCode =
  | "accountExists"
  | "backendUnavailable"
  | "checkEmail"
  | "configuration"
  | "emailInvalid"
  | "invalidCredentials"
  | "passwordMismatch"
  | "passwordUpdated"
  | "passwordWeak"
  | "invalidPhone"
  | "profileLoadFailed"
  | "profileUpdateFailed"
  | "profileUpdated"
  | "resetRequested"
  | "registrationSuccessful"
  | "serverFailure"
  | "sessionExpired"
  | "requiredFields";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: AuthMessageCode;
}

export const initialAuthActionState: AuthActionState = { status: "idle" };

export interface AuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  telephone: string;
}
