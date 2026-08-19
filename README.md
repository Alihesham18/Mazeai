# SynergyMazeAI Website

Production-oriented multilingual website foundation for **SynergyMazeAI**, an AI, research and development, and education partner based in Türkiye.

## Stack

- Next.js App Router, React, strict TypeScript
- `next-intl` for `/en`, `/tr`, and `/ar` routing
- CSS Modules plus global design tokens
- Zod validation schemas, React Hook Form dependency ready for Phase 3 forms
- Lucide React icons
- Vitest, React Testing Library, and Playwright scaffolding

## Local Setup

Requires Node.js 20 or newer. This workspace was created with Node `v24.13.1`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/en`.

## Commands

```bash
npm run type-check
npm run lint
npm run test:run
npm run build
npm run format:check
```

## Environment

Copy `.env.example` values into your deployment environment as needed. Missing Sanity, Supabase, Resend, and Sentry credentials do not crash the MVP; adapters report mock mode until credentials are added.

## Folder Structure

- `src/app`: App Router routes, sitemap, robots, localized shells
- `src/components`: layout, navigation, UI primitives, cards, sections
- `src/data`: typed local mock content and navigation architecture
- `src/i18n`: locale configuration and request loading
- `src/lib`: integration adapters, validation, utilities
- `messages`: English, Turkish, Arabic dictionaries
- `docs`: implementation notes and launch guidance

## Internationalization and RTL

All public routes are locale-prefixed. English and Turkish use `dir="ltr"`; Arabic uses `dir="rtl"` at the document level. CSS uses logical properties so navigation, spacing, and layouts mirror naturally without flipping logos or universal icons.

## Content Architecture

Mock services, projects, publications, events, case studies, team-ready shells, and partner-ready shells live in `src/data`. Placeholder metrics and testimonials are explicitly fictional.

### Blog

Directus is the source of truth for Blog content through `blog_posts` and
`blog_post_translations`. Published Blog catalog and detail content is read anonymously for
English, Turkish, Arabic, and Farsi at `/[locale]/blog` and `/[locale]/blog/[slug]`.

## Integrations Plan

- Sanity: replace mock data repositories with CMS-backed fetchers.
- Supabase PostgreSQL: persist registrations, applications, bookings, consent metadata, and admin workflows.
- Supabase Storage: host downloadable publications.
- Resend: send notification and confirmation emails.
- Sentry: enable client/server error monitoring with `NEXT_PUBLIC_SENTRY_DSN`.

## Temporary Logo

The current `Logo` component is text-based and intentionally simple. Replace `src/components/ui/Logo/Logo.tsx` with the official logo once available, keeping the accessible label and avoiding RTL mirroring.

## Adding Content

Add mock content in `src/data/mock-content.ts`, localize visible strings, then link it from a page or section component. Do not add real partner, client, publication, metric, or testimonial claims until verified.

## Adding a Locale

Add the locale to `src/i18n/routing.ts`, create `messages/{locale}.json`, update metadata alternates, and test `lang`, `dir`, navigation, and language switching.

## Adding a Page

For Phase 1 shells, add an entry to `src/data/page-shells.ts`. For a fully designed route, create a dedicated App Router page and reusable components under `src/components`.

## Remaining Tasks

Phase 2 should replace the remaining route shells with fully designed services, R&D, events, case studies, about, team, partners, contact, and legal pages. Phase 3 should implement accessible React Hook Form flows and mock API submissions.
