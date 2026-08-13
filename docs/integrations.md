# Integrations

Phase 1 adapters are safe placeholders:

- Sanity CMS: `src/lib/cms/adapter.ts`
- Directus auth, profiles, training programs, training applications, scholarship
  rules, and scholarship attempts: `src/lib/directus`
- Supabase database placeholder: `src/lib/database/adapter.ts`
- Resend email: `src/lib/email/adapter.ts`

The app must run without credentials. Real integration work should preserve data minimization, consent versioning, consent timestamps, source page, submission language, deletion workflows, and role-limited admin access.
