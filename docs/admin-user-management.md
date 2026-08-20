# Controlled admin user management

Task 4B manages only the two MazeAI application roles: **Website User** and
**Website Admin**. Directory reads and every mutation run on the server. Browser
code receives normalized role values (`websiteUser` and `websiteAdmin`), never
Directus role UUIDs or credentials.

## Architecture and security invariants

- `requireAdmin()` runs inside every status, role, password-reset, and activity-
  history service. The admin layout is not treated as mutation authorization.
- Directory/detail queries are restricted to the UUIDs configured by
  `DIRECTUS_WEBSITE_USER_ROLE_ID` and `DIRECTUS_ADMIN_ROLE_ID`. Other Directus,
  service, migration, and automation roles are excluded even if Directus returns
  an unexpected record.
- Status changes retain the Task 4B.1 rule: Website Users only, `active` to
  `suspended` or `suspended` to `active`, using the authenticated Website Admin
  session and a status-only update.
- Role changes accept only `websiteUser` or `websiteAdmin`. The server reads the
  target's current role, maps the requested value to an environment-configured
  UUID, blocks self-demotion, and verifies at least one other active Website Admin
  before demotion. An unreadable or invalid count fails closed. Role changes are
  serialized inside each application process to narrow count/update races.
- Role writes and audit creates use the dedicated server-only
  `DIRECTUS_USER_MANAGEMENT_TOKEN`. It must not use a `NEXT_PUBLIC_` prefix or be
  shared with browser code. Its Directus role must have Admin Access and App/Data
  Studio Access disabled.
- Password reset accepts a target UUID and locale only. The target email and role
  are loaded server-side. The existing Directus password-reset email request uses
  the trusted `NEXT_PUBLIC_SITE_URL` plus a validated locale callback. No password,
  reset token, Directus token, hash, or raw provider response reaches the admin.
- Buttons remain disabled while a request is pending. Directus remains responsible
  for provider/API-level password-reset throttling; configure and verify its rate
  limit in staging. No insecure temporary-password fallback exists.
- Successful primary operations attempt a best-effort audit write. If the audit
  write fails, the primary result remains successful and a server diagnostic is
  recorded. Directus cannot atomically transact a `directus_users` update/password
  request with a custom collection create, so the UI does not claim transaction
  semantics.

## Required environment variables

Configure these values in each server runtime and restart or redeploy:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-domain.example
DIRECTUS_WEBSITE_USER_ROLE_ID=...
DIRECTUS_ADMIN_ROLE_ID=...
DIRECTUS_USER_MANAGEMENT_TOKEN=...
```

Do not commit real UUIDs or tokens. `NEXT_PUBLIC_SITE_URL` must be the canonical
trusted application origin; it is not derived from a request header.

## Directus `admin_activity` collection

Create one collection named `admin_activity`. Hide it from normal users/Data
Studio navigation where practical. Do not grant any Website User permissions.

| Field                 | Directus type           | Configuration                                         |
| --------------------- | ----------------------- | ----------------------------------------------------- |
| `id`                  | UUID                    | Primary key; generated automatically                  |
| `action`              | String, length 64       | Required; allow only the four values below            |
| `administrator`       | M2O to `directus_users` | Required                                              |
| `administrator_email` | String, length 254      | Required immutable snapshot                           |
| `target_user`         | M2O to `directus_users` | Required                                              |
| `target_email`        | String, length 254      | Required immutable snapshot                           |
| `previous_value`      | String, length 64       | Nullable                                              |
| `new_value`           | String, length 64       | Nullable                                              |
| `date_created`        | DateTime                | Special field `date-created`; generated automatically |

Allowlisted `action` values:

```text
user.suspended
user.activated
user.role_changed
user.password_reset_requested
```

The collection must not contain passwords, hashes, reset/access/refresh tokens,
cookies, service credentials, or raw error payloads.

## Exact Directus permissions

Apply these changes in staging first and take a Directus/database backup before
production changes. Placeholder role names below mean the UUID stored in the
matching environment variable.

### Policy: Website Admin / Website Admin policy

Keep the existing Task 4B.1 update permission intact:

- Collection: `directus_users`
- Operation: Update
- Item filter: `{ "role": { "_eq": "WEBSITE_USER_ROLE_UUID" } }`
- Allowed fields: `status` only
- Validation: `{ "status": { "_in": ["active", "suspended"] } }`

Expand the directory read permission (do not add write fields):

- Collection: `directus_users`
- Operation: Read
- Item filter:
  `{ "role": { "_in": ["WEBSITE_USER_ROLE_UUID", "WEBSITE_ADMIN_ROLE_UUID"] } }`
- Allowed fields: `id`, `first_name`, `last_name`, `email`, `status`,
  `last_access`, `role`
- Validation: not applicable

Retain or add the existing profile lookup used by the directory:

- Collection: `user_profiles`
- Operation: Read
- Item filter:
  `{ "user": { "role": { "_in": ["WEBSITE_USER_ROLE_UUID", "WEBSITE_ADMIN_ROLE_UUID"] } } }`
- Allowed fields: `user`, `account_number`
- Validation: not applicable

Allow administrators to view the dedicated audit collection:

- Collection: `admin_activity`
- Operation: Read
- Item filter: `{}` (all records in this dedicated safe-metadata collection)
- Allowed fields: `id`, `action`, `administrator`, `administrator_email`,
  `target_user`, `target_email`, `previous_value`, `new_value`, `date_created`
- Validation: not applicable
- Create, Update, Delete, Share: no access

Do not add `role` to the Website Admin `directus_users` update permission. Role
updates deliberately use the isolated service policy below.

### Policy: Admin User Management Service / Managed user roles

Create a non-admin Directus role and dedicated active service user/static token.
Attach a policy with only these permissions:

- Collection: `directus_users`
- Operation: Read (including aggregate/count access)
- Item filter:
  `{ "role": { "_in": ["WEBSITE_USER_ROLE_UUID", "WEBSITE_ADMIN_ROLE_UUID"] } }`
- Allowed fields: `id`, `email`, `status`, `role`
- Validation: not applicable

- Collection: `directus_users`
- Operation: Update
- Item filter:
  `{ "role": { "_in": ["WEBSITE_USER_ROLE_UUID", "WEBSITE_ADMIN_ROLE_UUID"] } }`
- Allowed fields: `role` only
- Validation:
  `{ "role": { "_in": ["WEBSITE_USER_ROLE_UUID", "WEBSITE_ADMIN_ROLE_UUID"] } }`

Both managed roles appear in the update filter and validation. This allows the
same item to remain within policy scope after either permitted transition while
still excluding every unrelated role. The application supplies the additional
self-demotion and last-active-admin invariants that a field permission cannot
express.

The last-admin count and update are two Directus requests, not one database
transaction. The in-process lock prevents concurrent role changes in one runtime;
deployments that can execute mutations in multiple instances need a transactional
Directus Flow/custom endpoint or database procedure for an absolute cross-instance
guarantee. Keep at least two active administrators and test this deployment-specific
behavior before rollout.

- Collection: `admin_activity`
- Operation: Create
- Item filter: not applicable
- Allowed fields: `action`, `administrator`, `administrator_email`,
  `target_user`, `target_email`, `previous_value`, `new_value`
- Validation: `action` is one of the four allowlisted values; both relationships
  resolve to users whose role is Website User or Website Admin; emails are
  non-empty and at most 254 characters; previous/new values are null or one of
  `active`, `suspended`, `websiteUser`, `websiteAdmin`
- Read, Update, Delete, Share: no access

Do not grant this service role Admin Access, App/Data Studio Access, user create,
user delete, password, token, policy, or arbitrary role access. Do not reuse a
full Directus administrator token.

### Policy: Website User

Make no Task 4B permission changes. In particular, Website Users receive no
`admin_activity` access and no ability to update another user's status or role.

## Password-reset infrastructure

Configure Directus SMTP/email delivery and allow these localized reset callback
URLs for production, plus equivalent localhost URLs for development:

```text
https://your-production-domain.example/en/auth/callback
https://your-production-domain.example/tr/auth/callback
https://your-production-domain.example/ar/auth/callback
https://your-production-domain.example/fa/auth/callback
```

Verify the Directus password-reset request rate limit and mail-provider delivery
limits in staging. A successful API response confirms the reset request was
accepted; email receipt remains dependent on that infrastructure.

## Operational verification

After applying the schema, policies, token, callback allowlist, SMTP, and rate
limits, use two active Website Admin test accounts plus one Website User. Confirm
status changes, promotion, demotion, reset completion, lockout protections, and
all four audit action types before production rollout.
