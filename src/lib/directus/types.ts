export interface DirectusUserRole {
  id: string;
  name?: string | null;
}

export interface DirectusWebsiteUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | DirectusUserRole | null;
  status?: string | null;
}

export interface DirectusUserProfile {
  id: string;
  user: string | DirectusWebsiteUser;
  phone_country_code: string | null;
  phone_number: string | null;
}

export type DirectusPhoneProfile = Pick<
  DirectusUserProfile,
  "id" | "phone_country_code" | "phone_number"
>;

export interface DirectusSchema {
  directus_users: DirectusWebsiteUser[];
  user_profiles: DirectusUserProfile[];
}

export interface DirectusSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
