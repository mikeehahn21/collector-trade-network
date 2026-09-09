import type { BlockedUser, ReportReason, UserReport } from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type UserReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  note: string | null;
  created_at: Date;
};

type BlockedUserRow = {
  user_id: string;
  display_name: string;
  blocked_at: Date;
};

export async function createUserReport(
  db: Queryable,
  input: {
    reporterId: string;
    reportedUserId: string;
    reason: ReportReason;
    note?: string | undefined;
  },
): Promise<UserReport | undefined> {
  if (input.reporterId === input.reportedUserId) {
    return undefined;
  }

  const row = await queryOne<UserReportRow>(
    db,
    `
      insert into user_reports (reporter_id, reported_user_id, reason, note)
      values ($1, $2, $3, $4)
      returning *
    `,
    [input.reporterId, input.reportedUserId, input.reason, input.note ?? null],
  );

  return row ? mapUserReport(row) : undefined;
}

export async function blockUser(
  db: Queryable,
  blockerId: string,
  blockedUserId: string,
): Promise<BlockedUser | undefined> {
  if (blockerId === blockedUserId) {
    return undefined;
  }

  await db.query(
    `
      insert into user_blocks (blocker_id, blocked_user_id)
      values ($1, $2)
      on conflict (blocker_id, blocked_user_id) do nothing
    `,
    [blockerId, blockedUserId],
  );

  return findBlockedUser(db, blockerId, blockedUserId);
}

export async function unblockUser(
  db: Queryable,
  blockerId: string,
  blockedUserId: string,
): Promise<boolean> {
  const result = await db.query(
    "delete from user_blocks where blocker_id = $1 and blocked_user_id = $2",
    [blockerId, blockedUserId],
  );

  return result.rowCount === 1;
}

export async function listBlockedUsers(db: Queryable, blockerId: string): Promise<BlockedUser[]> {
  const rows = await queryMany<BlockedUserRow>(
    db,
    `
      select
        users.id as user_id,
        users.display_name,
        user_blocks.created_at as blocked_at
      from user_blocks
      join users on users.id = user_blocks.blocked_user_id
      where user_blocks.blocker_id = $1
      order by user_blocks.created_at desc
    `,
    [blockerId],
  );

  return rows.map(mapBlockedUser);
}

export async function hasUserBlocked(
  db: Queryable,
  blockerId: string,
  blockedUserId: string,
): Promise<boolean> {
  const row = await queryOne<{ blocker_id: string }>(
    db,
    "select blocker_id from user_blocks where blocker_id = $1 and blocked_user_id = $2",
    [blockerId, blockedUserId],
  );

  return Boolean(row);
}

async function findBlockedUser(
  db: Queryable,
  blockerId: string,
  blockedUserId: string,
): Promise<BlockedUser | undefined> {
  const row = await queryOne<BlockedUserRow>(
    db,
    `
      select
        users.id as user_id,
        users.display_name,
        user_blocks.created_at as blocked_at
      from user_blocks
      join users on users.id = user_blocks.blocked_user_id
      where user_blocks.blocker_id = $1
        and user_blocks.blocked_user_id = $2
    `,
    [blockerId, blockedUserId],
  );

  return row ? mapBlockedUser(row) : undefined;
}

function mapUserReport(row: UserReportRow): UserReport {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    reason: row.reason,
    note: row.note ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

function mapBlockedUser(row: BlockedUserRow): BlockedUser {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    blockedAt: row.blocked_at.toISOString(),
  };
}
