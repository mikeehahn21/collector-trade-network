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
  // First, check the system config
  const config = await getSystemConfig(db);

  // If waitlist mode is active, assign a position
  let waitlistPosition: number | null = null;
  if (config.accessMode === "waitlist") {
    const maxPosRow = await queryOne<{ max_pos: number }>(
      db,
      "select coalesce(max(waitlist_position), 0) as max_pos from access_applications",
    );
    waitlistPosition = (maxPosRow?.max_pos ?? 0) + 1;
  }

  const row = await queryOne<
    AccessApplicationRow & { waitlist_position: number | null; invited_at: Date | null }
  >(
    db,
    `
      insert into access_applications (name, email, social_handle, reason, waitlist_position)
      values ($1, $2, $3, $4, $5)
      returning *
    `,
    [input.name, input.email, input.socialHandle ?? null, input.reason, waitlistPosition],
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
    waitlistPosition: row.waitlist_position ?? undefined,
    invitedAt: row.invited_at?.toISOString() ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getSystemConfig(db: Queryable) {
  const row = await queryOne<{ access_mode: string; daily_invite_limit: number }>(
    db,
    "select access_mode, daily_invite_limit from system_config where id = 'global'",
  );

  if (!row) {
    return { accessMode: "invite_only" as const, dailyInviteLimit: 0 };
  }

  return {
    accessMode: row.access_mode as "invite_only" | "application" | "waitlist" | "public",
    dailyInviteLimit: row.daily_invite_limit,
  };
}

export async function getWaitlistStatus(db: Queryable, email: string) {
  const row = await queryOne<{ waitlist_position: number | null }>(
    db,
    "select waitlist_position from access_applications where email = $1",
    [email],
  );

  const totalRow = await queryOne<{ count: string }>(
    db,
    "select count(*) as count from access_applications where status = 'received' and waitlist_position is not null",
  );

  const totalWaitlisted = parseInt(totalRow?.count ?? "0", 10);

  return {
    position: row?.waitlist_position ?? totalWaitlisted + 1,
    totalWaitlisted,
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
