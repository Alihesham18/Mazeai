export type AuthMessageCode =
  | "accountExists"
  | "checkEmail"
  | "configuration"
  | "emailInvalid"
  | "invalidCredentials"
  | "passwordMismatch"
  | "passwordUpdated"
  | "passwordWeak"
  | "profileUpdated"
  | "resetRequested"
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
