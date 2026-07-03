import type {
  ItemCondition,
  ShirtSize,
  VintageCategory,
  WishlistItem,
  WishlistMatchPreference,
  WishlistPriority,
  WishlistVisibility,
} from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type WishlistRow = {
  id: string;
  owner_id: string;
  title: string;
  category: VintageCategory | null;
  size: ShirtSize | null;
  preferred_era: string | null;
  preferred_tag: string | null;
  preferred_condition: ItemCondition | null;
  notes: string | null;
  priority: WishlistPriority;
  is_grail: boolean;
  match_preference: WishlistMatchPreference;
  visibility: WishlistVisibility;
  is_archived: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

export type PersistWishlistInput = Omit<
  Partial<WishlistItem>,
  "id" | "ownerId" | "createdAt" | "updatedAt" | "archivedAt"
>;

export async function listWishlistByOwner(db: Queryable, ownerId: string): Promise<WishlistItem[]> {
  const rows = await queryMany<WishlistRow>(
    db,
    "select * from wishlist_items where owner_id = $1 order by is_archived asc, sort_order asc",
    [ownerId],
  );
  return rows.map(mapWishlistItem);
}

export async function findWishlistItemByOwner(
  db: Queryable,
  ownerId: string,
  wishlistItemId: string,
): Promise<WishlistItem | undefined> {
  const row = await queryOne<WishlistRow>(
    db,
    "select * from wishlist_items where id = $1 and owner_id = $2",
    [wishlistItemId, ownerId],
  );
  return row ? mapWishlistItem(row) : undefined;
}

export async function createWishlistItemForOwner(
  db: Queryable,
  ownerId: string,
  input: PersistWishlistInput,
): Promise<WishlistItem> {
  const row = await queryOne<WishlistRow>(
    db,
    `
      insert into wishlist_items (
        owner_id, title, category, size, preferred_era, preferred_tag,
        preferred_condition, notes, priority, is_grail, match_preference,
        visibility, is_archived, sort_order, archived_at
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      returning *
    `,
    [
      ownerId,
      input.title ?? "",
      input.category ?? null,
      input.size ?? null,
      input.preferredEra ?? null,
      input.preferredTag ?? null,
      input.preferredCondition ?? null,
      input.notes ?? null,
      input.priority ?? "medium",
      input.isGrail ?? false,
      input.matchPreference ?? "similar",
      input.visibility ?? "approved_members",
      input.isArchived ?? false,
      input.sortOrder ?? Date.now(),
      input.isArchived ? new Date() : null,
    ],
  );

  if (!row) {
    throw new Error("Failed to create wishlist item.");
  }

  return mapWishlistItem(row);
}

export async function updateWishlistItemForOwner(
  db: Queryable,
  ownerId: string,
  wishlistItemId: string,
  input: PersistWishlistInput,
): Promise<WishlistItem | undefined> {
  const existing = await findWishlistItemByOwner(db, ownerId, wishlistItemId);
  if (!existing) {
    return undefined;
  }

  const row = await queryOne<WishlistRow>(
    db,
    `
      update wishlist_items set
        title = $3,
        category = $4,
        size = $5,
        preferred_era = $6,
        preferred_tag = $7,
        preferred_condition = $8,
        notes = $9,
        priority = $10,
        is_grail = $11,
        match_preference = $12,
        visibility = $13,
        is_archived = $14,
        sort_order = $15,
        archived_at = case when $14 = true and archived_at is null then now() else archived_at end,
        updated_at = now()
      where id = $1 and owner_id = $2
      returning *
    `,
    [
      wishlistItemId,
      ownerId,
      input.title ?? existing.title,
      input.category ?? existing.category ?? null,
      input.size ?? existing.size ?? null,
      input.preferredEra ?? existing.preferredEra ?? null,
      input.preferredTag ?? existing.preferredTag ?? null,
      input.preferredCondition ?? existing.preferredCondition ?? null,
      input.notes ?? existing.notes ?? null,
      input.priority ?? existing.priority,
      input.isGrail ?? existing.isGrail,
      input.matchPreference ?? existing.matchPreference,
      input.visibility ?? existing.visibility,
      input.isArchived ?? existing.isArchived,
      input.sortOrder ?? existing.sortOrder,
    ],
  );

  return row ? mapWishlistItem(row) : undefined;
}

export async function deleteWishlistItemForOwner(
  db: Queryable,
  ownerId: string,
  wishlistItemId: string,
): Promise<boolean> {
  const result = await db.query("delete from wishlist_items where id = $1 and owner_id = $2", [
    wishlistItemId,
    ownerId,
  ]);
  return result.rowCount === 1;
}

export async function countActiveGrails(db: Queryable, ownerId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    db,
    "select count(*)::text from wishlist_items where owner_id = $1 and is_grail = true and is_archived = false",
    [ownerId],
  );
  return Number(row?.count ?? 0);
}

function mapWishlistItem(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category ?? undefined,
    size: row.size ?? undefined,
    preferredEra: row.preferred_era ?? undefined,
    preferredTag: row.preferred_tag ?? undefined,
    preferredCondition: row.preferred_condition ?? undefined,
    notes: row.notes ?? undefined,
    priority: row.priority,
    isGrail: row.is_grail,
    matchPreference: row.match_preference,
    visibility: row.visibility,
    isArchived: row.is_archived,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    archivedAt: row.archived_at?.toISOString(),
  };
}
