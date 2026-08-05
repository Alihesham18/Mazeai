import type { LucideIcon } from "lucide-react";

export interface LocalizedText {
  en: string;
  tr: string;
  ar: string;
}

export interface NavItem {
  labelKey: string;
  href: string;
  children?: NavItem[];
}

export interface CardContent {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  eyebrow?: LocalizedText;
  icon?: LucideIcon;
  meta?: LocalizedText;
}

export interface EventContent extends CardContent {
  date: string;
  format: LocalizedText;
  location: LocalizedText;
  type: LocalizedText;
}

export interface PublicationContent extends CardContent {
  year: string;
  fileType: string;
  fileSize: string;
}
