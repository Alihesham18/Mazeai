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

export interface DirectusTrainingProgram {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: string | null;
  duration_hours: number | null;
  fee: number | null;
  location: string | null;
  certificate_available: boolean;
  instructor_name: string | null;
  instructor_role: string | null;
  short_description: string | null;
  about: string | null;
  image_url: string | null;
  application_open: boolean;
  status: string;
  date_created?: string | null;
  date_updated?: string | null;
}

export type TrainingApplicationStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected";

export interface DirectusTrainingApplication {
  id: string;
  user: string | DirectusWebsiteUser;
  training_program: string | DirectusTrainingProgram;
  phone_country_code: string | null;
  phone_number: string | null;
  message: string | null;
  status: TrainingApplicationStatus;
  date_created: string | null;
  date_updated: string | null;
}

export interface DirectusSchema {
  directus_users: DirectusWebsiteUser[];
  user_profiles: DirectusUserProfile[];
  training_programs: DirectusTrainingProgram[];
  training_applications: DirectusTrainingApplication[];
}

export interface DirectusSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
