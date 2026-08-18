# Directus Scholarship Backend Handoff

No Directus changes in this document were applied by the application work. The
items below are configuration recommendations for manual review.

## Current requirements

### Website User attempt reads

- Collection: `scholarship_exam_attempts`
- Permission/action: read
- Fields involved: `id`, `training_program`, `score`, `total_questions`,
  `percentage`, `scholarship_percentage`, `discount_code`, `status`,
  `date_created`
- Proposed item permission: `user = $CURRENT_USER`
- Proposed field permission: allow only the fields above; the `user` relation
  does not need to be readable
- Preset: none
- Security reason: lets users read only their own results without exposing or
  filtering on the ownership relation
- Status: required now; this is the policy behavior expected by the application

### Scholarship service attempt creation

- Collection: `scholarship_exam_attempts`
- Permission/action: create, plus response/read access where desired
- Fields involved: `user`, `training_program`, `score`, `total_questions`,
  `percentage`, `scholarship_percentage`, `discount_code`, `status`; response
  fields `id` and `discount_code`
- Proposed item permission: server service role only; never Public or a browser
  credential
- Proposed field permission: create only the trusted fields listed above;
  optionally allow `id` and `discount_code` in the create response
- Preset: none; the server supplies the authenticated user UUID after resolving
  it from the HttpOnly Website User session
- Security reason: scoring, ownership, award, and code generation remain
  server-controlled
- Status: create permission is required now; readable create-response fields are
  optional because the application safely recovers null/partial responses

### Scholarship discount synchronization

- Collection: `discount_codes`
- Permission/action: read and create for the Discount Service role
- Fields involved: `code`, `title`, `description`, `discount_type`,
  `discount_value`, `currency`, `starts_at`, `expires_at`, `max_redemptions`,
  `max_redemptions_per_user`, `applies_to`, `is_active`, `stackable`,
  `reserved_for_user`
- Proposed item permission: server Discount Service role only
- Proposed field permission: allow only the listed scholarship-code fields;
  `reserved_for_user` should be the raw UUID and should not require nested
  `directus_users` reads
- Preset: none
- Security reason: prevents the browser from choosing awards, ownership, usage
  limits, or scholarship codes
- Status: required now for eligible scholarship discount creation/reconciliation

## Optional hardening

### Cross-instance attempt uniqueness

- Collection: `scholarship_exam_attempts`
- Permission/action: database/collection uniqueness validation for create
- Fields involved: `user`, `training_program`
- Proposed item permission: unchanged
- Proposed field permission: unchanged
- Preset: none
- Security reason: a composite unique constraint prevents simultaneous requests
  handled by different application instances from creating two official attempts
- Status: optional hardening; the current application uses two policy-scoped
  reads and an in-process user/program lock but cannot guarantee cross-instance
  atomicity

### Transactional attempt and discount orchestration

- Collections: `scholarship_exam_attempts`, `discount_codes`
- Permission/action: transactional Directus Flow or database transaction for
  create/reconcile operations
- Fields involved: the trusted attempt and scholarship discount fields listed
  above
- Proposed item permission: execute only from a trusted server/service context
- Proposed field permission: least-privilege access to those fields
- Preset: if implemented as a Flow, derive ownership from trusted server input;
  never accept a browser user UUID or award
- Security reason: provides strict atomic behavior if the business later
  requires attempt persistence and discount issuance to succeed together
- Status: optional hardening; current behavior intentionally preserves a saved
  attempt even when discount preparation must be retried
