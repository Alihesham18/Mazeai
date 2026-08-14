import { randomInt } from "node:crypto";
import {
  createDirectus,
  createItem,
  isDirectusError,
  readItems,
  readUsers,
  rest,
  staticToken,
  updateItems
} from "@directus/sdk";

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL?.replace(/\/$/, "");
const serviceToken = process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN?.trim();
const websiteUserRoleId = process.env.DIRECTUS_WEBSITE_USER_ROLE_ID?.trim();

if (!directusUrl || !serviceToken || !websiteUserRoleId) {
  console.error(
    "Missing NEXT_PUBLIC_DIRECTUS_URL, DIRECTUS_ACCOUNT_SERVICE_TOKEN, or DIRECTUS_WEBSITE_USER_ROLE_ID."
  );
  process.exitCode = 1;
} else {
  const client = createDirectus(directusUrl).with(staticToken(serviceToken)).with(rest());
  const accountProfileFields = ["id", "user", "account_number"];

  function candidate() {
    const year = new Date().getUTCFullYear();
    const suffix = randomInt(0, 1_000_000).toString().padStart(6, "0");
    return `SMA-${year}-${suffix}`;
  }

  function isUniqueConflict(error) {
    if (!isDirectusError(error)) return false;
    return error.errors.some((entry) => {
      const details = `${entry.extensions?.code ?? ""} ${entry.message}`.toLowerCase();
      return details.includes("unique") || details.includes("duplicate");
    });
  }

  async function readProfile(userId) {
    const profiles = await client.request(
      readItems("user_profiles", {
        fields: accountProfileFields,
        filter: { user: { _eq: userId } },
        limit: 1
      })
    );
    return profiles[0] ?? null;
  }

  async function ensureAccountNumber(userId) {
    let profile = await readProfile(userId);
    if (profile?.account_number?.trim()) return "existing";

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const accountNumber = candidate();

      try {
        if (profile) {
          const updated = await client.request(
            updateItems(
              "user_profiles",
              {
                filter: {
                  id: { _eq: profile.id },
                  account_number: { _empty: true }
                }
              },
              { account_number: accountNumber },
              { fields: accountProfileFields }
            )
          );
          if (updated[0]?.account_number === accountNumber) return "created";
        } else {
          await client.request(
            createItem(
              "user_profiles",
              { user: userId, account_number: accountNumber },
              { fields: accountProfileFields }
            )
          );
          return "created";
        }
      } catch (error) {
        if (!isUniqueConflict(error)) throw error;
      }

      profile = await readProfile(userId);
      if (profile?.account_number?.trim()) return "existing";
    }

    throw new Error("Account-number collision retry limit reached");
  }

  let offset = 0;
  let created = 0;
  let existing = 0;
  let failed = 0;

  while (true) {
    const users = await client.request(
      readUsers({
        fields: ["id"],
        filter: { role: { _eq: websiteUserRoleId } },
        limit: 100,
        offset
      })
    );
    if (users.length === 0) break;

    for (const user of users) {
      try {
        const result = await ensureAccountNumber(user.id);
        if (result === "created") created += 1;
        else existing += 1;
      } catch {
        failed += 1;
      }
    }

    offset += users.length;
  }

  console.info(`Account-number backfill complete: ${created} created, ${existing} unchanged.`);
  if (failed > 0) {
    console.error(
      `${failed} account(s) could not be backfilled; rerun after checking Directus logs.`
    );
    process.exitCode = 1;
  }
}
