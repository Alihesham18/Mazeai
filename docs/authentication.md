# Authentication setup

SynergyMazeAI uses Directus authentication through the official `@directus/sdk`.
Login, registration, logout, password reset, and current-user reads run through
server-side Next.js actions/utilities; browser components do not call Directus
directly and do not receive access or refresh tokens.

## Required environment variables

Set the Directus project URL in each environment:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-domain.example
```

Do not add Directus admin tokens, database credentials, or static user tokens to
the frontend environment.

## Directus configuration

1. Enable public user registration in Directus.
2. Configure the default registration role as `Website User`.
3. Keep role assignment backend-controlled; the frontend never submits `role`.
4. Configure password reset URLs for each localized callback origin if password
   reset emails are enabled:

```text
https://your-production-domain.example/en/auth/callback
https://your-production-domain.example/tr/auth/callback
https://your-production-domain.example/ar/auth/callback
https://your-production-domain.example/fa/auth/callback
```

5. Add equivalent localhost callback URLs for development.
6. Configure production mail delivery before launch.
7. Review Directus rate limits, password policy, and user status handling before
   public registration opens.

## Account profile persistence

Directus system users store account identity fields: first name, last name, and
email. Email remains read-only in the account form. First and last name updates
use the authenticated `/users/me` endpoint and require the Website User policy
to permit only those two fields for the current user.

Telephone data is stored in the `user_profiles` collection as separate
`phone_country_code` and `phone_number` fields. Profile reads rely on the
collection policy's `$CURRENT_USER` filter. Creates omit the `user` field so the
Directus preset assigns ownership, and updates use only an ID obtained from that
policy-scoped read. A uniqueness conflict during creation is handled by reading
the current user's row again and updating it.

Training pre-registration uses authenticated server actions and the
`training_applications` collection. The server resolves a published program by
route slug, checks for an existing current-user application, and creates only
the relationship, split phone fields, and optional message. Directus presets
the current user and `submitted` status; neither is accepted from browser form
state. The account page reads the current user's applications and displays the
related program, status, and application date.

Scholarship exams submit only question IDs and selected option indexes to a
server action. The server identifies the current Directus user from the
HttpOnly session, resolves the published training program by slug, scores
against a server-only answer key, applies active `scholarship_rules`, and saves
the trusted result to `scholarship_exam_attempts`. Creation uses the dedicated,
server-only `DIRECTUS_SCHOLARSHIP_TOKEN`; Website Users retain read-only access
to their own attempts. Eligible discount codes use cryptographic randomness and
the database uniqueness constraint. My Account reads saved attempts through the
current Website User session.

Event registrations are not persisted by the current website, so that account
section keeps an honest empty state.
