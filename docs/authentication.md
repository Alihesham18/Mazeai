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

Controlled administrator-initiated resets, managed-role permissions, and the
user-management audit collection are documented in
[`admin-user-management.md`](./admin-user-management.md).

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
the database uniqueness constraint. The persisted attempt code is synchronized
to `discount_codes` with the server-only `DIRECTUS_DISCOUNT_SERVICE_TOKEN`, is
reserved to the authenticated Directus user, and is limited to one training
redemption. Existing eligible attempts are backfilled from their stored code;
visiting the account page never generates a replacement code. No scholarship
expiry setting exists in the current project, so synchronized codes have a null
`expires_at` value. My Account reads saved attempts through the current Website
User session.

The answer payload is size-bounded and accepts only exact question-ID/selected-
option pairs. The server verifies that the Directus program slug matches the
official exam, requires every official question exactly once, validates option
bounds, and derives score, question count, percentage, status, award, and code
without accepting any of those values from the browser.

Per-code in-process locks and re-reads make synchronization idempotent within an
application instance. The unique index on `discount_codes.code` resolves races
between instances without claiming an unrelated code. Absolute transactional
coupling between attempt creation and discount creation would require a Directus
transaction/flow or an additional database constraint; the UI therefore marks a
code ready only after synchronization succeeds and retries historic synchronization
from the persisted attempt.

Scholarship exam submission is limited to one official attempt per authenticated
user and training program. The existing-attempt query uses the Website User
session, filters only by `training_program`, and relies on the Directus
`user = $CURRENT_USER` policy rather than requesting or filtering the hidden
`user` field. Historic duplicates remain visible; the oldest attempt is used as
completion evidence. A per-user/per-program in-process lock plus a final re-read
reduces double submissions within one application instance. Absolute prevention
across multiple instances requires a database composite unique constraint or a
transactional Directus Flow; neither is created automatically.

Directus may persist a scholarship attempt while returning a null or partial
create response when the creating accountability cannot read the response
projection. The server therefore normalizes the response explicitly and, when
needed, re-reads the oldest attempt for the training through the Website User
session and ownership policy. A nullable `discount_code` remains a valid saved
state; discount reconciliation runs only when a persisted code is available.

Event registration creates, duplicate checks, and account-history reads use the
authenticated Website User session. Directus continues to assign and enforce
ownership with `$CURRENT_USER`; the browser never supplies a user ID. The
server-only `DIRECTUS_EVENT_SERVICE_TOKEN` is used only to count all active
(`registered` or `attended`) registrations for an event when enforcing a finite
capacity. Cancelled registrations do not consume capacity, and a null capacity
is unlimited. The token must never use a `NEXT_PUBLIC_` prefix or be imported by
client modules.

Capacity is re-counted immediately before creation, but count-then-create is not
atomic across simultaneous requests and can still overbook under concurrency.
The implementation keeps the global count separate so it can later be replaced
by a transactional Directus Flow or database-backed transaction if strict
capacity enforcement becomes necessary.
