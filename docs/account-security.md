# Account numbers and password security

The application keeps the Directus user UUID as the ownership and authentication identifier. The
display-only account number lives in `user_profiles.account_number` and is provisioned by a separate,
least-privilege server credential. It is never accepted from a registration or profile form.

## Directus rollout

Perform these steps in staging first and take a Directus/database backup before changing production.

1. In **Settings → Data Model → user_profiles**, add `account_number`:
   - Type: **String** (`VARCHAR`)
   - Length: **32**
   - Unique: **enabled**
   - Required: **disabled during rollout** (nullable until backfill finishes)
   - Interface: an input or presentation interface marked read-only in Data Studio
   - Do not add a default value.
2. Confirm `user_profiles.user` is a many-to-one relation to `directus_users` and has a unique
   constraint. There must be at most one profile per user. Add that unique constraint before running
   the backfill if it is missing.
3. Record the UUID of the existing **Website User** role. This becomes
   `DIRECTUS_WEBSITE_USER_ROLE_ID`.
4. Create a non-admin role named **Account Number Service** and attach a policy named
   **Provision account numbers**. Keep Admin Access and Data Studio/App Access disabled. Do not reuse
   the scholarship service user or token.
5. Give the service policy only these permissions:
   - `directus_users` / Read: fields `id`, `email`, and `role`; filter
     `{ "role": { "_eq": "WEBSITE_USER_ROLE_UUID" } }`. No create, update, delete, or share.
   - `user_profiles` / Read: fields `id`, `user`, and `account_number`; filter
     `{ "user": { "role": { "_eq": "WEBSITE_USER_ROLE_UUID" } } }`.
   - `user_profiles` / Create: fields `user` and `account_number`; validation
     `{ "_and": [{ "user": { "role": { "_eq": "WEBSITE_USER_ROLE_UUID" } } }, { "account_number": { "_regex": "^SMA-[0-9]{4}-[0-9]{6}$" } }] }`.
     Do not add ownership presets to this service policy.
   - `user_profiles` / Update: field `account_number` only; item filter
     `{ "_and": [{ "user": { "role": { "_eq": "WEBSITE_USER_ROLE_UUID" } } }, { "account_number": { "_empty": true } }] }`;
     validation `{ "account_number": { "_regex": "^SMA-[0-9]{4}-[0-9]{6}$" } }`.
     This blocks changes after the first value is stored.
   - `user_profiles` / Delete and Share: no access.
6. Create a dedicated active Directus user for that role, generate a static token, and store it only as
   the server environment variable `DIRECTUS_ACCOUNT_SERVICE_TOKEN`. Never use an admin token and
   never prefix this variable with `NEXT_PUBLIC_`.
7. On the existing **Website User** policy, keep ownership scoped to the Directus UUID:
   - `user_profiles` / Read: filter `{ "user": { "_eq": "$CURRENT_USER" } }`; readable fields
     `id`, `account_number`, `phone_country_code`, and `phone_number`.
   - `user_profiles` / Create: fields `phone_country_code` and `phone_number` only; preset
     `{ "user": "$CURRENT_USER" }`. Do not expose `user` or `account_number` as writable fields.
   - `user_profiles` / Update: filter `{ "user": { "_eq": "$CURRENT_USER" } }`; fields
     `phone_country_code` and `phone_number` only. No delete or share permission.
   - `directus_users` / Read: filter `{ "id": { "_eq": "$CURRENT_USER" } }`; fields `id`,
     `first_name`, `last_name`, `email`, and `status`.
   - `directus_users` / Update: filter `{ "id": { "_eq": "$CURRENT_USER" } }`; fields
     `first_name`, `last_name`, and `password` only. Do not expose role, status, token, policy, or
     administrative fields.
8. Set these server variables in every application runtime, then restart/redeploy it:
   - `NEXT_PUBLIC_DIRECTUS_URL`
   - `DIRECTUS_ACCOUNT_SERVICE_TOKEN`
   - `DIRECTUS_WEBSITE_USER_ROLE_ID`

No Directus Flow is required by this implementation.

## Existing-user backfill

After the field, unique constraints, service policy, and environment variables are ready, run:

```sh
npm run backfill:account-numbers
```

The script enumerates only the configured Website User role. It preserves every existing non-empty
account number, conditionally fills only empty values, uses cryptographically secure candidates, and
retries database uniqueness conflicts. It does not alter the Directus UUID, email, password, phone,
applications, scholarship attempts, or training data. It is safe to rerun.

In Directus, filter `user_profiles` for an empty `account_number` and compare the profile count with
the Website User count. Investigate any users without a profile and rerun the script until every
Website User has exactly one populated profile. Then edit the field and enable **Required** (nullable
off), while leaving **Unique** enabled.

New registrations are provisioned immediately on the server. Login and the profile page also perform
an idempotent ensure operation, so an account missed during a temporary service outage is repaired on
the next authenticated visit.

## Password changes

The authenticated password-change action reads the current user's email through the existing HttpOnly
Directus session, verifies the submitted current password with a fresh Directus login, updates the
password through that short-lived authenticated session, and logs out the temporary session. The
application's existing session cookies are not replaced or arbitrarily cleared. If the Directus
deployment invalidates older sessions after a password update, the existing refresh/session guard
will require a normal login on the next authenticated request.
