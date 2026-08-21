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

## Automated Directus setup

The local Task 4B metadata rollout is automated by
`scripts/setup-admin-user-management.mjs`. It uses the Directus metadata API and
is safe to rerun after a partial failure. It never deletes a collection, field,
relationship, policy, permission, service user, or existing content.

Create a temporary static token on an existing Directus administrator, export it
only to the shell running the setup, and execute:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users
```

Do not save `DIRECTUS_SETUP_TOKEN` in project files. Revoke it immediately after
the command succeeds. If the variable is missing, the command exits before any
Directus request or mutation.

The command:

- reuses the existing partial `admin_activity` collection and adds only missing
  Task 4B fields and relationships;
- creates or reuses the Website Admin and service policies without changing
  Website User permissions;
- preserves or safely tightens the existing status-only permission;
- preserves the exact `id._eq = $CURRENT_USER` Website Admin self-read, leaves
  the shared `Website Admin Dashboard Read` policy and any real direct-user
  consumer unchanged, copies the dashboard reads into
  `Website Admin Dashboard Restricted`, detaches only Website Admin from the
  shared policy, restricts dashboard user IDs to the two managed roles, and
  expands the existing `Website Admin User Read` from Website User-only to both
  managed roles with only the Task 4B directory fields;
- creates or reuses a role-less, user-policy-attached management service identity;
- creates/rotates its static token and writes only
  `DIRECTUS_USER_MANAGEMENT_TOKEN` to the Git-ignored `.env.local` file;
- validates metadata, attachments, forbidden permissions, the unchanged Website
  User permission snapshot, and a read-only request made with the service token;
- refuses non-local Directus URLs unless the operator explicitly sets
  `DIRECTUS_SETUP_ALLOW_REMOTE=true`.

If the preflight rejects existing Website Admin user-read access, run the
strictly read-only diagnosis before changing any policy:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users -- --diagnose-admin-read
```

This reports role and policy names with hashed identifier references, every
role-contributed `directus_users` Read permission, sanitized item filters,
allowed fields, inherited role composition, and potentially visible unmanaged
roles. It exits before all schema, policy, user, permission, and token writes.
The self-read exception accepts only the exact current-user ID predicate, either
directly or inside its existing single-rule `_and` wrapper; arbitrary ID filters
and other filter shapes remain rejected.

To inspect the direct consumers and every permission of the shared dashboard
policy without changing it, run:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users -- --diagnose-dashboard-policy
```

User emails are masked, UUIDs are replaced by hashed references, sensitive
metadata values are redacted, and the command exits before every write phase.

If the restricted policy attachment validator stops after policy creation, inspect
the exact Directus 11 `directus_access` response shape without writes:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users -- --diagnose-restricted-policy
```

This distinguishes non-null role/user foreign keys from junction IDs, reports
duplicate attachment targets, inspects every old and restricted-policy junction,
and determines whether the previously reported old-policy user is a real user
foreign key or a legacy junction-ID parser artifact. Policy validation never
falls back from a null role/user foreign key to the junction row's own ID.

To inspect the existing Website Admin status-update permission and its exact
validation shape without changing it, run:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users -- --diagnose-status-permission
```

The diagnostic reports sanitized item and validation filters, allowed fields,
and strict policy attachments. Only the exact `active`/`suspended` allowlist—or
its logically equivalent single-rule `_and` wrapper—is accepted.

The shared-dashboard migration verifies the copied policy before detaching the
Website Admin role. It deletes only the Website Admin `directus_access` junction;
the original policy, permissions, direct users, and any other role attachments
must match their pre-migration snapshot afterward. Reruns reuse the restricted
policy and continue safely after any completed stage.

After a successful setup, metadata can be checked again without changes:

```sh
DIRECTUS_SETUP_TOKEN=... npm run directus:setup-admin-users -- --verify-only
```

The verification intentionally does not promote, demote, suspend, delete, or
reset any real account and does not create a synthetic audit record. Those checks
remain part of the runtime checklist below.

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
  are non-null; emails are non-empty and at most 254 characters; previous/new
  values are null or one of `active`, `suspended`, `websiteUser`, `websiteAdmin`
- Read, Update, Delete, Share: no access

Directus 11.17.4 validates create permissions against the submitted top-level
payload and does not hydrate a scalar M2O UUID for a nested rule such as
`administrator.role`. The server activity writer therefore re-reads both the
authenticated administrator and target through the restricted management
service immediately before create, requires both IDs and emails to match, and
requires both users to belong to one of the two configured application roles.
The browser never supplies the administrator relation.

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

Directus does not expose SMTP credentials or the reset URL allowlist through the
metadata API. Verify the Directus server environment manually without printing
secrets. For local development, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
and allow only these callbacks (plus the equivalent production origin):

```text
http://localhost:3000/en/auth/callback
http://localhost:3000/tr/auth/callback
http://localhost:3000/ar/auth/callback
http://localhost:3000/fa/auth/callback
```

For the local Directus Docker service, configure these server variables and
restart the container. Supply real values from the selected SMTP provider; do
not place them in the Next.js `.env.local` file:

```text
PUBLIC_URL=http://localhost:8055
PASSWORD_RESET_URL_ALLOW_LIST=http://localhost:3000/en/auth/callback,http://localhost:3000/tr/auth/callback,http://localhost:3000/ar/auth/callback,http://localhost:3000/fa/auth/callback
EMAIL_TRANSPORT=smtp
EMAIL_SMTP_HOST=...
EMAIL_SMTP_PORT=...
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASSWORD=...
EMAIL_SMTP_SECURE=...
EMAIL_FROM=...
```

The application always constructs the reset callback from the trusted
`NEXT_PUBLIC_SITE_URL`; it does not trust the browser's `Origin` header. Directus
compares the callback by origin and pathname, so the localized allowlist entries
above also cover the trusted `next` query parameter.

## Operational verification

After applying the schema, policies, token, callback allowlist, SMTP, and rate
limits, use two active Website Admin test accounts plus one Website User. Confirm
status changes, promotion, demotion, reset completion, lockout protections, and
all four audit action types before production rollout.
