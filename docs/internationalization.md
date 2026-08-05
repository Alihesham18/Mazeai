# Internationalization

Locales: `en`, `tr`, `ar`.

Routes are always locale-prefixed. `/` redirects to `/en`. Arabic sets `dir="rtl"` and uses logical CSS properties to mirror layout safely.

Language switching preserves the current path by replacing only the locale segment.
