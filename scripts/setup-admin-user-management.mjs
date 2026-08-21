import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  aggregate,
  createCollection,
  createDirectus,
  createField,
  createPermission,
  createPolicy,
  createRelation,
  createUser,
  isDirectusError,
  readCollections,
  readFieldsByCollection,
  readPermissions,
  readPolicies,
  readRelations,
  readRole,
  readRoles,
  readSettings,
  readUsers,
  rest,
  serverInfo,
  staticToken,
  updateCollection,
  updateField,
  updatePermission,
  updatePolicy,
  updateUser
} from "@directus/sdk";

const setupToken = process.env.DIRECTUS_SETUP_TOKEN?.trim();

async function runSetup(temporarySetupToken) {
  const projectRoot = process.cwd();
  const localEnvPath = path.join(projectRoot, ".env.local");
  const localEnvSource = await readOptionalFile(localEnvPath);
  const localEnv = parseEnv(localEnvSource);

  assertNoConflictingValues(localEnv, [
    "NEXT_PUBLIC_DIRECTUS_URL",
    "DIRECTUS_WEBSITE_USER_ROLE_ID",
    "DIRECTUS_ADMIN_ROLE_ID",
    "DIRECTUS_USER_MANAGEMENT_TOKEN"
  ]);

  const directusUrl = configuredValue("NEXT_PUBLIC_DIRECTUS_URL", localEnv);
  const websiteUserRoleId = configuredValue("DIRECTUS_WEBSITE_USER_ROLE_ID", localEnv);
  const websiteAdminRoleId = configuredValue("DIRECTUS_ADMIN_ROLE_ID", localEnv);
  const configuredServiceToken = configuredValue("DIRECTUS_USER_MANAGEMENT_TOKEN", localEnv);
  const verifyOnly = process.argv.includes("--verify-only");
  const diagnoseAdminRead = process.argv.includes("--diagnose-admin-read");
  const diagnoseDashboardPolicy = process.argv.includes("--diagnose-dashboard-policy");
  const diagnoseRestrictedPolicy = process.argv.includes("--diagnose-restricted-policy");
  const diagnoseStatusPermission = process.argv.includes("--diagnose-status-permission");

  requireConfiguration("NEXT_PUBLIC_DIRECTUS_URL", directusUrl);
  requireUuid("DIRECTUS_WEBSITE_USER_ROLE_ID", websiteUserRoleId);
  requireUuid("DIRECTUS_ADMIN_ROLE_ID", websiteAdminRoleId);
  if (websiteUserRoleId.toLowerCase() === websiteAdminRoleId.toLowerCase()) {
    throw new SetupError("Website User and Website Admin role IDs must be different.");
  }

  const parsedDirectusUrl = new URL(directusUrl);
  if (
    !["localhost", "127.0.0.1", "::1"].includes(parsedDirectusUrl.hostname) &&
    process.env.DIRECTUS_SETUP_ALLOW_REMOTE !== "true"
  ) {
    throw new SetupError(
      "Refusing to configure a non-local Directus URL. Set DIRECTUS_SETUP_ALLOW_REMOTE=true only after verifying the intended target."
    );
  }

  const directus = createDirectus(directusUrl.replace(/\/$/, ""))
    .with(staticToken(temporarySetupToken))
    .with(rest());
  const completedPhases = [];
  let phase = "Directus connectivity";

  try {
    const info = await safeRequest(directus, serverInfo(), phase);
    console.info(`Connected to Directus ${safeVersion(info)}.`);

    phase = "managed-role validation";
    const [websiteUserRole, websiteAdminRole] = await Promise.all([
      safeRequest(
        directus,
        readRole(websiteUserRoleId, {
          fields: ["id", "name", "policies.id", "policies.policy.id", "policies.policy.name"]
        }),
        phase
      ),
      safeRequest(
        directus,
        readRole(websiteAdminRoleId, {
          fields: ["id", "name", "policies.id", "policies.policy.id", "policies.policy.name"]
        }),
        phase
      )
    ]);
    completedPhases.push(phase);

    const permissionsBefore = await readAllPermissions(directus);
    const policiesBefore = await readAllPolicies(directus);
    const websiteUserDirectPolicyIdsBefore = policyIdsFromRole(websiteUserRole);
    const websiteAdminDirectPolicyIdsBefore = policyIdsFromRole(websiteAdminRole);

    if (diagnoseRestrictedPolicy) {
      phase = "read-only restricted dashboard policy diagnosis";
      const allRoles = await readAllRolesForAccess(directus, phase);
      const restrictedPolicy = requirePolicyByName(
        policiesBefore,
        WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
      );
      const sharedPolicy = requirePolicyByName(
        policiesBefore,
        WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME
      );
      const directUserIds = [
        ...new Set([
          ...strictUserIdsFromPolicy(restrictedPolicy),
          ...strictUserIdsFromPolicy(sharedPolicy)
        ])
      ];
      const directUsers =
        directUserIds.length === 0
          ? []
          : await safeRequest(
              directus,
              readUsers({
                fields: ["id", "email", "first_name", "last_name", "status", "role"],
                filter: { id: { _in: directUserIds } },
                limit: -1
              }),
              phase
            );
      reportRestrictedPolicyDiagnosis({
        restrictedPolicy,
        sharedPolicy,
        websiteAdminRoleId,
        allRoles,
        directUsers,
        permissions: permissionsBefore
      });
      completedPhases.push(phase);
      console.info(
        "Read-only restricted-policy diagnosis completed. No Directus changes were attempted."
      );
      return;
    }

    if (diagnoseStatusPermission) {
      phase = "read-only Website Admin status permission diagnosis";
      const allRoles = await readAllRolesForAccess(directus, phase);
      reportStatusPermissionDiagnosis({
        policies: policiesBefore,
        permissions: permissionsBefore,
        allRoles,
        websiteAdminRoleId,
        websiteUserRoleId
      });
      completedPhases.push(phase);
      console.info(
        "Read-only status-permission diagnosis completed. No Directus changes were attempted."
      );
      return;
    }

    if (diagnoseDashboardPolicy) {
      phase = "read-only Website Admin Dashboard Read diagnosis";
      const allRoles = await readAllRolesForAccess(directus, phase);
      const dashboardPolicy = requirePolicyByName(
        policiesBefore,
        WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME
      );
      const directUserIds = userIdsFromPolicy(dashboardPolicy);
      const directUsers =
        directUserIds.length === 0
          ? []
          : await safeRequest(
              directus,
              readUsers({
                fields: [
                  "id",
                  "email",
                  "first_name",
                  "last_name",
                  "status",
                  "role",
                  "policies.id",
                  "policies.policy.id",
                  "policies.policy.name"
                ],
                filter: { id: { _in: directUserIds } },
                limit: -1
              }),
              phase
            );
      reportDashboardPolicyDiagnosis({
        policy: dashboardPolicy,
        websiteAdminRoleId,
        allRoles,
        directUsers,
        policies: policiesBefore,
        permissions: permissionsBefore
      });
      completedPhases.push(phase);
      console.info(
        "Read-only dashboard-policy diagnosis completed. No Directus changes were attempted."
      );
      return;
    }

    if (diagnoseAdminRead) {
      phase = "read-only Website Admin access diagnosis";
      const allRoles = await readAllRolesForAccess(directus, phase);
      reportAdminReadDiagnosis({
        websiteAdminRole,
        websiteUserRole,
        allRoles,
        policies: policiesBefore,
        permissions: permissionsBefore
      });
      completedPhases.push(phase);
      console.info("Read-only diagnosis completed. No Directus changes were attempted.");
      return;
    }

    const allRolesBefore = await readAllRolesForAccess(directus, phase);
    const websiteUserEffectivePolicyIdsBefore = effectivePolicyIdsForRole(
      websiteUserRoleId,
      allRolesBefore
    );
    const websiteAdminEffectivePolicyIdsBefore = effectivePolicyIdsForRole(
      websiteAdminRoleId,
      allRolesBefore
    );
    assertNoAdministrativePolicy(
      policiesBefore,
      websiteAdminEffectivePolicyIdsBefore,
      "Website Admin"
    );
    const websiteUserPermissionSnapshot = permissionSnapshot(
      permissionsBefore,
      websiteUserEffectivePolicyIdsBefore
    );

    if (!verifyOnly) {
      phase = "existing Website Admin user-read restriction";
      await restrictExistingWebsiteAdminUserReads(directus, {
        permissions: permissionsBefore,
        policies: policiesBefore,
        websiteAdminRoleId,
        websiteAdminPolicyIds: websiteAdminDirectPolicyIdsBefore,
        websiteUserPolicyIds: websiteUserEffectivePolicyIdsBefore,
        websiteUserRoleId
      });
      completedPhases.push(phase);
    }

    phase = "Website Admin user-read verification";
    const [
      permissionsAfterReadRestriction,
      policiesAfterReadRestriction,
      allRolesAfterRestriction
    ] = await Promise.all([
      readAllPermissions(directus),
      readAllPolicies(directus),
      readAllRolesForAccess(directus, phase)
    ]);
    const websiteAdminRoleAfterRestriction = await safeRequest(
      directus,
      readRole(websiteAdminRoleId, {
        fields: ["id", "name", "policies.id", "policies.policy.id", "policies.policy.name"]
      }),
      phase
    );
    const websiteAdminDirectPolicyIdsAfterRestriction = policyIdsFromRole(
      websiteAdminRoleAfterRestriction
    );
    const websiteAdminEffectivePolicyIdsAfterRestriction = effectivePolicyIdsForRole(
      websiteAdminRoleId,
      allRolesAfterRestriction
    );
    verifyExistingWebsiteAdminUserReads({
      permissions: permissionsAfterReadRestriction,
      policies: policiesAfterReadRestriction,
      allRoles: allRolesAfterRestriction,
      websiteAdminRoleId,
      websiteAdminPolicyIds: websiteAdminDirectPolicyIdsAfterRestriction,
      websiteUserRoleId
    });
    assertAdminPermissionsAreNotBroad(
      permissionsAfterReadRestriction,
      websiteAdminEffectivePolicyIdsAfterRestriction,
      websiteUserRoleId,
      websiteAdminRoleId
    );
    completedPhases.push(phase);

    let serviceToken = configuredServiceToken;
    let serviceUser = null;
    let adminPolicy = null;
    let servicePolicy = null;

    if (!verifyOnly) {
      phase = "admin_activity schema";
      await ensureAdminActivitySchema(directus);
      completedPhases.push(phase);

      phase = "Website Admin policy";
      adminPolicy = await ensurePolicy(directus, {
        name: "MazeAI Website Admin User Management",
        icon: "manage_accounts",
        description: "Least-privilege Website Admin reads for MazeAI Task 4B.",
        roleId: websiteAdminRoleId
      });
      completedPhases.push(phase);

      phase = "management service identity and policy";
      servicePolicy = await ensurePolicy(directus, {
        name: "Admin User Management Service",
        icon: "admin_panel_settings",
        description: "Server-only least-privilege role changes and Task 4B audit writes."
      });
      serviceToken ||= randomBytes(32).toString("base64url");
      serviceUser = await ensureServiceUser(directus, serviceToken);
      await attachPolicyToUser(directus, servicePolicy, serviceUser.id);
      completedPhases.push(phase);

      phase = "least-privilege permissions";
      await ensureTaskPermissions(directus, {
        adminPolicy,
        servicePolicy,
        websiteAdminPolicyIds: websiteAdminDirectPolicyIdsAfterRestriction,
        websiteUserPolicyIds: websiteUserDirectPolicyIdsBefore,
        websiteUserRoleId,
        websiteAdminRoleId
      });
      completedPhases.push(phase);
    }

    phase = "metadata verification";
    const verification = await verifyConfiguration(directus, {
      websiteUserRoleId,
      websiteAdminRoleId,
      websiteUserPermissionSnapshot
    });
    adminPolicy = verification.adminPolicy;
    servicePolicy = verification.servicePolicy;
    serviceUser = verification.serviceUser;
    completedPhases.push(phase);

    if (!verifyOnly) {
      phase = "service-token read verification";
      await verifyServiceToken(directusUrl, serviceToken, websiteUserRoleId, websiteAdminRoleId);
      completedPhases.push(phase);

      phase = "local service-token storage";
      await storeLocalServiceToken(localEnvPath, localEnvSource, serviceToken);
      completedPhases.push(phase);
    }

    phase = "password-reset configuration inspection";
    const settings = await safeRequest(
      directus,
      readSettings({ fields: ["project_name", "project_url"] }),
      phase
    );
    const callback = inspectCallbackConfiguration(localEnv);
    completedPhases.push(phase);

    console.info("Task 4B Directus metadata verification passed.");
    console.info(
      verifyOnly
        ? "Verification completed without making changes."
        : "Setup completed and DIRECTUS_USER_MANAGEMENT_TOKEN was stored in ignored .env.local."
    );
    console.info(
      callback.ready
        ? `Configured application origin is suitable for localized reset callbacks (${callback.originLabel}).`
        : "NEXT_PUBLIC_SITE_URL is not set in .env.local; configure the intended application origin before testing password-reset emails."
    );
    console.info(
      settings?.project_url
        ? "Directus project URL metadata is configured. SMTP and reset URL allowlists still require server-environment verification."
        : "Directus project URL metadata is empty. SMTP and reset URL allowlists still require server-environment verification."
    );
  } catch (error) {
    console.error(`Task 4B Directus setup failed during ${phase}: ${safeError(error)}`);
    console.error(
      completedPhases.length > 0
        ? `Completed phases: ${completedPhases.join(", ")}. The setup is idempotent and safe to rerun.`
        : "No setup phase completed. No destructive rollback was attempted."
    );
    process.exitCode = 1;
  }
}

const ACTIVITY_COLLECTION = "admin_activity";
const ADMIN_POLICY_NAME = "MazeAI Website Admin User Management";
const SERVICE_POLICY_NAME = "Admin User Management Service";
const WEBSITE_ADMIN_SELF_READ_POLICY_NAME = "Website Admin Policy";
const WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME = "Website Admin Dashboard Read";
const WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME = "Website Admin Dashboard Restricted";
const WEBSITE_ADMIN_USER_READ_POLICY_NAME = "Website Admin User Read";
const SERVICE_EMAIL = "mazeai-admin-user-management-service@example.com";
const ACTIVITY_ACTIONS = [
  "user.suspended",
  "user.activated",
  "user.role_changed",
  "user.password_reset_requested"
];
const ACTIVITY_VALUES = ["active", "suspended", "websiteUser", "websiteAdmin"];
const ADMIN_USER_READ_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "status",
  "last_access",
  "role"
];
const ADMIN_SELF_READ_FIELDS = ["id", "email", "first_name", "last_name", "status", "role"];
const DASHBOARD_READ_SPECS = [
  { collection: "training_applications", fields: ["id", "status", "date_created"] },
  { collection: "scholarship_exam_attempts", fields: ["id", "status", "date_created"] },
  { collection: "event_registrations", fields: ["id", "date_created", "status"] },
  { collection: "event", fields: ["id"] },
  { collection: "discount_codes", fields: ["id"] },
  { collection: "training_programs", fields: ["id"] },
  { collection: "directus_users", fields: ["id"] }
];
const ACTIVITY_READ_FIELDS = [
  "id",
  "action",
  "administrator",
  "administrator_email",
  "target_user",
  "target_email",
  "previous_value",
  "new_value",
  "date_created"
];
const ACTIVITY_CREATE_FIELDS = [
  "action",
  "administrator",
  "administrator_email",
  "target_user",
  "target_email",
  "previous_value",
  "new_value"
];

async function ensureAdminActivitySchema(directus) {
  const collections = await safeRequest(directus, readCollections(), "admin_activity collection");
  let collection = collections.find((item) => item.collection === ACTIVITY_COLLECTION);

  if (!collection) {
    collection = await safeRequest(
      directus,
      createCollection({
        collection: ACTIVITY_COLLECTION,
        meta: {
          icon: "history",
          note: "Server-controlled MazeAI administrator activity.",
          hidden: true,
          singleton: false
        },
        schema: { name: ACTIVITY_COLLECTION },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: { hidden: true, readonly: true, interface: "input", special: ["uuid"] },
            schema: { is_primary_key: true, is_nullable: false }
          }
        ]
      }),
      "admin_activity collection create"
    );
    console.info("Created admin_activity collection.");
  } else {
    await safeRequest(
      directus,
      updateCollection(ACTIVITY_COLLECTION, {
        meta: {
          icon: "history",
          note: "Server-controlled MazeAI administrator activity.",
          hidden: true
        }
      }),
      "admin_activity collection metadata"
    );
    console.info("Reused admin_activity collection.");
  }

  const definitions = [
    {
      field: "action",
      type: "string",
      meta: {
        interface: "select-dropdown",
        required: true,
        options: {
          choices: ACTIVITY_ACTIONS.map((value) => ({ text: value, value }))
        },
        validation: { action: { _in: ACTIVITY_ACTIONS } },
        validation_message: "Action must be an allowlisted MazeAI user-management event."
      },
      schema: { is_nullable: false, max_length: 64 }
    },
    relationField("administrator", "Administrator"),
    stringField("administrator_email", 254, true),
    relationField("target_user", "Target user"),
    stringField("target_email", 254, true),
    stringField("previous_value", 64, false),
    stringField("new_value", 64, false),
    {
      field: "date_created",
      type: "timestamp",
      meta: {
        interface: "datetime",
        special: ["date-created"],
        readonly: true,
        required: false
      },
      schema: { is_nullable: true }
    }
  ];

  let fields = await safeRequest(
    directus,
    readFieldsByCollection(ACTIVITY_COLLECTION),
    "admin_activity fields"
  );
  for (const definition of definitions) {
    const existing = fields.find((field) => field.field === definition.field);
    if (!existing) {
      await safeRequest(
        directus,
        createField(ACTIVITY_COLLECTION, definition),
        `admin_activity.${definition.field} create`
      );
      console.info(`Created admin_activity.${definition.field}.`);
      fields = await safeRequest(
        directus,
        readFieldsByCollection(ACTIVITY_COLLECTION),
        "admin_activity fields refresh"
      );
      continue;
    }

    assertCompatibleField(existing, definition);
    if (definition.field === "action") {
      await safeRequest(
        directus,
        updateField(ACTIVITY_COLLECTION, definition.field, {
          meta: definition.meta,
          schema: definition.schema
        }),
        "admin_activity.action validation"
      );
    }
  }

  let relations = await safeRequest(directus, readRelations(), "admin_activity relations");
  for (const field of ["administrator", "target_user"]) {
    const relation = relations.find(
      (item) => item.collection === ACTIVITY_COLLECTION && item.field === field
    );
    if (relation) {
      if (relation.related_collection !== "directus_users") {
        throw new SetupError(
          `admin_activity.${field} already points to an unexpected collection; it was not changed.`
        );
      }
      continue;
    }

    await safeRequest(
      directus,
      createRelation({
        collection: ACTIVITY_COLLECTION,
        field,
        related_collection: "directus_users",
        schema: { on_delete: "NO ACTION" }
      }),
      `admin_activity.${field} relationship`
    );
    console.info(`Created admin_activity.${field} relationship.`);
    relations = await safeRequest(directus, readRelations(), "admin_activity relations refresh");
  }
}

function relationField(field, label) {
  return {
    field,
    type: "uuid",
    meta: {
      interface: "select-dropdown-m2o",
      special: ["m2o"],
      required: true,
      note: `${label} Directus user.`
    },
    schema: { is_nullable: false }
  };
}

function stringField(field, maxLength, required) {
  return {
    field,
    type: "string",
    meta: { interface: "input", required },
    schema: { is_nullable: !required, max_length: maxLength }
  };
}

function assertCompatibleField(existing, expected) {
  if (existing.type !== expected.type) {
    throw new SetupError(
      `admin_activity.${expected.field} has type ${existing.type}; expected ${expected.type}. It was not changed.`
    );
  }
  if (expected.schema?.is_primary_key && !existing.schema?.is_primary_key) {
    throw new SetupError("admin_activity.id is not the primary key; it was not changed.");
  }
}

function assertActivityFieldConfiguration(fields) {
  const expectedNames = new Set([
    "id",
    "action",
    "administrator",
    "administrator_email",
    "target_user",
    "target_email",
    "previous_value",
    "new_value",
    "date_created"
  ]);
  const unexpected = fields.filter((field) => !expectedNames.has(field.field));
  if (unexpected.length > 0) {
    throw new SetupError(
      "admin_activity contains fields outside the Task 4B schema; no field was deleted."
    );
  }

  const byName = new Map(fields.map((field) => [field.field, field]));
  const id = byName.get("id");
  const action = byName.get("action");
  const administrator = byName.get("administrator");
  const targetUser = byName.get("target_user");
  const administratorEmail = byName.get("administrator_email");
  const targetEmail = byName.get("target_email");
  const previous = byName.get("previous_value");
  const next = byName.get("new_value");
  const dateCreated = byName.get("date_created");

  if (!id?.schema?.is_primary_key) throw new SetupError("admin_activity.id is not primary.");
  if (
    action?.schema?.is_nullable !== false ||
    action?.schema?.max_length !== 64 ||
    !deepEqual(action?.meta?.validation, { action: { _in: ACTIVITY_ACTIONS } })
  ) {
    throw new SetupError("admin_activity.action validation or schema is invalid.");
  }
  for (const [name, field] of [
    ["administrator", administrator],
    ["target_user", targetUser]
  ]) {
    if (field?.schema?.is_nullable !== false || !field?.meta?.special?.includes("m2o")) {
      throw new SetupError(`admin_activity.${name} is not a required M2O field.`);
    }
  }
  for (const [name, field] of [
    ["administrator_email", administratorEmail],
    ["target_email", targetEmail]
  ]) {
    if (field?.schema?.is_nullable !== false || field?.schema?.max_length !== 254) {
      throw new SetupError(`admin_activity.${name} schema is invalid.`);
    }
  }
  for (const [name, field] of [
    ["previous_value", previous],
    ["new_value", next]
  ]) {
    if (field?.schema?.is_nullable !== true || field?.schema?.max_length !== 64) {
      throw new SetupError(`admin_activity.${name} schema is invalid.`);
    }
  }
  if (!dateCreated?.meta?.special?.includes("date-created")) {
    throw new SetupError("admin_activity.date_created is not an automatic created-date field.");
  }
}

async function ensurePolicy(directus, input) {
  const policies = await readAllPolicies(directus);
  const matches = policies.filter((policy) => policy.name === input.name);
  if (matches.length > 1) {
    throw new SetupError(`Multiple Directus policies named ${input.name} exist.`);
  }

  let policy = matches[0];
  if (!policy) {
    policy = await safeRequest(
      directus,
      createPolicy({
        name: input.name,
        icon: input.icon,
        description: input.description,
        admin_access: false,
        app_access: false,
        ...(input.roleId ? { roles: [{ role: input.roleId }] } : {})
      }),
      `${input.name} policy create`
    );
    console.info(`Created ${input.name} policy.`);
    return readPolicyByName(directus, input.name);
  }

  if (policy.admin_access || policy.app_access) {
    await safeRequest(
      directus,
      updatePolicy(policy.id, { admin_access: false, app_access: false }),
      `${input.name} policy privilege restriction`
    );
  }
  assertPolicyHasNoUnexpectedAttachments(policy, input);
  if (input.roleId && !roleIdsFromPolicy(policy).includes(input.roleId)) {
    await safeRequest(
      directus,
      updatePolicy(policy.id, { roles: { create: [{ role: input.roleId }] } }),
      `${input.name} role attachment`
    );
  }
  console.info(`Reused ${input.name} policy.`);
  return readPolicyByName(directus, input.name);
}

function assertPolicyHasNoUnexpectedAttachments(policy, input) {
  const roleIds = roleIdsFromPolicy(policy);
  const userIds = userIdsFromPolicy(policy);
  if (input.roleId) {
    if (roleIds.some((id) => id !== input.roleId) || userIds.length > 0) {
      throw new SetupError(
        `${input.name} has unexpected role/user attachments; it was not changed.`
      );
    }
  } else if (roleIds.length > 0) {
    throw new SetupError(
      `${input.name} is attached to a role; the service policy must be user-only.`
    );
  }
}

async function ensureServiceUser(directus, serviceToken) {
  const users = await safeRequest(
    directus,
    readUsers({
      fields: ["id", "email", "status", "role", "policies.id", "policies.policy.id"],
      filter: { email: { _eq: SERVICE_EMAIL } },
      limit: 2
    }),
    "management service user lookup"
  );
  if (users.length > 1) throw new SetupError("Multiple management service users exist.");

  let user = users[0];
  if (!user) {
    user = await safeRequest(
      directus,
      createUser({
        email: SERVICE_EMAIL,
        first_name: "MazeAI Admin",
        last_name: "User Management Service",
        status: "active",
        role: null,
        token: serviceToken
      }),
      "management service user create"
    );
    console.info("Created MazeAI Admin User Management Service identity.");
  } else {
    if (relationId(user.role)) {
      throw new SetupError(
        "The management service identity has a role; expected direct policy access only."
      );
    }
    await safeRequest(
      directus,
      updateUser(user.id, { status: "active", token: serviceToken }),
      "management service token configure"
    );
    console.info("Reused MazeAI Admin User Management Service identity.");
  }
  return user;
}

async function attachPolicyToUser(directus, policy, userId) {
  const attachedUsers = userIdsFromPolicy(policy);
  if (attachedUsers.some((id) => id !== userId)) {
    throw new SetupError("The management service policy is attached to an unexpected user.");
  }
  if (!attachedUsers.includes(userId)) {
    await safeRequest(
      directus,
      updatePolicy(policy.id, { users: { create: [{ user: userId }] } }),
      "management service policy attachment"
    );
  }
}

async function ensureTaskPermissions(directus, input) {
  const managedRoleIds = [input.websiteUserRoleId, input.websiteAdminRoleId];
  const managedUsers = { role: { _in: managedRoleIds } };
  const desiredAdminPermissions = [
    permission(
      input.adminPolicy.id,
      "user_profiles",
      "read",
      { user: { role: { _in: managedRoleIds } } },
      null,
      ["user", "account_number"]
    ),
    permission(input.adminPolicy.id, ACTIVITY_COLLECTION, "read", {}, null, ACTIVITY_READ_FIELDS)
  ];

  let permissions = await readAllPermissions(directus);
  const existingStatus = findReusableStatusPermission(
    permissions,
    input.websiteAdminPolicyIds,
    input.websiteUserPolicyIds,
    input.websiteUserRoleId
  );
  const desiredStatus = permission(
    existingStatus?.policy ?? input.adminPolicy.id,
    "directus_users",
    "update",
    { role: { _eq: input.websiteUserRoleId } },
    { status: { _in: ["active", "suspended"] } },
    ["status"]
  );
  await upsertPermission(directus, desiredStatus, existingStatus);

  for (const desired of desiredAdminPermissions) {
    await upsertPermission(directus, desired);
  }

  const auditValidation = activityCreateValidation();
  const desiredServicePermissions = [
    permission(input.servicePolicy.id, "directus_users", "read", managedUsers, null, [
      "id",
      "email",
      "status",
      "role"
    ]),
    permission(
      input.servicePolicy.id,
      "directus_users",
      "update",
      managedUsers,
      { role: { _in: managedRoleIds } },
      ["role"]
    ),
    permission(
      input.servicePolicy.id,
      ACTIVITY_COLLECTION,
      "create",
      {},
      auditValidation,
      ACTIVITY_CREATE_FIELDS
    )
  ];
  for (const desired of desiredServicePermissions) {
    await upsertPermission(directus, desired);
  }

  permissions = await readAllPermissions(directus);
  assertServicePolicyHasOnlyExpectedPermissions(
    permissions,
    input.servicePolicy.id,
    input.websiteUserRoleId,
    input.websiteAdminRoleId
  );
}

function activityCreateValidation() {
  // Directus validates create payloads without hydrating scalar M2O UUIDs. Relation-role
  // membership is therefore verified by the server activity writer before this request.
  // Keep the submitted relation IDs required here, along with the metadata allowlists.
  return {
    _and: [
      { action: { _in: ACTIVITY_ACTIONS } },
      { administrator: { _nnull: true } },
      { target_user: { _nnull: true } },
      { administrator_email: { _nempty: true } },
      { target_email: { _nempty: true } },
      {
        _or: [{ previous_value: { _null: true } }, { previous_value: { _in: ACTIVITY_VALUES } }]
      },
      {
        _or: [{ new_value: { _null: true } }, { new_value: { _in: ACTIVITY_VALUES } }]
      }
    ]
  };
}

function permission(policy, collection, action, permissions, validation, fields) {
  return {
    policy,
    collection,
    action,
    permissions,
    validation,
    presets: null,
    fields
  };
}

async function migrateSharedDashboardPolicy(directus, input) {
  const sourcePolicy = requirePolicyByName(
    input.policies,
    WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME
  );
  if (sourcePolicy.admin_access) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} grants Directus Admin Access; it was not changed.`
    );
  }
  const sourceAccessRowsBefore = collectPolicyAccessRows(sourcePolicy);
  const sourceUserIdsBefore = userIdsFromPolicy(sourcePolicy);
  const sourceAdminRowsBefore = sourceAccessRowsBefore.filter(
    (row) => row.roleId === input.websiteAdminRoleId && !row.userId
  );
  const sourceJunctionIdsBefore = new Set(
    sourceAccessRowsBefore.map((row) => row.junctionId).filter(Boolean)
  );
  const legacyPhantomUserIds = legacyFallbackUserIdsFromPolicy(sourcePolicy).filter((id) =>
    sourceJunctionIdsBefore.has(id)
  );
  const diagnosedUserWasParserArtifact =
    sourceUserIdsBefore.length === 0 &&
    sourceAdminRowsBefore.length === 1 &&
    legacyPhantomUserIds.length > 0;
  let completedParserArtifactMigration = false;
  if (sourceUserIdsBefore.length === 0 && sourceAdminRowsBefore.length === 0) {
    const restrictedMatches = input.policies.filter(
      (policy) => policy.name === WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
    );
    if (restrictedMatches.length === 1) {
      const existingRestrictedPolicy = restrictedMatches[0];
      assertRestrictedDashboardAttachments(
        existingRestrictedPolicy,
        input.websiteAdminRoleId,
        true
      );
      if (existingRestrictedPolicy.admin_access || existingRestrictedPolicy.app_access) {
        throw new SetupError(
          `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} has unexpected elevated access.`
        );
      }
      assertRestrictedDashboardPermissionSet({
        sourcePolicy,
        restrictedPolicy: existingRestrictedPolicy,
        sourcePermissions: input.permissions,
        permissions: input.permissions,
        websiteUserRoleId: input.websiteUserRoleId,
        websiteAdminRoleId: input.websiteAdminRoleId
      });
      completedParserArtifactMigration = true;
    }
  }
  if (
    sourceUserIdsBefore.length === 0 &&
    !diagnosedUserWasParserArtifact &&
    !completedParserArtifactMigration
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} has no strict direct-user attachment and its prior state cannot be explained unambiguously; no policy attachment was changed.`
    );
  }
  if (diagnosedUserWasParserArtifact) {
    console.info(
      `Confirmed the previously reported direct user on ${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} was a junction-id parser artifact; no user attachment requires restoration.`
    );
  }
  if (completedParserArtifactMigration) {
    console.info(
      `Confirmed the parser-artifact dashboard migration was already completed; no user attachment requires restoration.`
    );
  }
  const sourceRoleIdsBefore = roleIdsFromPolicy(sourcePolicy);
  const sourcePermissionSnapshotBefore = permissionSnapshot(input.permissions, [sourcePolicy.id]);

  let restrictedPolicy = await ensureRestrictedDashboardPolicy(directus, input.websiteAdminRoleId);
  await ensureRestrictedDashboardPermissions(directus, {
    sourcePolicy,
    restrictedPolicy,
    sourcePermissions: input.permissions,
    websiteUserRoleId: input.websiteUserRoleId,
    websiteAdminRoleId: input.websiteAdminRoleId
  });

  restrictedPolicy = await readPolicyByName(
    directus,
    WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
  );
  if (!roleIdsFromPolicy(restrictedPolicy).includes(input.websiteAdminRoleId)) {
    await safeRequest(
      directus,
      updatePolicy(restrictedPolicy.id, {
        roles: { create: [{ role: input.websiteAdminRoleId }] }
      }),
      `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} role attachment`
    );
    console.info(`Attached ${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} to Website Admin.`);
  } else {
    console.info(`Reused ${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} attachment.`);
  }

  restrictedPolicy = await readPolicyByName(
    directus,
    WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
  );
  assertRestrictedDashboardAttachments(restrictedPolicy, input.websiteAdminRoleId, true);
  await verifyRestrictedDashboardPermissions(directus, {
    sourcePolicy,
    restrictedPolicy,
    sourcePermissions: await readAllPermissions(directus),
    websiteUserRoleId: input.websiteUserRoleId,
    websiteAdminRoleId: input.websiteAdminRoleId
  });

  const refreshedSource = await readPolicyByName(
    directus,
    WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME
  );
  const adminAccessEntries = (refreshedSource.roles ?? []).filter(
    (entry) =>
      entry && typeof entry === "object" && relationId(entry.role) === input.websiteAdminRoleId
  );
  if (adminAccessEntries.length > 1) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} has duplicate Website Admin attachments.`
    );
  }
  if (adminAccessEntries.length === 1) {
    const junctionId = relationId(adminAccessEntries[0]);
    if (!junctionId || junctionId === input.websiteAdminRoleId) {
      throw new SetupError(
        `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} attachment junction could not be identified safely.`
      );
    }
    await safeRequest(
      directus,
      updatePolicy(refreshedSource.id, { roles: { delete: [junctionId] } }),
      `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} Website Admin detachment`
    );
    console.info(
      `Detached Website Admin from ${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME}; direct users were preserved.`
    );
  } else {
    console.info(
      `Website Admin was already detached from ${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME}.`
    );
  }

  const [sourceAfter, permissionsAfter] = await Promise.all([
    readPolicyByName(directus, WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME),
    readAllPermissions(directus)
  ]);
  const expectedSourceRoleIds = sourceRoleIdsBefore.filter(
    (roleId) => roleId !== input.websiteAdminRoleId
  );
  if (
    !sameStringSet(userIdsFromPolicy(sourceAfter), sourceUserIdsBefore) ||
    !sameStringSet(roleIdsFromPolicy(sourceAfter), expectedSourceRoleIds) ||
    permissionSnapshot(permissionsAfter, [sourceAfter.id]) !== sourcePermissionSnapshotBefore
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} consumers or permissions changed unexpectedly.`
    );
  }
  console.info(
    `Verified ${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} permissions and direct-user authorization are unchanged.`
  );
}

async function ensureRestrictedDashboardPolicy(directus, websiteAdminRoleId) {
  const policies = await readAllPolicies(directus);
  const matches = policies.filter(
    (policy) => policy.name === WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
  );
  if (matches.length > 1) {
    throw new SetupError(
      `Multiple ${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} policies exist.`
    );
  }
  if (matches.length === 0) {
    await safeRequest(
      directus,
      createPolicy({
        name: WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME,
        icon: "dashboard",
        description: "MazeAI Website Admin dashboard reads without broad Directus user access.",
        admin_access: false,
        app_access: false
      }),
      `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} policy create`
    );
    console.info(`Created ${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME}.`);
  } else {
    assertRestrictedDashboardAttachments(matches[0], websiteAdminRoleId, false);
    if (matches[0].admin_access || matches[0].app_access) {
      throw new SetupError(
        `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} has unexpected elevated access.`
      );
    }
    console.info(`Reused ${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME}.`);
  }
  return readPolicyByName(directus, WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME);
}

function assertRestrictedDashboardAttachments(policy, websiteAdminRoleId, requireAttached) {
  const accessRows = collectPolicyAccessRows(policy);
  const websiteAdminRows = accessRows.filter(
    (row) => row.roleId === websiteAdminRoleId && !row.userId
  );
  const unexpectedRows = accessRows.filter(
    (row) => row.userId || row.roleId !== websiteAdminRoleId || !row.junctionId
  );
  if (
    unexpectedRows.length > 0 ||
    websiteAdminRows.length > 1 ||
    (requireAttached && websiteAdminRows.length !== 1)
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} has unexpected role/user attachments.`
    );
  }
}

async function ensureRestrictedDashboardPermissions(directus, input) {
  const desired = buildRestrictedDashboardPermissions(input);
  const expectedKeys = new Set(desired.map((item) => `${item.collection}:${item.action}`));
  const existing = (await readAllPermissions(directus)).filter(
    (item) => relationId(item.policy) === input.restrictedPolicy.id
  );
  if (existing.some((item) => !expectedKeys.has(`${item.collection}:${item.action}`))) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} has an unexpected permission.`
    );
  }
  for (const item of desired) await upsertPermission(directus, item);
  await verifyRestrictedDashboardPermissions(directus, {
    ...input,
    sourcePermissions: await readAllPermissions(directus)
  });
}

function buildRestrictedDashboardPermissions(input) {
  const sourcePermissions = input.sourcePermissions.filter(
    (item) => relationId(item.policy) === input.sourcePolicy.id
  );
  const desired = [];
  for (const spec of DASHBOARD_READ_SPECS) {
    const matches = sourcePermissions.filter(
      (item) => item.collection === spec.collection && item.action === "read"
    );
    if (matches.length !== 1) {
      throw new SetupError(
        `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} must contain exactly one ${spec.collection} Read permission.`
      );
    }
    const source = matches[0];
    if (!sameStringSet(source.fields, spec.fields)) {
      throw new SetupError(
        `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} ${spec.collection} fields differ from the diagnosed dashboard allowlist.`
      );
    }
    if (
      spec.collection === "directus_users" &&
      source.permissions !== null &&
      !(typeof source.permissions === "object" && Object.keys(source.permissions).length === 0)
    ) {
      throw new SetupError(
        `${WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME} directus_users filter is no longer the diagnosed broad filter.`
      );
    }
    desired.push({
      policy: input.restrictedPolicy.id,
      collection: spec.collection,
      action: "read",
      permissions:
        spec.collection === "directus_users"
          ? {
              role: {
                _in: [input.websiteUserRoleId, input.websiteAdminRoleId]
              }
            }
          : source.permissions,
      validation: source.validation,
      presets: source.presets,
      fields: spec.fields
    });
  }
  return desired;
}

async function verifyRestrictedDashboardPermissions(directus, input) {
  const permissions = await readAllPermissions(directus);
  assertRestrictedDashboardPermissionSet({ ...input, permissions });
}

function assertRestrictedDashboardPermissionSet(input) {
  const desired = buildRestrictedDashboardPermissions(input);
  const actual = input.permissions.filter(
    (item) => relationId(item.policy) === input.restrictedPolicy.id
  );
  if (
    actual.length !== desired.length ||
    desired.some((expected) => {
      const matches = actual.filter(
        (item) => item.collection === expected.collection && item.action === expected.action
      );
      return matches.length !== 1 || !permissionMatches(matches[0], expected);
    })
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME} permission verification failed.`
    );
  }
}

async function restrictExistingWebsiteAdminUserReads(directus, input) {
  const selfRead = namedAdminUserReadPermission(input, WEBSITE_ADMIN_SELF_READ_POLICY_NAME);
  if (
    !sameStringSet(selfRead.permission.fields, ADMIN_SELF_READ_FIELDS) ||
    !isExactCurrentUserSelfRead(selfRead.permission.permissions)
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_SELF_READ_POLICY_NAME} is not the diagnosed safe current-user read; it was not changed.`
    );
  }
  console.info(`Preserved ${WEBSITE_ADMIN_SELF_READ_POLICY_NAME} current-user-only read.`);

  await migrateSharedDashboardPolicy(directus, input);

  const managedUsers = {
    role: { _in: [input.websiteUserRoleId, input.websiteAdminRoleId] }
  };

  const userRead = namedAdminUserReadPermission(input, WEBSITE_ADMIN_USER_READ_POLICY_NAME, {
    requireExclusiveAdminAttachment: true
  });
  if (
    !Array.isArray(userRead.permission.fields) ||
    userRead.permission.fields.some((field) => !ADMIN_USER_READ_FIELDS.includes(field))
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} contains fields outside the Task 4B allowlist; it was not changed.`
    );
  }
  const userReadAlreadyRestricted = isExactRoleAllowlist(userRead.permission.permissions, [
    input.websiteUserRoleId,
    input.websiteAdminRoleId
  ]);
  const diagnosedWebsiteUserOnly = isExactRoleAllowlist(userRead.permission.permissions, [
    input.websiteUserRoleId
  ]);
  if (!userReadAlreadyRestricted && !diagnosedWebsiteUserOnly) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} no longer has the diagnosed Website User-only filter; it was not changed.`
    );
  }
  if (
    !userReadAlreadyRestricted ||
    !sameStringSet(userRead.permission.fields, ADMIN_USER_READ_FIELDS)
  ) {
    await safeRequest(
      directus,
      updatePermission(userRead.permission.id, {
        permissions: managedUsers,
        fields: ADMIN_USER_READ_FIELDS
      }),
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} restriction`
    );
    console.info(
      `Restricted ${WEBSITE_ADMIN_USER_READ_POLICY_NAME} to the two managed application roles and Task 4B fields.`
    );
  } else {
    console.info(`Reused restricted ${WEBSITE_ADMIN_USER_READ_POLICY_NAME}.`);
  }

  await restrictExistingWebsiteAdminStatusUpdate(directus, input);
}

async function restrictExistingWebsiteAdminStatusUpdate(directus, input) {
  const policy = requirePolicyByName(input.policies, WEBSITE_ADMIN_USER_READ_POLICY_NAME);
  const accessRows = collectPolicyAccessRows(policy);
  if (
    accessRows.length !== 1 ||
    accessRows[0].roleId !== input.websiteAdminRoleId ||
    accessRows[0].userId ||
    !accessRows[0].junctionId
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} is not attached exclusively to Website Admin; its status permission was not changed.`
    );
  }
  if (
    !input.websiteAdminPolicyIds.includes(policy.id) ||
    input.websiteUserPolicyIds.includes(policy.id)
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} status permission reaches an unexpected role; it was not changed.`
    );
  }

  const matches = input.permissions.filter(
    (permission) =>
      relationId(permission.policy) === policy.id &&
      permission.collection === "directus_users" &&
      permission.action === "update"
  );
  if (matches.length !== 1) {
    throw new SetupError(
      `Expected exactly one ${WEBSITE_ADMIN_USER_READ_POLICY_NAME} directus_users Update permission.`
    );
  }
  const statusUpdate = matches[0];
  if (
    !sameStringSet(statusUpdate.fields, ["status"]) ||
    !isExactRoleAllowlist(statusUpdate.permissions, [input.websiteUserRoleId])
  ) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} status update is broader than the diagnosed status-only Website User scope; it was not changed.`
    );
  }
  if (isExactStatusValidation(statusUpdate.validation)) {
    console.info("Reused exact Website Admin active/suspended status validation.");
    return;
  }
  if (statusUpdate.validation !== null) {
    throw new SetupError(
      `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} has an unexpected status validation shape; it was not changed.`
    );
  }

  await safeRequest(
    directus,
    updatePermission(statusUpdate.id, {
      validation: { status: { _in: ["active", "suspended"] } }
    }),
    `${WEBSITE_ADMIN_USER_READ_POLICY_NAME} status validation restriction`
  );
  console.info("Restricted Website Admin status validation to active and suspended.");
}

function verifyExistingWebsiteAdminUserReads(input) {
  const selfRead = namedAdminUserReadPermission(input, WEBSITE_ADMIN_SELF_READ_POLICY_NAME);
  if (
    !sameStringSet(selfRead.permission.fields, ADMIN_SELF_READ_FIELDS) ||
    !isExactCurrentUserSelfRead(selfRead.permission.permissions)
  ) {
    throw new SetupError("Website Admin current-user self-read verification failed.");
  }

  const sharedDashboardPolicy = requirePolicyByName(
    input.policies,
    WEBSITE_ADMIN_DASHBOARD_READ_POLICY_NAME
  );
  const malformedSharedAccessRows = collectPolicyAccessRows(sharedDashboardPolicy).filter(
    (row) => !row.junctionId || (!row.roleId && !row.userId) || (row.roleId && row.userId)
  );
  if (roleIdsFromPolicy(sharedDashboardPolicy).includes(input.websiteAdminRoleId)) {
    throw new SetupError(
      "Shared Dashboard Read still reaches Website Admin after restricted-policy migration."
    );
  }
  if (malformedSharedAccessRows.length > 0) {
    throw new SetupError("Shared Dashboard Read contains a malformed directus_access junction.");
  }
  const restrictedDashboardPolicy = requirePolicyByName(
    input.policies,
    WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME
  );
  assertRestrictedDashboardAttachments(restrictedDashboardPolicy, input.websiteAdminRoleId, true);
  if (!input.websiteAdminPolicyIds.includes(restrictedDashboardPolicy.id)) {
    throw new SetupError("Restricted Dashboard policy is not attached directly to Website Admin.");
  }
  assertRestrictedDashboardPermissionSet({
    sourcePolicy: sharedDashboardPolicy,
    restrictedPolicy: restrictedDashboardPolicy,
    sourcePermissions: input.permissions,
    permissions: input.permissions,
    websiteUserRoleId: input.websiteUserRoleId,
    websiteAdminRoleId: input.websiteAdminRoleId
  });
  const dashboardRead = input.permissions.find(
    (item) =>
      relationId(item.policy) === restrictedDashboardPolicy.id &&
      item.collection === "directus_users" &&
      item.action === "read"
  );
  if (!dashboardRead) throw new SetupError("Restricted Dashboard user read is missing.");

  const userRead = namedAdminUserReadPermission(input, WEBSITE_ADMIN_USER_READ_POLICY_NAME, {
    requireExclusiveAdminAttachment: true
  });
  if (
    !sameStringSet(userRead.permission.fields, ADMIN_USER_READ_FIELDS) ||
    !isExactRoleAllowlist(userRead.permission.permissions, [
      input.websiteUserRoleId,
      input.websiteAdminRoleId
    ])
  ) {
    throw new SetupError("Website Admin User Read verification failed.");
  }

  const rolesById = new Map(input.allRoles.map((role) => [role.id, role]));
  const roleContext = {
    currentRoleId: input.websiteAdminRoleId,
    currentRoleIds: collectIncludedRoleIds(input.websiteAdminRoleId, rolesById),
    allRoleIds: [...rolesById.keys()]
  };
  const managedRoleIds = new Set([input.websiteUserRoleId, input.websiteAdminRoleId]);
  for (const [label, permission] of [
    [WEBSITE_ADMIN_DASHBOARD_RESTRICTED_POLICY_NAME, dashboardRead],
    [WEBSITE_ADMIN_USER_READ_POLICY_NAME, userRead.permission]
  ]) {
    const visibleRoleIds = roleContext.allRoleIds.filter((roleId) =>
      couldFilterMatchRole(permission.permissions, roleId, roleContext)
    );
    if (
      visibleRoleIds.length !== managedRoleIds.size ||
      visibleRoleIds.some((roleId) => !managedRoleIds.has(roleId)) ||
      couldFilterMatchRole(permission.permissions, null, roleContext)
    ) {
      throw new SetupError(`${label} still exposes an unmanaged or roleless identity.`);
    }
  }

  console.info("Accepted the exact Website Admin current-user self-read exception.");
  console.info(
    "Verified Dashboard Read and User Read expose only Website User and Website Admin identities."
  );
}

function namedAdminUserReadPermission(input, policyName, options = {}) {
  const matches = input.policies.filter((policy) => policy.name === policyName);
  if (matches.length !== 1) {
    throw new SetupError(`Expected exactly one ${policyName} policy.`);
  }
  const policy = matches[0];
  if (!input.websiteAdminPolicyIds.includes(policy.id)) {
    throw new SetupError(`${policyName} is not attached directly to Website Admin.`);
  }
  if (options.requireExclusiveAdminAttachment) {
    const roleIds = roleIdsFromPolicy(policy);
    if (
      roleIds.length !== 1 ||
      roleIds[0] !== input.websiteAdminRoleId ||
      userIdsFromPolicy(policy).length > 0
    ) {
      throw new SetupError(
        `${policyName} has shared role/user attachments, so changing it is not unambiguously safe.`
      );
    }
  }

  const permissions = input.permissions.filter(
    (item) =>
      relationId(item.policy) === policy.id &&
      item.collection === "directus_users" &&
      item.action === "read"
  );
  if (permissions.length !== 1) {
    throw new SetupError(`Expected exactly one ${policyName} directus_users Read permission.`);
  }
  return { policy, permission: permissions[0] };
}

function isExactCurrentUserSelfRead(filter) {
  const rule = { id: { _eq: "$CURRENT_USER" } };
  return deepEqual(filter, rule) || deepEqual(filter, { _and: [rule] });
}

function isExactRoleAllowlist(filter, roleIds) {
  const variants = [{ role: { _in: roleIds } }];
  if (roleIds.length === 1) variants.push({ role: { _eq: roleIds[0] } });
  return variants.some((rule) => deepEqual(filter, rule) || deepEqual(filter, { _and: [rule] }));
}

function isExactStatusValidation(validation) {
  const rule = { status: { _in: ["active", "suspended"] } };
  return deepEqual(validation, rule) || deepEqual(validation, { _and: [rule] });
}

async function upsertPermission(directus, desired, knownExisting = null) {
  const permissions = await readAllPermissions(directus);
  const existing =
    knownExisting ??
    permissions.find(
      (item) =>
        relationId(item.policy) === desired.policy &&
        item.collection === desired.collection &&
        item.action === desired.action
    );

  if (existing) {
    if (!permissionMatches(existing, desired)) {
      await safeRequest(
        directus,
        updatePermission(existing.id, desired),
        `${desired.collection} ${desired.action} permission update`
      );
      console.info(`Updated ${desired.collection} ${desired.action} permission.`);
    } else {
      console.info(`Reused ${desired.collection} ${desired.action} permission.`);
    }
    return;
  }

  await safeRequest(
    directus,
    createPermission(desired),
    `${desired.collection} ${desired.action} permission create`
  );
  console.info(`Created ${desired.collection} ${desired.action} permission.`);
}

function findReusableStatusPermission(
  permissions,
  adminPolicyIds,
  websiteUserPolicyIds,
  websiteUserRoleId
) {
  const candidates = permissions.filter(
    (item) =>
      adminPolicyIds.includes(relationId(item.policy)) &&
      !websiteUserPolicyIds.includes(relationId(item.policy)) &&
      item.collection === "directus_users" &&
      item.action === "update" &&
      sameStringSet(item.fields, ["status"]) &&
      isExactRoleAllowlist(item.permissions, [websiteUserRoleId])
  );
  if (candidates.length > 1) {
    throw new SetupError("Multiple reusable Website Admin status permissions exist.");
  }
  return candidates[0] ?? null;
}

async function verifyConfiguration(directus, input) {
  const fields = await safeRequest(
    directus,
    readFieldsByCollection(ACTIVITY_COLLECTION),
    "admin_activity verification"
  );
  const requiredFields = [
    ["id", "uuid"],
    ["action", "string"],
    ["administrator", "uuid"],
    ["administrator_email", "string"],
    ["target_user", "uuid"],
    ["target_email", "string"],
    ["previous_value", "string"],
    ["new_value", "string"],
    ["date_created", "timestamp"]
  ];
  for (const [name, type] of requiredFields) {
    const field = fields.find((item) => item.field === name);
    if (!field || field.type !== type) {
      throw new SetupError(`admin_activity.${name} is missing or has an unexpected type.`);
    }
  }
  assertActivityFieldConfiguration(fields);

  const relations = await safeRequest(directus, readRelations(), "relationship verification");
  for (const field of ["administrator", "target_user"]) {
    const relation = relations.find(
      (item) => item.collection === ACTIVITY_COLLECTION && item.field === field
    );
    if (!relation || relation.related_collection !== "directus_users") {
      throw new SetupError(`admin_activity.${field} relationship verification failed.`);
    }
  }

  const adminPolicy = await readPolicyByName(directus, ADMIN_POLICY_NAME);
  const servicePolicy = await readPolicyByName(directus, SERVICE_POLICY_NAME);
  if (
    !roleIdsFromPolicy(adminPolicy).includes(input.websiteAdminRoleId) ||
    adminPolicy.admin_access ||
    adminPolicy.app_access
  ) {
    throw new SetupError("Website Admin user-management policy attachment is invalid.");
  }
  if (
    roleIdsFromPolicy(servicePolicy).length > 0 ||
    servicePolicy.admin_access ||
    servicePolicy.app_access
  ) {
    throw new SetupError("Management service policy has broad or role-level access.");
  }

  const serviceUsers = await safeRequest(
    directus,
    readUsers({
      fields: ["id", "email", "status", "role", "policies.id", "policies.policy.id"],
      filter: { email: { _eq: SERVICE_EMAIL } },
      limit: 2
    }),
    "service identity verification"
  );
  if (serviceUsers.length !== 1) throw new SetupError("Management service identity is missing.");
  const serviceUser = serviceUsers[0];
  if (
    serviceUser.status !== "active" ||
    relationId(serviceUser.role) ||
    !userIdsFromPolicy(servicePolicy).includes(serviceUser.id)
  ) {
    throw new SetupError("Management service identity attachment or status is invalid.");
  }

  const allPolicies = await readAllPolicies(directus);
  const policiesForServiceUser = allPolicies.filter((policy) =>
    userIdsFromPolicy(policy).includes(serviceUser.id)
  );
  if (policiesForServiceUser.length !== 1 || policiesForServiceUser[0].id !== servicePolicy.id) {
    throw new SetupError("Management service identity has unexpected policy access.");
  }

  const websiteAdminRole = await safeRequest(
    directus,
    readRole(input.websiteAdminRoleId, {
      fields: ["id", "name", "policies.id", "policies.policy.id", "policies.policy.name"]
    }),
    "Website Admin role verification"
  );
  const websiteUserRole = await safeRequest(
    directus,
    readRole(input.websiteUserRoleId, {
      fields: ["id", "name", "policies.id", "policies.policy.id", "policies.policy.name"]
    }),
    "Website User role verification"
  );
  const permissions = await readAllPermissions(directus);
  const policies = await readAllPolicies(directus);
  const allRoles = await readAllRolesForAccess(directus, "role hierarchy verification");
  const websiteAdminDirectPolicyIds = policyIdsFromRole(websiteAdminRole);
  const adminPolicyIds = effectivePolicyIdsForRole(input.websiteAdminRoleId, allRoles);
  const websiteUserPolicyIds = effectivePolicyIdsForRole(input.websiteUserRoleId, allRoles);
  assertNoAdministrativePolicy(policies, adminPolicyIds, "Website Admin");
  verifyExistingWebsiteAdminUserReads({
    permissions,
    policies,
    allRoles,
    websiteAdminRoleId: input.websiteAdminRoleId,
    websiteAdminPolicyIds: websiteAdminDirectPolicyIds,
    websiteUserRoleId: input.websiteUserRoleId
  });
  assertAdminPermissionsAreNotBroad(
    permissions,
    adminPolicyIds,
    input.websiteUserRoleId,
    input.websiteAdminRoleId
  );
  assertExpectedAdminCapabilities(
    permissions,
    adminPolicyIds,
    input.websiteUserRoleId,
    input.websiteAdminRoleId
  );
  assertServicePolicyHasOnlyExpectedPermissions(
    permissions,
    servicePolicy.id,
    input.websiteUserRoleId,
    input.websiteAdminRoleId
  );

  if (
    permissionSnapshot(permissions, websiteUserPolicyIds) !== input.websiteUserPermissionSnapshot
  ) {
    throw new SetupError("Website User permissions changed during setup; verification stopped.");
  }

  return { adminPolicy, servicePolicy, serviceUser };
}

function assertExpectedAdminCapabilities(
  permissions,
  policyIds,
  websiteUserRoleId,
  websiteAdminRoleId
) {
  const expected = [
    permission(
      "",
      "directus_users",
      "read",
      { role: { _in: [websiteUserRoleId, websiteAdminRoleId] } },
      null,
      ADMIN_USER_READ_FIELDS
    ),
    permission(
      "",
      "directus_users",
      "update",
      { role: { _eq: websiteUserRoleId } },
      { status: { _in: ["active", "suspended"] } },
      ["status"]
    ),
    permission(
      "",
      "user_profiles",
      "read",
      { user: { role: { _in: [websiteUserRoleId, websiteAdminRoleId] } } },
      null,
      ["user", "account_number"]
    ),
    permission("", ACTIVITY_COLLECTION, "read", {}, null, ACTIVITY_READ_FIELDS)
  ];

  for (const desired of expected) {
    const match = permissions.some(
      (item) =>
        policyIds.includes(relationId(item.policy)) &&
        item.collection === desired.collection &&
        item.action === desired.action &&
        permissionMatches(item, { ...desired, policy: relationId(item.policy) })
    );
    if (!match) {
      throw new SetupError(
        `Website Admin ${desired.collection} ${desired.action} permission verification failed.`
      );
    }
  }
}

function assertServicePolicyHasOnlyExpectedPermissions(
  permissions,
  servicePolicyId,
  websiteUserRoleId,
  websiteAdminRoleId
) {
  const servicePermissions = permissions.filter(
    (item) => relationId(item.policy) === servicePolicyId
  );
  const managedRoleIds = [websiteUserRoleId, websiteAdminRoleId];
  const managedUsers = { role: { _in: managedRoleIds } };
  const expected = [
    permission(servicePolicyId, "directus_users", "read", managedUsers, null, [
      "id",
      "email",
      "status",
      "role"
    ]),
    permission(
      servicePolicyId,
      "directus_users",
      "update",
      managedUsers,
      { role: { _in: managedRoleIds } },
      ["role"]
    ),
    permission(
      servicePolicyId,
      ACTIVITY_COLLECTION,
      "create",
      {},
      activityCreateValidation(),
      ACTIVITY_CREATE_FIELDS
    )
  ];
  const expectedKeys = new Set(expected.map((item) => `${item.collection}:${item.action}`));
  for (const item of servicePermissions) {
    if (!expectedKeys.has(`${item.collection}:${item.action}`)) {
      throw new SetupError(
        `Management service has unexpected ${item.collection} ${item.action} permission.`
      );
    }
  }
  if (servicePermissions.length !== expectedKeys.size) {
    throw new SetupError("Management service permissions are missing or duplicated.");
  }

  for (const desired of expected) {
    const actual = servicePermissions.find(
      (item) => item.collection === desired.collection && item.action === desired.action
    );
    if (!actual || !permissionMatches(actual, desired)) {
      throw new SetupError(
        `Management service ${desired.collection} ${desired.action} permission is invalid.`
      );
    }
  }
}

function reportRestrictedPolicyDiagnosis(input) {
  const rolesById = new Map(input.allRoles.map((role) => [role.id, role]));
  const usersById = new Map(input.directUsers.map((user) => [user.id, user]));
  const accessRows = collectPolicyAccessRows(input.restrictedPolicy);
  const strictRoleIds = accessRows.map((row) => row.roleId).filter(Boolean);
  const strictUserIds = accessRows.map((row) => row.userId).filter(Boolean);
  const legacyRoleIds = legacyFallbackRoleIdsFromPolicy(input.restrictedPolicy);
  const legacyUserIds = legacyFallbackUserIdsFromPolicy(input.restrictedPolicy);
  const websiteAdminRows = accessRows.filter((row) => row.roleId === input.websiteAdminRoleId);
  const otherRoleIds = strictRoleIds.filter((id) => id !== input.websiteAdminRoleId);
  const duplicateTargets = findDuplicateAccessTargets(accessRows);
  const responseShapeMismatch =
    !sameStringSet(legacyRoleIds, [...new Set(strictRoleIds)]) ||
    !sameStringSet(legacyUserIds, [...new Set(strictUserIds)]);
  const restrictedPermissionCount = input.permissions.filter(
    (permission) => relationId(permission.policy) === input.restrictedPolicy.id
  ).length;

  console.info(`Read-only diagnosis for ${policyLabel(input.restrictedPolicy)}:`);
  console.info(
    `- Direct roles (strict junction interpretation): ${formatList(
      [...new Set(strictRoleIds)].map((id) =>
        roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" })
      )
    )}.`
  );
  console.info(
    `- Direct users (strict junction interpretation): ${formatList(
      [...new Set(strictUserIds)].map((id) => userLabel(usersById.get(id) ?? { id }))
    )}.`
  );
  console.info(`- directus_access junction entries (${accessRows.length}):`);
  for (const row of accessRows) {
    console.info(
      `  - junction [ref:${fingerprint(row.junctionId)}]; role=${
        row.roleId
          ? roleLabel(rolesById.get(row.roleId) ?? { id: row.roleId, name: "Unknown role" })
          : "none"
      }; user=${row.userId ? userLabel(usersById.get(row.userId) ?? { id: row.userId }) : "none"}; returned through=${[
        ...row.sources
      ].join("+")}`
    );
  }
  console.info(
    `- Website Admin attached exactly once: ${websiteAdminRows.length === 1 ? "yes" : "NO"}.`
  );
  console.info(
    `- Other roles attached: ${formatList(
      [...new Set(otherRoleIds)].map((id) =>
        roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" })
      )
    )}.`
  );
  console.info(
    `- Direct users attached: ${formatList(
      [...new Set(strictUserIds)].map((id) => userLabel(usersById.get(id) ?? { id }))
    )}.`
  );
  console.info(
    `- Relation response-shape misinterpretation detected: ${responseShapeMismatch ? "YES" : "no"}.`
  );
  if (responseShapeMismatch) {
    console.info(
      "  The legacy parser falls back to the junction id when role/user is null; strict parsing reads only the non-null foreign key."
    );
  }
  console.info(
    `- Duplicate junction targets: ${formatList(
      duplicateTargets.map((target) =>
        target.kind === "role"
          ? `role ${roleLabel(rolesById.get(target.id) ?? { id: target.id, name: "Unknown role" })}`
          : `user ${userLabel(usersById.get(target.id) ?? { id: target.id })}`
      )
    )}.`
  );
  console.info(
    `- Unexpected restricted-policy attachment: ${otherRoleIds.length > 0 || strictUserIds.length > 0 ? "YES" : "no"}.`
  );
  console.info(`- Restricted-policy permissions present: ${restrictedPermissionCount}.`);

  const sharedAccessRows = collectPolicyAccessRows(input.sharedPolicy);
  const sharedRoleIds = sharedAccessRows.map((row) => row.roleId).filter(Boolean);
  const sharedUserIds = sharedAccessRows.map((row) => row.userId).filter(Boolean);
  const sharedAdminRows = sharedAccessRows.filter((row) => row.roleId === input.websiteAdminRoleId);
  const sharedLegacyUserIds = legacyFallbackUserIdsFromPolicy(input.sharedPolicy);
  const sharedJunctionIds = new Set(sharedAccessRows.map((row) => row.junctionId).filter(Boolean));
  const phantomLegacyUserIds = sharedLegacyUserIds.filter(
    (id) => !sharedUserIds.includes(id) && sharedJunctionIds.has(id)
  );
  const oldUnnamedWasParserArtifact = sharedUserIds.length === 0 && phantomLegacyUserIds.length > 0;
  const sharedUserOnlyOnOld =
    sharedUserIds.length > 0 && sharedUserIds.every((id) => !strictUserIds.includes(id));
  console.info(`Read-only diagnosis for ${policyLabel(input.sharedPolicy)}:`);
  console.info(
    `- Direct roles (strict junction interpretation): ${formatList(
      [...new Set(sharedRoleIds)].map((id) =>
        roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" })
      )
    )}.`
  );
  console.info(
    `- Direct users (strict junction interpretation): ${formatList(
      [...new Set(sharedUserIds)].map((id) => userLabel(usersById.get(id) ?? { id }))
    )}.`
  );
  console.info(`- directus_access junction entries (${sharedAccessRows.length}):`);
  for (const row of sharedAccessRows) {
    console.info(
      `  - junction [ref:${fingerprint(row.junctionId)}]; role=${
        row.roleId
          ? roleLabel(rolesById.get(row.roleId) ?? { id: row.roleId, name: "Unknown role" })
          : "none"
      }; user=${row.userId ? userLabel(usersById.get(row.userId) ?? { id: row.userId }) : "none"}; returned through=${[
        ...row.sources
      ].join("+")}`
    );
  }
  console.info(
    `- Website Admin remains attached to the old policy: ${
      sharedAdminRows.length === 1
        ? "yes, exactly once"
        : sharedAdminRows.length === 0
          ? "no"
          : `YES, ${sharedAdminRows.length} times`
    }.`
  );
  console.info(
    `- Previously reported Unnamed user junction still exists: ${
      sharedUserIds.length > 0 ? "yes (strict user foreign key present)" : "NO"
    }.`
  );
  console.info(
    `- Earlier Unnamed user was a junction-id parser artifact: ${
      oldUnnamedWasParserArtifact ? "YES" : "no"
    }.`
  );
  if (oldUnnamedWasParserArtifact) {
    console.info(
      `  Legacy fallback treated ${phantomLegacyUserIds.length} junction ref(s) as user targets even though their user foreign key is null.`
    );
  }
  console.info(
    `- Old shared-policy direct user remains attached only to the old policy: ${sharedUserOnlyOnOld ? "yes" : "NO"}.`
  );
  console.info(
    `  Old policy direct users: ${formatList(
      sharedUserIds.map((id) => userLabel(usersById.get(id) ?? { id }))
    )}.`
  );
  console.info(
    `- New restricted policy has a direct user junction: ${strictUserIds.length > 0 ? "YES" : "no"}.`
  );
  console.info(
    "- This diagnosis uses metadata reads only and exits before every Directus write phase."
  );
}

function reportStatusPermissionDiagnosis(input) {
  const rolesById = new Map(input.allRoles.map((role) => [role.id, role]));
  const policiesById = new Map(input.policies.map((policy) => [policy.id, policy]));
  const effectivePolicyIds = effectivePolicyIdsForRole(input.websiteAdminRoleId, input.allRoles);
  const statusUpdates = input.permissions.filter(
    (permission) =>
      effectivePolicyIds.includes(relationId(permission.policy)) &&
      permission.collection === "directus_users" &&
      permission.action === "update" &&
      (permission.fields === null || permission.fields?.includes("status"))
  );

  console.info("Read-only Website Admin status permission diagnosis:");
  console.info(`- Contributing status-update permissions: ${statusUpdates.length}.`);
  for (const permission of statusUpdates) {
    const policy = policiesById.get(relationId(permission.policy));
    const accessRows = collectPolicyAccessRows(policy ?? {});
    const roleIds = accessRows.map((row) => row.roleId).filter(Boolean);
    const userIds = accessRows.map((row) => row.userId).filter(Boolean);
    console.info(`- Permission from ${policyLabel(policy)}:`);
    console.info(`  fields: ${formatPermissionFields(permission.fields)}`);
    console.info(`  item filter: ${safeMetadataJson(permission.permissions, rolesById)}`);
    console.info(`  validation: ${safeMetadataJson(permission.validation, rolesById)}`);
    console.info(
      `  direct roles: ${formatList(
        [...new Set(roleIds)].map((id) =>
          roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" })
        )
      )}`
    );
    console.info(
      `  direct users: ${formatList(
        [...new Set(userIds)].map((id) => `user [ref:${fingerprint(id)}]`)
      )}`
    );
    console.info(
      `  exact Website User scope: ${
        isExactRoleAllowlist(permission.permissions, [input.websiteUserRoleId]) ? "yes" : "NO"
      }`
    );
    console.info(
      `  exact active/suspended validation: ${
        isExactStatusValidation(permission.validation) ? "yes" : "NO"
      }`
    );
    console.info(
      `  status-only fields: ${sameStringSet(permission.fields, ["status"]) ? "yes" : "NO"}`
    );
  }
  console.info("- This diagnosis reads metadata only and exits before every Directus write phase.");
}

function collectPolicyAccessRows(policy) {
  const rows = new Map();
  for (const [source, entries] of [
    ["roles", policy.roles ?? []],
    ["users", policy.users ?? []]
  ]) {
    for (const entry of entries) {
      const objectEntry = entry && typeof entry === "object" ? entry : null;
      const roleId = objectEntry ? relationId(objectEntry.role) : "";
      const userId = objectEntry ? relationId(objectEntry.user) : "";
      const junctionId = objectEntry ? relationId(objectEntry) : "";
      const key = junctionId || `${source}:${roleId || userId || fingerprint(String(entry))}`;
      const row = rows.get(key) ?? {
        junctionId,
        roleId: "",
        userId: "",
        sources: new Set()
      };
      if (roleId) row.roleId = roleId;
      if (userId) row.userId = userId;
      row.sources.add(source);
      rows.set(key, row);
    }
  }
  return [...rows.values()];
}

function strictRoleIdsFromPolicy(policy) {
  return [
    ...new Set(
      collectPolicyAccessRows(policy)
        .map((row) => row.roleId)
        .filter(Boolean)
    )
  ];
}

function strictUserIdsFromPolicy(policy) {
  return [
    ...new Set(
      collectPolicyAccessRows(policy)
        .map((row) => row.userId)
        .filter(Boolean)
    )
  ];
}

// Diagnostic-only representation of the removed parser behavior. It is used to
// prove when a null foreign key was incorrectly replaced by the junction row id.
function legacyFallbackRoleIdsFromPolicy(policy) {
  return [
    ...new Set(
      (policy.roles ?? []).map((entry) => relationId(entry?.role ?? entry)).filter(Boolean)
    )
  ];
}

function legacyFallbackUserIdsFromPolicy(policy) {
  return [
    ...new Set(
      (policy.users ?? []).map((entry) => relationId(entry?.user ?? entry)).filter(Boolean)
    )
  ];
}

function findDuplicateAccessTargets(rows) {
  const counts = new Map();
  for (const row of rows) {
    const target = row.roleId
      ? { kind: "role", id: row.roleId }
      : row.userId
        ? { kind: "user", id: row.userId }
        : null;
    if (!target) continue;
    const key = `${target.kind}:${target.id}`;
    const current = counts.get(key) ?? { ...target, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].filter((entry) => entry.count > 1);
}

function reportDashboardPolicyDiagnosis(input) {
  const rolesById = new Map(input.allRoles.map((role) => [role.id, role]));
  const directRoleIds = roleIdsFromPolicy(input.policy);
  const directUserIds = userIdsFromPolicy(input.policy);
  const usersById = new Map(input.directUsers.map((user) => [user.id, user]));
  const policyPermissions = input.permissions.filter(
    (permission) => relationId(permission.policy) === input.policy.id
  );

  console.info(`Read-only diagnosis for ${policyLabel(input.policy)}:`);
  console.info(
    `- Direct roles: ${formatList(
      directRoleIds.map((id) => roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" }))
    )}.`
  );
  console.info(
    `- Direct users: ${formatList(
      directUserIds.map((id) => userLabel(usersById.get(id) ?? { id }))
    )}.`
  );
  console.info(
    `- Website Admin attached directly: ${directRoleIds.includes(input.websiteAdminRoleId) ? "yes" : "no"}.`
  );
  console.info(`- Admin Access: ${input.policy.admin_access === true ? "YES" : "no"}.`);
  console.info(`- App Access: ${input.policy.app_access === true ? "yes" : "no"}.`);
  console.info(`- Permissions (${policyPermissions.length}):`);

  for (const permission of policyPermissions) {
    console.info(
      `  - ${safeName(permission.collection, "Unknown collection")} → ${permission.action}`
    );
    console.info(`    fields: ${formatPermissionFields(permission.fields)}`);
    console.info(`    item filter: ${safeMetadataJson(permission.permissions, rolesById)}`);
    console.info(`    validation: ${safeMetadataJson(permission.validation, rolesById)}`);
    console.info(`    preset keys: ${formatPresetKeys(permission.presets)}`);
  }

  const alternativeDependencies = [];
  for (const roleId of directRoleIds) {
    if (roleId === input.websiteAdminRoleId) continue;
    const effectivePolicyIds = effectivePolicyIdsForRole(roleId, input.allRoles).filter(
      (id) => id !== input.policy.id
    );
    const hasAlternative = hasUnrestrictedUserIdRead(input.permissions, effectivePolicyIds);
    alternativeDependencies.push({
      consumer: roleLabel(rolesById.get(roleId) ?? { id: roleId, name: "Unknown role" }),
      kind: "role",
      hasAlternative
    });
  }
  for (const userId of directUserIds) {
    const user = usersById.get(userId) ?? { id: userId };
    const effectivePolicyIds = new Set(policyIdsFromUser(user));
    const roleId = relationId(user.role);
    if (roleId) {
      for (const policyId of effectivePolicyIdsForRole(roleId, input.allRoles)) {
        effectivePolicyIds.add(policyId);
      }
    }
    effectivePolicyIds.delete(input.policy.id);
    alternativeDependencies.push({
      consumer: userLabel(user),
      kind: "user",
      hasAlternative: hasUnrestrictedUserIdRead(input.permissions, [...effectivePolicyIds])
    });
  }

  if (alternativeDependencies.length === 0) {
    console.info("- Other direct consumers: none.");
  } else {
    console.info("- Other-consumer authorization dependency:");
    for (const dependency of alternativeDependencies) {
      console.info(
        `  - ${dependency.kind} ${dependency.consumer}: equivalent unrestricted user-ID read from another effective policy = ${dependency.hasAlternative ? "yes" : "no"}; removing this policy would ${dependency.hasAlternative ? "not be proven to reduce" : "reduce"} its current authorization.`
      );
    }
    console.info(
      "  Runtime/business necessity cannot be inferred from metadata, so the shared policy must be preserved for these consumers."
    );
  }
  console.info(
    "- This diagnosis reads policy, role, user-label, and permission metadata only; it performs no mutation."
  );
}

function requirePolicyByName(policies, name) {
  const matches = policies.filter((policy) => policy.name === name);
  if (matches.length !== 1) throw new SetupError(`Expected exactly one ${name} policy.`);
  return matches[0];
}

function policyIdsFromUser(user) {
  return [
    ...new Set(
      (user.policies ?? [])
        .map((entry) => (entry && typeof entry === "object" ? relationId(entry.policy) : ""))
        .filter(Boolean)
    )
  ];
}

function hasUnrestrictedUserIdRead(permissions, policyIds) {
  return permissions.some(
    (permission) =>
      policyIds.includes(relationId(permission.policy)) &&
      permission.collection === "directus_users" &&
      permission.action === "read" &&
      (permission.fields === null || permission.fields?.includes("id")) &&
      (permission.permissions === null ||
        (typeof permission.permissions === "object" &&
          Object.keys(permission.permissions).length === 0))
  );
}

function userLabel(user) {
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const email = maskEmail(user?.email);
  const label = displayName || email || "Unnamed user";
  return `${safeName(label, "Unnamed user")}${displayName && email ? ` (${email})` : ""} [ref:${fingerprint(user?.id)}]`;
}

function maskEmail(value) {
  if (typeof value !== "string" || !value.includes("@")) return "";
  const [local, domain] = value.split("@", 2);
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

function safeMetadataJson(value, rolesById) {
  return JSON.stringify(redactSensitiveMetadata(sanitizeMetadataValue(value, rolesById)));
}

function redactSensitiveMetadata(value, key = "") {
  if (/password|token|secret|cookie|authorization|api[_-]?key/i.test(key)) {
    return "<redacted>";
  }
  if (Array.isArray(value)) return value.map((item) => redactSensitiveMetadata(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nested]) => [
        nestedKey,
        redactSensitiveMetadata(nested, nestedKey)
      ])
    );
  }
  return value;
}

function formatPresetKeys(presets) {
  if (!presets || typeof presets !== "object") return "none";
  const keys = Object.keys(presets);
  return keys.length > 0 ? keys.join(", ") : "none";
}

function reportAdminReadDiagnosis(input) {
  const rolesById = new Map(input.allRoles.map((role) => [role.id, role]));
  const includedRoleIds = collectIncludedRoleIds(input.websiteAdminRole.id, rolesById);
  const directPolicyIds = new Set(policyIdsFromRole(input.websiteAdminRole));
  const effectivePolicyIds = new Set();

  for (const roleId of includedRoleIds) {
    const role = rolesById.get(roleId);
    for (const policyId of policyIdsFromRole(role ?? {})) effectivePolicyIds.add(policyId);
  }

  const effectivePolicies = input.policies.filter((policy) => effectivePolicyIds.has(policy.id));
  const directPolicies = effectivePolicies.filter((policy) => directPolicyIds.has(policy.id));
  const inheritedPolicies = effectivePolicies.filter((policy) => !directPolicyIds.has(policy.id));
  const directUserReads = input.permissions.filter(
    (permission) =>
      effectivePolicyIds.has(relationId(permission.policy)) &&
      permission.collection === "directus_users" &&
      permission.action === "read"
  );
  const managedRoleIds = new Set([input.websiteUserRole.id, input.websiteAdminRole.id]);
  const roleContext = {
    currentRoleId: input.websiteAdminRole.id,
    currentRoleIds: includedRoleIds,
    allRoleIds: [...rolesById.keys()]
  };

  console.info("Read-only Website Admin access diagnosis:");
  console.info(
    `- DIRECTUS_ADMIN_ROLE_ID resolves to ${roleLabel(input.websiteAdminRole)}; configured as the application Website Admin role.`
  );
  console.info(`- DIRECTUS_WEBSITE_USER_ROLE_ID resolves to ${roleLabel(input.websiteUserRole)}.`);
  console.info(
    `- Configured role identifiers are distinct: ${input.websiteAdminRole.id !== input.websiteUserRole.id ? "yes" : "no"}.`
  );
  console.info(
    `- Website Admin role name matches the expected application-role name: ${isWebsiteAdminName(input.websiteAdminRole.name) ? "yes" : "NO"}.`
  );
  console.info(
    `- Website Admin receives Directus Admin Access through role composition: ${effectivePolicies.some((policy) => policy.admin_access === true) ? "YES" : "no"}.`
  );
  console.info(
    `- Included role hierarchy: ${formatList(
      [...includedRoleIds].map((id) => roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" }))
    )}.`
  );
  console.info(
    `- Direct policies: ${formatList(directPolicies.map((policy) => policyLabel(policy)))}.`
  );
  console.info(
    `- Inherited policies: ${formatList(inheritedPolicies.map((policy) => policyLabel(policy)))}.`
  );

  const unsafePolicies = effectivePolicies.filter((policy) => policy.admin_access === true);
  if (unsafePolicies.length > 0) {
    console.info(
      `- Unrestricted cause: ${formatList(
        unsafePolicies.map((policy) => policyLabel(policy))
      )} grants Directus Admin Access and therefore bypasses item/field restrictions.`
    );
  }

  if (directUserReads.length === 0) {
    console.info(
      "- No explicit directus_users Read permission is contributed by the role policies."
    );
  }

  const currentGuardFailures = [];
  for (const item of directUserReads) {
    const policy = input.policies.find((candidate) => candidate.id === relationId(item.policy));
    const exactSelfRead = isExactCurrentUserSelfRead(item.permissions);
    const potentialIds = exactSelfRead
      ? [input.websiteAdminRole.id]
      : roleContext.allRoleIds.filter((id) =>
          couldFilterMatchRole(item.permissions, id, roleContext)
        );
    const rolelessVisible = exactSelfRead
      ? false
      : couldFilterMatchRole(item.permissions, null, roleContext);
    const unmanaged = potentialIds.filter((id) => !managedRoleIds.has(id));
    const parsedScope = directRoleScope(item.permissions);
    const rejectedByCurrentGuard =
      directPolicyIds.has(relationId(item.policy)) &&
      !exactSelfRead &&
      (!parsedScope || parsedScope.some((id) => !managedRoleIds.has(id)));

    if (rejectedByCurrentGuard) currentGuardFailures.push(policyLabel(policy));

    console.info(`- Permission from ${policyLabel(policy)}:`);
    console.info(`  fields: ${formatPermissionFields(item.fields)}`);
    console.info(
      `  item filter: ${JSON.stringify(sanitizeMetadataValue(item.permissions, rolesById))}`
    );
    console.info(
      `  potentially visible roles: ${formatList(
        potentialIds.map((id) => roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" }))
      )}${rolelessVisible ? "; plus roleless identities" : ""}`
    );
    console.info(
      `  unmanaged visibility: ${formatList(
        unmanaged.map((id) => roleLabel(rolesById.get(id) ?? { id, name: "Unknown role" }))
      )}${rolelessVisible ? "; roleless identities" : ""}`
    );
    console.info(
      `  current setup guard: ${rejectedByCurrentGuard ? "REJECT" : "accept"}${
        exactSelfRead
          ? " (exact current-user self-read exception)"
          : !parsedScope
            ? " (no recognized root role._eq/role._in allowlist)"
            : ""
      }`
    );
  }

  console.info(
    `- Permission(s) responsible for the reported guard failure: ${formatList([
      ...new Set(currentGuardFailures)
    ])}.`
  );
  console.info(
    "- This mode performs metadata reads only and does not create, update, or delete Directus data."
  );
}

function collectIncludedRoleIds(rootRoleId, rolesById) {
  const collected = new Set();
  const pending = [rootRoleId];
  while (pending.length > 0) {
    const roleId = pending.pop();
    if (!roleId || collected.has(roleId)) continue;
    collected.add(roleId);
    const role = rolesById.get(roleId);
    for (const child of role?.children ?? []) pending.push(relationId(child));
  }
  return collected;
}

function effectivePolicyIdsForRole(roleId, allRoles) {
  const rolesById = new Map(allRoles.map((role) => [role.id, role]));
  const policyIds = new Set();
  for (const includedRoleId of collectIncludedRoleIds(roleId, rolesById)) {
    const role = rolesById.get(includedRoleId);
    for (const policyId of policyIdsFromRole(role ?? {})) policyIds.add(policyId);
  }
  return [...policyIds];
}

function couldFilterMatchRole(filter, roleId, context) {
  if (!filter || typeof filter !== "object" || Object.keys(filter).length === 0) return true;
  if (Array.isArray(filter)) {
    return filter.every((part) => couldFilterMatchRole(part, roleId, context));
  }

  for (const [key, condition] of Object.entries(filter)) {
    if (key === "_and") {
      if (
        !Array.isArray(condition) ||
        !condition.every((part) => couldFilterMatchRole(part, roleId, context))
      ) {
        return false;
      }
      continue;
    }
    if (key === "_or") {
      if (
        !Array.isArray(condition) ||
        !condition.some((part) => couldFilterMatchRole(part, roleId, context))
      ) {
        return false;
      }
      continue;
    }
    if (key === "role" && !couldRoleConditionMatch(condition, roleId, context)) return false;
  }
  return true;
}

function couldRoleConditionMatch(condition, roleId, context) {
  if (condition === null || typeof condition !== "object") {
    return resolveRoleOperand(condition, context).includes(roleId);
  }
  if (Array.isArray(condition)) return true;
  if (Object.hasOwn(condition, "id")) {
    return couldRoleConditionMatch(condition.id, roleId, context);
  }

  for (const [operator, operand] of Object.entries(condition)) {
    const resolved = resolveRoleOperand(operand, context);
    if (operator === "_eq" && !resolved.includes(roleId)) return false;
    if (operator === "_in" && !resolved.includes(roleId)) return false;
    if (operator === "_neq" && resolved.includes(roleId)) return false;
    if (operator === "_nin" && resolved.includes(roleId)) return false;
    if (operator === "_null" && Boolean(operand) !== (roleId === null)) return false;
    if (operator === "_nnull" && Boolean(operand) !== (roleId !== null)) return false;
  }
  return true;
}

function resolveRoleOperand(value, context) {
  if (value === "$CURRENT_ROLE") return [context.currentRoleId];
  if (value === "$CURRENT_ROLES") return [...context.currentRoleIds];
  if (Array.isArray(value)) return value.flatMap((item) => resolveRoleOperand(item, context));
  return [value];
}

function sanitizeMetadataValue(value, rolesById) {
  if (Array.isArray(value)) return value.map((item) => sanitizeMetadataValue(item, rolesById));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, sanitizeMetadataValue(nested, rolesById)])
    );
  }
  if (typeof value === "string" && rolesById.has(value)) return roleLabel(rolesById.get(value));
  if (typeof value === "string" && isUuid(value)) return `<uuid-ref:${fingerprint(value)}>`;
  return value;
}

function roleLabel(role) {
  return `${safeName(role?.name, "Unnamed role")} [ref:${fingerprint(role?.id)}]`;
}

function policyLabel(policy) {
  return `${safeName(policy?.name, "Unknown policy")} [ref:${fingerprint(policy?.id)}]`;
}

function safeName(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  return value.replace(/[\r\n\t]/g, " ").slice(0, 120);
}

function fingerprint(value) {
  if (typeof value !== "string" || value.length === 0) return "unknown";
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isWebsiteAdminName(value) {
  return typeof value === "string" && /website\s+admin/i.test(value);
}

function formatPermissionFields(fields) {
  if (fields === null || fields === undefined) return "ALL FIELDS";
  if (!Array.isArray(fields)) return safeName(String(fields), "(invalid field metadata)");
  return fields.length > 0 ? fields.join(", ") : "(none)";
}

function formatList(values) {
  return values.length > 0 ? values.join(", ") : "none";
}

function assertAdminPermissionsAreNotBroad(
  permissions,
  adminPolicyIds,
  websiteUserRoleId,
  websiteAdminRoleId
) {
  const allowedReadFields = new Set(ADMIN_USER_READ_FIELDS);
  const managedRoleIds = new Set([websiteUserRoleId, websiteAdminRoleId]);
  for (const item of permissions.filter((entry) =>
    adminPolicyIds.includes(relationId(entry.policy))
  )) {
    if (item.collection === "directus_users" && item.action === "update") {
      if (!sameStringSet(item.fields, ["status"])) {
        throw new SetupError(
          "Website Admin has a directus_users update permission broader than status-only."
        );
      }
      const roles = directRoleScope(item.permissions);
      if (!roles || roles.some((id) => id !== websiteUserRoleId)) {
        throw new SetupError("Website Admin status updates are not scoped to Website Users.");
      }
      if (!isExactStatusValidation(item.validation)) {
        throw new SetupError("Website Admin status validation allows an unsupported status.");
      }
    }
    if (item.collection === "user_profiles" && item.action === "read") {
      if (
        !item.fields ||
        item.fields.some((field) => !["user", "account_number"].includes(field))
      ) {
        throw new SetupError("Website Admin user_profiles read fields are broader than Task 4B.");
      }
      const roles = relatedUserRoleScope(item.permissions);
      if (!roles || roles.some((id) => !managedRoleIds.has(id))) {
        throw new SetupError("Website Admin profile reads include an unmanaged role.");
      }
    }
    if (item.collection === ACTIVITY_COLLECTION && item.action === "read") {
      if (!item.fields || item.fields.some((field) => !ACTIVITY_READ_FIELDS.includes(field))) {
        throw new SetupError("Website Admin admin_activity read fields are broader than Task 4B.");
      }
    }
    if (item.collection === "directus_users" && item.action === "read") {
      if (!item.fields || item.fields.some((field) => !allowedReadFields.has(field))) {
        throw new SetupError("Website Admin directus_users read fields are broader than Task 4B.");
      }
      if (isExactCurrentUserSelfRead(item.permissions)) continue;
      const roles = directRoleScope(item.permissions);
      if (!roles || roles.some((id) => !managedRoleIds.has(id))) {
        throw new SetupError("Website Admin user reads include an unmanaged role.");
      }
    }
    if (
      item.collection === ACTIVITY_COLLECTION &&
      ["create", "update", "delete", "share"].includes(item.action)
    ) {
      throw new SetupError("Website Admin has write access to admin_activity.");
    }
  }
}

function assertNoAdministrativePolicy(policies, attachedPolicyIds, label) {
  if (
    policies.some((policy) => attachedPolicyIds.includes(policy.id) && policy.admin_access === true)
  ) {
    throw new SetupError(`${label} is attached to a Directus Admin Access policy.`);
  }
}

function directRoleScope(filter) {
  if (!filter || typeof filter !== "object") return null;
  if (filter.role?._eq) return [filter.role._eq];
  if (Array.isArray(filter.role?._in)) return filter.role._in;
  if (Array.isArray(filter._and)) {
    for (const part of filter._and) {
      const roleScope = directRoleScope(part);
      if (roleScope) return roleScope;
    }
  }
  return null;
}

function relatedUserRoleScope(filter) {
  if (!filter || typeof filter !== "object") return null;
  if (filter.user?.role?._eq) return [filter.user.role._eq];
  if (Array.isArray(filter.user?.role?._in)) return filter.user.role._in;
  if (Array.isArray(filter._and)) {
    for (const part of filter._and) {
      const roleScope = relatedUserRoleScope(part);
      if (roleScope) return roleScope;
    }
  }
  return null;
}

async function verifyServiceToken(directusUrl, token, websiteUserRoleId, websiteAdminRoleId) {
  const service = createDirectus(directusUrl.replace(/\/$/, ""))
    .with(staticToken(token))
    .with(rest());
  const filter = { role: { _in: [websiteUserRoleId, websiteAdminRoleId] } };
  await safeRequest(
    service,
    aggregate("directus_users", {
      aggregate: { count: ["id"] },
      query: { filter }
    }),
    "management service managed-user count"
  );
  await safeRequest(
    service,
    readUsers({ fields: ["id", "email", "status", "role"], filter, limit: 1 }),
    "management service managed-user read"
  );

  let sensitiveReadBlocked = false;
  try {
    await service.request(readUsers({ fields: ["id", "password"], limit: 1 }));
  } catch {
    sensitiveReadBlocked = true;
  }
  if (!sensitiveReadBlocked) {
    throw new SetupError("Management service unexpectedly read a sensitive user field.");
  }
}

async function storeLocalServiceToken(filePath, source, token) {
  try {
    execFileSync("git", ["check-ignore", "-q", ".env.local"], {
      cwd: process.cwd(),
      stdio: "ignore"
    });
  } catch {
    throw new SetupError(".env.local is not ignored by Git; the service token was not written.");
  }

  const updated = setEnvValue(source, "DIRECTUS_USER_MANAGEMENT_TOKEN", token);
  await writeFile(filePath, updated, { encoding: "utf8", mode: 0o600 });
  await chmod(filePath, 0o600);
}

function inspectCallbackConfiguration(localEnv) {
  const value = configuredValue("NEXT_PUBLIC_SITE_URL", localEnv);
  if (!value) return { ready: false, originLabel: "missing" };
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    return { ready: true, originLabel: local ? "local origin" : "configured origin" };
  } catch {
    return { ready: false, originLabel: "invalid" };
  }
}

async function readAllRolesForAccess(directus, label) {
  return safeRequest(
    directus,
    readRoles({
      fields: [
        "id",
        "name",
        "parent",
        "children.id",
        "policies.id",
        "policies.policy.id",
        "policies.policy.name"
      ],
      limit: -1
    }),
    label
  );
}

async function readAllPolicies(directus) {
  return safeRequest(
    directus,
    readPolicies({
      fields: [
        "id",
        "name",
        "admin_access",
        "app_access",
        "roles.id",
        "roles.role",
        "roles.user",
        "roles.policy",
        "users.id",
        "users.user",
        "users.role",
        "users.policy"
      ],
      limit: -1
    }),
    "policy inspection"
  );
}

async function readPolicyByName(directus, name) {
  const policies = await readAllPolicies(directus);
  const matches = policies.filter((policy) => policy.name === name);
  if (matches.length !== 1) throw new SetupError(`Expected one ${name} policy.`);
  return matches[0];
}

async function readAllPermissions(directus) {
  return safeRequest(
    directus,
    readPermissions({
      fields: [
        "id",
        "policy",
        "collection",
        "action",
        "permissions",
        "validation",
        "presets",
        "fields"
      ],
      limit: -1
    }),
    "permission inspection"
  );
}

function roleIdsFromPolicy(policy) {
  return [
    ...new Set(
      (policy.roles ?? [])
        .map((entry) => (entry && typeof entry === "object" ? relationId(entry.role) : ""))
        .filter(Boolean)
    )
  ];
}

function userIdsFromPolicy(policy) {
  return [
    ...new Set(
      (policy.users ?? [])
        .map((entry) => (entry && typeof entry === "object" ? relationId(entry.user) : ""))
        .filter(Boolean)
    )
  ];
}

function policyIdsFromRole(role) {
  return [
    ...new Set(
      (role.policies ?? [])
        .map((entry) => (entry && typeof entry === "object" ? relationId(entry.policy) : ""))
        .filter(Boolean)
    )
  ];
}

function relationId(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return "";
}

function permissionMatches(actual, expected) {
  return (
    actual.collection === expected.collection &&
    actual.action === expected.action &&
    sameStringSet(actual.fields, expected.fields) &&
    deepEqual(actual.permissions, expected.permissions) &&
    deepEqual(actual.validation, expected.validation) &&
    deepEqual(actual.presets, expected.presets)
  );
}

function permissionSnapshot(permissions, policyIds) {
  return canonicalJson(
    permissions
      .filter((item) => policyIds.includes(relationId(item.policy)))
      .map(({ policy, collection, action, permissions: rules, validation, presets, fields }) => ({
        policy: relationId(policy),
        collection,
        action,
        permissions: rules,
        validation,
        presets,
        fields
      }))
  );
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
  return canonicalJson([...left].sort()) === canonicalJson([...right].sort());
}

function deepEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value) {
  return JSON.stringify(canonical(value));
}

function canonical(value) {
  if (Array.isArray(value)) {
    return value
      .map(canonical)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonical(nested)])
    );
  }
  return value ?? null;
}

async function safeRequest(client, command, label) {
  try {
    return await client.request(command);
  } catch (error) {
    throw new SetupError(`${label} request failed (${directusErrorLabel(error)}).`);
  }
}

function directusErrorLabel(error) {
  if (isDirectusError(error)) {
    const statuses = error.errors
      .map((entry) => entry.extensions?.status ?? entry.extensions?.code)
      .filter(Boolean);
    return statuses.length > 0 ? [...new Set(statuses)].join(",") : "Directus error";
  }
  if (error?.cause?.code === "ECONNREFUSED") return "connection refused";
  if (error?.code === "ECONNREFUSED") return "connection refused";
  return "request unavailable";
}

function safeError(error) {
  return error instanceof SetupError ? error.message : "Unexpected setup failure.";
}

function safeVersion(info) {
  const version = info?.directus?.version ?? info?.version;
  return typeof version === "string" && /^[0-9A-Za-z.+-]+$/.test(version)
    ? version
    : "(version unavailable)";
}

class SetupError extends Error {}

function configuredValue(key, localEnv) {
  return process.env[key]?.trim() || localEnv.get(key)?.at(-1)?.trim() || "";
}

function requireConfiguration(key, value) {
  if (!value) throw new SetupError(`${key} is required.`);
}

function requireUuid(key, value) {
  requireConfiguration(key, value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new SetupError(`${key} must be a valid UUID.`);
  }
}

function assertNoConflictingValues(localEnv, keys) {
  for (const key of keys) {
    const values = localEnv.get(key) ?? [];
    if (new Set(values.filter(Boolean)).size > 1) {
      throw new SetupError(`${key} appears more than once with conflicting values in .env.local.`);
    }
  }
}

function parseEnv(source) {
  const parsed = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const entries = parsed.get(key) ?? [];
    entries.push(value);
    parsed.set(key, entries);
  }
  return parsed;
}

function setEnvValue(source, key, value) {
  const lines = source ? source.split(/\r?\n/) : [];
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  let replaced = false;
  const updated = [];
  for (const line of lines) {
    if (!pattern.test(line)) {
      updated.push(line);
      continue;
    }
    if (!replaced) {
      updated.push(`${key}=${value}`);
      replaced = true;
    }
  }
  if (!replaced) {
    if (updated.length > 0 && updated.at(-1) !== "") updated.push("");
    updated.push(`${key}=${value}`);
  }
  while (updated.length > 0 && updated.at(-1) === "") updated.pop();
  return `${updated.join("\n")}\n`;
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

if (!setupToken) {
  console.error(
    "DIRECTUS_SETUP_TOKEN is required for one-time Directus configuration. Set it in your shell environment and rerun the setup command."
  );
  process.exitCode = 1;
} else {
  await runSetup(setupToken);
}
