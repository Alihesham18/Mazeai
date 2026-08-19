export type TrainingCategory = "bootcamp" | "short-course";

export interface PublicTrainingContentItem {
  id: string;
  sort: number;
  title: string;
  description: string | null;
}

export interface PublicTrainingProgram {
  id: string;
  slug: string;
  status: "published";
  category: TrainingCategory;
  title: string;
  shortDescription: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  durationHours: number | null;
  location: string | null;
  format: string | null;
  instructor: string | null;
  instructorRole: string | null;
  fee: number | null;
  currency: string | null;
  certificate: boolean;
  hoursBreakdown: string | null;
  applicationOpen: boolean;
  curriculum: PublicTrainingContentItem[];
  weeklyPlan: PublicTrainingContentItem[];
}
