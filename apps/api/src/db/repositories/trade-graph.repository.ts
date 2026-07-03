import type { TradeableItem, UserProfile, WishlistItem } from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany } from "../types";

type TradeGraphItemRow = {
  id: string;
  owner_id: string;
  owner_display_name: string;
  title: string;
  category: TradeableItem["category"] | null;
  size: TradeableItem["size"] | null;
  status: TradeableItem["status"];
  visibility: TradeableItem["visibility"];
  created_at: Date;
  updated_at: Date;
};

type TradeGraphWishlistRow = {
  id: string;
  owner_id: string;
  owner_display_name: string;
  title: string;
  category: WishlistItem["category"] | null;
  size: WishlistItem["size"] | null;
  priority: WishlistItem["priority"];
  is_grail: boolean;
  match_preference: WishlistItem["matchPreference"];
  visibility: WishlistItem["visibility"];
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TradeGraphDataset = {
  currentUser: UserProfile;
  inventory: Array<TradeableItem & { ownerDisplayName: string }>;
  wishlist: Array<WishlistItem & { ownerDisplayName: string }>;
};

export async function loadTradeGraphDataset(
  db: Queryable,
  currentUser: UserProfile,
): Promise<TradeGraphDataset> {
  const inventoryRows = await queryMany<TradeGraphItemRow>(
    db,
    `
      select
        items.id,
        items.owner_id,
        users.display_name as owner_display_name,
        items.title,
        items.category,
        items.size,
        items.status,
        items.visibility,
        items.created_at,
        items.updated_at
      from items
      join users on users.id = items.owner_id
      where items.status = 'tradeable'
        and items.verification_status = 'verified'
        and items.archived_at is null
        and items.visibility in ('approved_members', 'verified_members')
        and users.access_status = 'active'
    `,
  );

  const wishlistRows = await queryMany<TradeGraphWishlistRow>(
    db,
    `
      select
        wishlist_items.id,
        wishlist_items.owner_id,
        users.display_name as owner_display_name,
        wishlist_items.title,
        wishlist_items.category,
        wishlist_items.size,
        wishlist_items.priority,
        wishlist_items.is_grail,
        wishlist_items.match_preference,
        wishlist_items.visibility,
        wishlist_items.is_archived,
        wishlist_items.created_at,
        wishlist_items.updated_at
      from wishlist_items
      join users on users.id = wishlist_items.owner_id
      where wishlist_items.is_archived = false
        and wishlist_items.visibility in ('approved_members', 'verified_members')
        and users.access_status = 'active'
    `,
  );

  return {
    currentUser,
    inventory: inventoryRows.map(mapGraphItem),
    wishlist: wishlistRows.map(mapGraphWishlist),
  };
}

function mapGraphItem(row: TradeGraphItemRow): TradeableItem & { ownerDisplayName: string } {
  return {
    id: row.id,
    ownerId: row.owner_id,
    photos: [],
    title: row.title,
    category: row.category ?? undefined,
    size: row.size ?? undefined,
    measurements: { unit: "in" },
    flaws: [],
    estimatedValue: { currency: "USD" },
    status: row.status,
    visibility: row.visibility,
    communicationPreference: "approved_traders",
    allowsPhotoRequests: true,
    allowsMeasurementRequests: true,
    verificationStatus: "verified",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ownerDisplayName: row.owner_display_name,
  };
}

function mapGraphWishlist(row: TradeGraphWishlistRow): WishlistItem & { ownerDisplayName: string } {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category ?? undefined,
    size: row.size ?? undefined,
    priority: row.priority,
    isGrail: row.is_grail,
    matchPreference: row.match_preference,
    visibility: row.visibility,
    isArchived: row.is_archived,
    sortOrder: 0,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ownerDisplayName: row.owner_display_name,
  };
}
