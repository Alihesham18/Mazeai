# Authentication setup

SynergyMazeAI uses Supabase Auth with `@supabase/ssr`. Credentials are handled by Supabase Auth, while access and refresh tokens are stored in cookies that are available to both server and browser requests.

## Required environment variables

Create a Supabase project and set these values in the deployment environment:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported for older Supabase projects, but the publishable key is preferred. The service-role key is not used by website authentication and must never be exposed to client code.

## Supabase dashboard configuration

1. Enable the Email provider under Authentication > Providers.
2. Set the production Site URL under Authentication > URL Configuration.
3. Add these redirect URL patterns for every deployed origin:

```text
https://your-production-domain.example/en/auth/callback
https://your-production-domain.example/tr/auth/callback
https://your-production-domain.example/ar/auth/callback
https://your-production-domain.example/fa/auth/callback
```

4. Add equivalent localhost callback URLs for development.
5. Keep email confirmation enabled for production.
6. Configure custom SMTP before launch. Supabase's trial sender is rate-limited and is not intended for production password-reset or confirmation email delivery.
7. Review Auth rate limits, password strength, leaked-password protection, and CAPTCHA before public registration opens.

## Current persistence boundary

Supabase Auth stores the account and profile metadata. Existing training applications, event registrations, and scholarship exam attempts are not persisted by the current website, so the account page shows honest empty states and the existing scholarship result remains local-only. Add protected database tables with Row Level Security before presenting these records as saved account activity.
