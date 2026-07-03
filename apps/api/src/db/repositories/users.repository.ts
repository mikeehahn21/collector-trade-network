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
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
