# Content Models

Typed local content models include:

- Services
- Research projects
- Publications
- Events
- Blog posts
- Navigation
- Page shells

All fictional clients, partner blocks, metrics, and testimonials must remain labeled as placeholder content until replaced with verified real data.

## Case Studies

Directus is the source of truth for Case Study content. Public website reads use the
`case_studies` collection and its `translations` alias relation:

```text
case_studies.translations
  -> case_study_translations.case_study
```

Translations use `en`, `tr`, `ar`, and `fa`. The frontend selects the requested route
language, then falls back to English and finally the first usable translation.

Public visibility remains controlled by Directus and is also explicitly filtered by the
website query to `case_studies.status = published`. Translation visibility is governed by
the configured relation rule `case_study.status = published`. Case Studies are read-only
on the public website; no service token or write operation is used.
