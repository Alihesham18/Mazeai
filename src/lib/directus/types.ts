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
  account_number: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
}

export type DirectusPhoneProfile = Pick<
  DirectusUserProfile,
  "id" | "account_number" | "phone_country_code" | "phone_number"
>;

export interface DirectusTrainingProgram {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: string | null;
  duration_hours: number | null;
  fee: number | string | null;
  currency: string | null;
  location: string | null;
  certificate_available: boolean;
  instructor_name: string | null;
  instructor_role: string | null;
  short_description: string | null;
  about: string | null;
  image_url: string | null;
  application_open: boolean;
  status: string;
  translations?: DirectusTrainingProgramTranslation[] | null;
  content_items?: DirectusTrainingProgramContentItem[] | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface DirectusTrainingProgramTranslation {
  id: string;
  training_program: string | DirectusTrainingProgram;
  language: string;
  title: string | null;
  short_description: string | null;
  description: string | null;
  image_alt: string | null;
  hours_breakdown: string | null;
  instructor_role: string | null;
  instructor_bio: string | null;
  requirements: string | null;
  target_audience: string | null;
  prerequisites: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface DirectusTrainingProgramContentItemTranslation {
  id: string;
  content_item: string | DirectusTrainingProgramContentItem;
  language: string;
  title: string | null;
  description: string | null;
}

export interface DirectusTrainingProgramContentItem {
  id: string;
  training_program: string | DirectusTrainingProgram;
  kind: "curriculum" | "weekly_plan" | string;
  sort: number | null;
  starts_at: string | null;
  ends_at: string | null;
  translations?: DirectusTrainingProgramContentItemTranslation[] | null;
}

export type TrainingApplicationStatus = "submitted" | "under_review" | "accepted" | "rejected";

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

export interface DirectusScholarshipRule {
  id: string;
  training_program: string | Pick<DirectusTrainingProgram, "id"> | null;
  minimum_percentage: number;
  discount_percentage: number;
  active: boolean;
}

export interface DirectusScholarshipExamAttempt {
  id: string;
  user: string | DirectusWebsiteUser;
  training_program: string | Pick<DirectusTrainingProgram, "id" | "slug" | "title" | "currency">;
  score: number;
  total_questions: number;
  percentage: number;
  scholarship_percentage: number | null;
  discount_code: string | null;
  status: import("@/lib/scholarship/types").ScholarshipAttemptStatus;
  date_created: string | null;
  date_updated?: string | null;
}

export type DiscountType = "percentage" | "fixed";
export type DiscountAppliesTo = "all" | "training" | "scholarship_exam" | "event" | "service";
export type DiscountRedemptionStatus = "available" | "used" | "revoked";

export interface DirectusDiscountCode {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  currency: string | null;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  max_redemptions_per_user: number | null;
  applies_to: DiscountAppliesTo;
  is_active: boolean;
  stackable: boolean;
  reserved_for_user: string | DirectusWebsiteUser | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface DirectusDiscountRedemption {
  id: string;
  user: string | DirectusWebsiteUser;
  discount_code: string | DirectusDiscountCode;
  status: DiscountRedemptionStatus;
  used_at: string | null;
  used_for_type: Exclude<DiscountAppliesTo, "all"> | null;
  used_for_id: string | null;
  original_amount: number | string | null;
  discount_amount: number | string | null;
  final_amount: number | string | null;
  currency: string | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface DirectusEvent {
  id: number;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  format: string | null;
  image_url: string | null;
  registration_open: boolean;
  capacity: number | null;
  status: string;
}

export type EventRegistrationStatus = "registered" | "attended" | "cancelled";

export interface DirectusEventRegistration {
  id: string;
  date_created: string | null;
  date_updated: string | null;
  user: string | DirectusWebsiteUser;
  event: number | DirectusEvent;
  phone_country_code: string | null;
  phone_number: string | null;
  message: string | null;
  status: EventRegistrationStatus;
}

export interface DirectusCaseStudyTranslation {
  id: string;
  case_study?: string | DirectusCaseStudy;
  language: string;
  title: string | null;
  short_description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  content: string | null;
}

export interface DirectusCaseStudy {
  id: string;
  slug: string;
  status: string;
  featured: boolean | null;
  published_at: string | null;
  cover_image: string | { id: string } | null;
  industry: string | null;
  client: string | null;
  sort: number | null;
  technologies: unknown;
  translations: DirectusCaseStudyTranslation[] | null;
}

export interface DirectusSchema {
  directus_users: DirectusWebsiteUser[];
  user_profiles: DirectusUserProfile[];
  training_programs: DirectusTrainingProgram[];
  training_program_translations: DirectusTrainingProgramTranslation[];
  training_program_content_items: DirectusTrainingProgramContentItem[];
  training_program_content_item_translations: DirectusTrainingProgramContentItemTranslation[];
  training_applications: DirectusTrainingApplication[];
  scholarship_rules: DirectusScholarshipRule[];
  scholarship_exam_attempts: DirectusScholarshipExamAttempt[];
  discount_codes: DirectusDiscountCode[];
  discount_redemptions: DirectusDiscountRedemption[];
  event: DirectusEvent[];
  event_registrations: DirectusEventRegistration[];
  case_studies: DirectusCaseStudy[];
  case_study_translations: DirectusCaseStudyTranslation[];
}

export interface DirectusSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
