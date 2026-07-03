import type { AccessApplication } from "@ctn/types";

import type { Queryable } from "../types";
import { queryOne } from "../types";

type AccessApplicationRow = {
  id: string;
  name: string;
  email: string;
  social_handle: string | null;
  reason: string;
  status: "received" | "approved" | "rejected";
  created_at: Date;
  updated_at: Date;
};

export type CreateAccessApplicationInput = {
  name: string;
  email: string;
  socialHandle?: string | undefined;
  reason: string;
};

export async function createAccessApplication(
  db: Queryable,
  input: CreateAccessApplicationInput,
): Promise<AccessApplication> {
  const row = await queryOne<AccessApplicationRow>(
    db,
    `
      insert into access_applications (name, email, social_handle, reason)
      values ($1, $2, $3, $4)
      returning *
    `,
    [input.name, input.email, input.socialHandle ?? null, input.reason],
  );

  if (!row) {
    throw new Error("Failed to create access application.");
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    socialHandle: row.social_handle ?? undefined,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findInviteCode(db: Queryable, code: string) {
  return queryOne<{
    id: string;
    code: string;
    status: "active" | "disabled" | "used";
    used_by_user_id: string | null;
  }>(
    db,
    "select id, code, status, used_by_user_id from invite_codes where upper(code) = upper($1)",
    [code],
  );
}
