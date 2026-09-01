import type { UserAccessStatus, UserProfile, UserRole } from "@ctn/types";

import type { Queryable } from "../types";
import { queryOne } from "../types";

type UserRow = {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string;
  location_region: string | null;
  bio: string | null;
  social_handle: string | null;
  access_status: UserAccessStatus;
  roles: UserRole[];
  trust_score: number;
  is_elite: boolean;
  reputation_updated_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type UpsertUserInput = {
  clerkUserId: string;
  email: string;
  displayName: string;
  locationRegion?: string | undefined;
  bio?: string | undefined;
  socialHandle?: string | undefined;
};

export async function upsertUserProfile(
  db: Queryable,
  input: UpsertUserInput,
): Promise<UserProfile> {
  const row = await queryOne<UserRow>(
    db,
    `
      insert into users (
        clerk_user_id,
        email,
        display_name,
        location_region,
        bio,
        social_handle,
        access_status,
        roles
      )
      values ($1, $2, $3, $4, $5, $6, 'active', array['active_trader'])
      on conflict (clerk_user_id)
      do update set
        email = excluded.email,
        display_name = excluded.display_name,
        location_region = excluded.location_region,
        bio = excluded.bio,
        social_handle = excluded.social_handle,
        updated_at = now()
      returning *
    `,
    [
      input.clerkUserId,
      input.email,
      input.displayName,
      input.locationRegion ?? null,
      input.bio ?? null,
      input.socialHandle ?? null,
    ],
  );

  if (!row) {
    throw new Error("Failed to upsert user profile.");
  }

  return mapUser(row);
}

export async function findUserByClerkId(
  db: Queryable,
  clerkUserId: string,
): Promise<UserProfile | undefined> {
  const row = await queryOne<UserRow>(db, "select * from users where clerk_user_id = $1", [
    clerkUserId,
  ]);
  return row ? mapUser(row) : undefined;
}

export async function deleteUserAccountData(db: Queryable, userId: string): Promise<boolean> {
  const deletedDisplayName = "Deleted User";
  const deletedMarker = `deleted_${userId}`;

  await db.query("delete from user_blocks where blocker_id = $1 or blocked_user_id = $1", [userId]);
  await db.query("delete from wishlist_items where owner_id = $1", [userId]);
  await db.query(
    "delete from item_photos where item_id in (select id from items where owner_id = $1)",
    [userId],
  );
  await db.query(
    `
      update items
      set title = 'Deleted user item',
          category = null,
          size = null,
          measurements = '{}'::jsonb,
          era = null,
          tag = null,
          condition = null,
          flaws = '[]'::jsonb,
          estimated_value = '{"currency":"USD"}'::jsonb,
          status = 'archived',
          trade_preference = null,
          trade_notes = null,
          visibility = 'private',
          communication_preference = 'approved_traders',
          allows_photo_requests = false,
          allows_measurement_requests = false,
          verification_video_url = null,
          verification_status = 'pending',
          verification_failed_reason = null,
          verified_at = null,
          ai_metadata = null,
          ai_suggestions = null,
          archived_at = coalesce(archived_at, now()),
          updated_at = now()
      where owner_id = $1
    `,
    [userId],
  );
  await db.query(
    `
      update messages
      set content = '[message removed by deleted user]',
          type = 'system_event'
      where sender_id = $1
    `,
    [userId],
  );
  await db.query(
    `
      update trades
      set proposer_notes = case when proposer_id = $1 then null else proposer_notes end,
          counterparty_notes = case when counterparty_id = $1 then null else counterparty_notes end,
          updated_at = now()
      where proposer_id = $1 or counterparty_id = $1
    `,
    [userId],
  );

  const result = await db.query(
    `
      update users
      set clerk_user_id = $2,
          email = $3,
          display_name = $4,
          location_region = null,
          bio = null,
          social_handle = null,
          access_status = 'suspended',
          roles = array['guest'],
          trust_score = 0,
          is_elite = false,
          reputation_updated_at = now(),
          updated_at = now()
      where id = $1
    `,
    [userId, deletedMarker, `${deletedMarker}@konnesor.local`, deletedDisplayName],
  );

  return result.rowCount === 1;
}

export function mapUser(row: UserRow): UserProfile {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    displayName: row.display_name,
    locationRegion: row.location_region ?? undefined,
    bio: row.bio ?? undefined,
    socialHandle: row.social_handle ?? undefined,
    accessStatus: row.access_status,
    roles: row.roles,
    trustScore: row.trust_score ?? 50,
    isElite: row.is_elite ?? false,
    reputationUpdatedAt: (row.reputation_updated_at ?? new Date()).toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
