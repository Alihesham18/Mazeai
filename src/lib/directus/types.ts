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
  telephone?: string | null;
  phone?: string | null;
}

export interface DirectusSchema {
  directus_users: DirectusWebsiteUser[];
}

export interface DirectusSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
