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

## Current persistence boundary

Directus system users store account identity fields: first name, last name, and
email. Telephone is attempted only when a compatible custom `telephone` field
exists on `directus_users`; otherwise the UI reports that phone persistence
requires the profile schema step.

Existing training applications, event registrations, and scholarship exam
attempts are not persisted by the current website, so the account page shows
honest empty states until those protected backend collections are implemented.
