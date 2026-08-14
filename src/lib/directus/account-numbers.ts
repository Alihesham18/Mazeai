import "server-only";

import { randomInt } from "node:crypto";
import {
  createItem,
  isDirectusError,
  readItems,
  readUsers,
  updateItems,
  withToken
} from "@directus/sdk";
import { createDirectusRestClient } from "./client";

type AccountNumberResult =
  | { ok: true; accountNumber: string }
  | { ok: false; error: "configuration" | "collision" | "requestFailed" };

type AccountNumberCandidateFactory = () => string;

const accountProfileFields = ["id", "user", "account_number"] as const;

function accountServiceToken() {
  return process.env.DIRECTUS_ACCOUNT_SERVICE_TOKEN?.trim() || null;
}

function isUniqueConflict(error: unknown) {
  if (!isDirectusError(error)) return false;
  return error.errors.some((entry) => {
    const details = `${entry.extensions?.code ?? ""} ${entry.message}`.toLowerCase();
    return details.includes("unique") || details.includes("duplicate");
  });
}

export function generateAccountNumber(date = new Date()) {
  const year = date.getUTCFullYear();
  const suffix = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `SMA-${year}-${suffix}`;
}

export async function ensureUserAccountNumber(
  userId: string,
  options: {
    candidateFactory?: AccountNumberCandidateFactory;
    maxCollisionRetries?: number;
  } = {}
): Promise<AccountNumberResult> {
  const client = createDirectusRestClient();
  const token = accountServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  const readProfile = async () => {
    const profiles = await client.request(
      withToken(
        token,
        readItems("user_profiles", {
          fields: accountProfileFields,
          filter: { user: { _eq: userId } },
          limit: 1
        })
      )
    );
    return profiles[0] ?? null;
  };

  let profile;
  try {
    profile = await readProfile();
  } catch {
    return { ok: false, error: "requestFailed" };
  }

  if (profile?.account_number?.trim()) {
    return { ok: true, accountNumber: profile.account_number };
  }

  const candidateFactory = options.candidateFactory ?? generateAccountNumber;
  const maxAttempts = (options.maxCollisionRetries ?? 8) + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const accountNumber = candidateFactory();

    try {
      if (profile) {
        const updated = await client.request(
          withToken(
            token,
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
          )
        );

        if (updated[0]?.account_number === accountNumber) {
          return { ok: true, accountNumber };
        }
      } else {
        const created = await client.request(
          withToken(
            token,
            createItem(
              "user_profiles",
              { user: userId, account_number: accountNumber },
              { fields: accountProfileFields }
            )
          )
        );
        return { ok: true, accountNumber: created.account_number ?? accountNumber };
      }
    } catch (caught) {
      if (!isUniqueConflict(caught)) return { ok: false, error: "requestFailed" };
    }

    try {
      profile = await readProfile();
    } catch {
      return { ok: false, error: "requestFailed" };
    }

    if (profile?.account_number?.trim()) {
      return { ok: true, accountNumber: profile.account_number };
    }
  }

  return { ok: false, error: "collision" };
}

export async function ensureRegisteredUserAccountNumber(
  email: string
): Promise<AccountNumberResult> {
  const client = createDirectusRestClient();
  const token = accountServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  try {
    const users = await client.request(
      withToken(
        token,
        readUsers({
          fields: ["id"],
          filter: { email: { _eq: email } },
          limit: 1
        })
      )
    );
    const user = users[0];
    return user ? ensureUserAccountNumber(user.id) : { ok: false, error: "requestFailed" };
  } catch {
    return { ok: false, error: "requestFailed" };
  }
}
