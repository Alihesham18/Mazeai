# Integrations

Phase 1 adapters are safe placeholders:

- Sanity CMS: `src/lib/cms/adapter.ts`
- Supabase database: `src/lib/database/adapter.ts`
- Resend email: `src/lib/email/adapter.ts`

The app must run without credentials. Real integration work should preserve data minimization, consent versioning, consent timestamps, source page, submission language, deletion workflows, and role-limited admin access.
