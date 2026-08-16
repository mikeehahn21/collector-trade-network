import type {
  CommunicationPreference,
  ItemCondition,
  ItemAiMetadata,
  ItemPhoto,
  ItemStatus,
  ItemVerificationStatus,
  ItemVisibility,
  PublicTradeableItem,
  ShirtSize,
  TradeOfferPreference,
  TradeableItem,
  VintageCategory,
} from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type ItemRow = {
  id: string;
  owner_id: string;
  title: string;
  category: VintageCategory | null;
  size: ShirtSize | null;
  measurements: TradeableItem["measurements"];
  era: string | null;
  tag: string | null;
  condition: ItemCondition | null;
  flaws: string[];
  estimated_value: TradeableItem["estimatedValue"];
  status: ItemStatus;
  trade_preference: TradeOfferPreference | null;
  trade_notes: string | null;
  visibility: ItemVisibility;
  communication_preference: CommunicationPreference;
  allows_photo_requests: boolean;
  allows_measurement_requests: boolean;
  verification_video_url: string | null;
  verification_status: ItemVerificationStatus;
  verification_failed_reason: string | null;
  verified_at: Date | null;
  ai_metadata: ItemAiMetadata | null;
  ai_suggestions: TradeableItem["aiSuggestions"] | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
};

type ItemPhotoRow = {
  id: string;
  item_id: string;
  storage_key: string;
  public_url: string | null;
  kind: ItemPhoto["kind"];
  sort_order: number;
  created_at: Date;
};

type PublicItemRow = ItemRow & {
  owner_display_name: string;
  owner_location_region: string | null;
  owner_roles: PublicTradeableItem["owner"]["roles"];
  owner_trust_score: number;
  owner_is_elite: boolean;
};

export type PersistItemInput = Omit<
  Partial<TradeableItem>,
  "id" | "ownerId" | "createdAt" | "updatedAt" | "publishedAt" | "archivedAt"
>;

export type VerificationStatusSummary = Pick<
  TradeableItem,
  | "aiMetadata"
  | "id"
  | "verificationFailedReason"
  | "verificationStatus"
  | "verificationVideoUrl"
  | "verifiedAt"
>;

export async function listItemsByOwner(db: Queryable, ownerId: string): Promise<TradeableItem[]> {
  const rows = await queryMany<ItemRow>(
    db,
    "select * from items where owner_id = $1 order by updated_at desc",
    [ownerId],
  );

  if (rows.length === 0) {
    return [];
  }

  const photos = await queryMany<ItemPhotoRow>(
    db,
    "select * from item_photos where item_id = any($1::uuid[]) order by sort_order asc",
    [rows.map((row) => row.id)],
  );

  return rows.map((row) =>
    mapItem(
      row,
      photos.filter((photo) => photo.item_id === row.id),
    ),
  );
}

export async function findItemByOwner(
  db: Queryable,
  ownerId: string,
  itemId: string,
): Promise<TradeableItem | undefined> {
  const row = await queryOne<ItemRow>(db, "select * from items where id = $1 and owner_id = $2", [
    itemId,
    ownerId,
  ]);

  if (!row) {
    return undefined;
  }

  const photos = await queryMany<ItemPhotoRow>(
    db,
    "select * from item_photos where item_id = $1 order by sort_order asc",
    [itemId],
  );

  return mapItem(row, photos);
}

export async function findVisiblePublicItem(
  db: Queryable,
  itemId: string,
  viewer: { id: string; roles: PublicTradeableItem["owner"]["roles"] },
): Promise<PublicTradeableItem | undefined> {
  const row = await queryOne<PublicItemRow>(
    db,
    `
      select
        items.*,
        users.display_name as owner_display_name,
        users.location_region as owner_location_region,
        users.roles as owner_roles,
        users.trust_score as owner_trust_score,
        users.is_elite as owner_is_elite
      from items
      join users on users.id = items.owner_id
      where items.id = $1
        and items.status = 'tradeable'
        and items.verification_status = 'verified'
        and items.archived_at is null
        and users.access_status = 'active'
    `,
    [itemId],
  );

  if (!row || !canViewItem(row, viewer)) {
    return undefined;
  }

  const photos = await queryMany<ItemPhotoRow>(
    db,
    "select * from item_photos where item_id = $1 order by sort_order asc",
    [itemId],
  );
  const item = mapItem(row, photos);

  return {
    ...item,
    owner: {
      id: row.owner_id,
      displayName: row.owner_display_name,
      locationRegion: row.owner_location_region ?? undefined,
      roles: row.owner_roles,
      trustScore: row.owner_trust_score ?? 50,
      isElite: row.owner_is_elite ?? false,
    },
  };
}

export async function createItemForOwner(
  db: Queryable,
  ownerId: string,
  input: PersistItemInput,
): Promise<TradeableItem> {
  const row = await queryOne<ItemRow>(
    db,
    `
      insert into items (
        owner_id, title, category, size, measurements, era, tag, condition, flaws,
        estimated_value, status, trade_preference, trade_notes, visibility,
        communication_preference, allows_photo_requests, allows_measurement_requests,
        ai_suggestions, published_at, archived_at
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      returning *
    `,
    [
      ownerId,
      input.title ?? "",
      input.category ?? null,
      input.size ?? null,
      input.measurements ?? { unit: "in" },
      input.era ?? null,
      input.tag ?? null,
      input.condition ?? null,
      input.flaws ?? [],
      input.estimatedValue ?? { currency: "USD" },
      input.status ?? "draft",
      input.tradePreference ?? null,
      input.tradeNotes ?? null,
      input.visibility ?? "private",
      input.communicationPreference ?? "approved_traders",
      input.allowsPhotoRequests ?? true,
      input.allowsMeasurementRequests ?? true,
      input.aiSuggestions ?? null,
      input.status === "tradeable" ? new Date() : null,
      input.status === "archived" ? new Date() : null,
    ],
  );

  if (!row) {
    throw new Error("Failed to create item.");
  }

  await replaceItemPhotos(db, row.id, input.photos);

  return (await findItemByOwner(db, ownerId, row.id)) ?? mapItem(row, []);
}

export async function updateItemForOwner(
  db: Queryable,
  ownerId: string,
  itemId: string,
  input: PersistItemInput,
): Promise<TradeableItem | undefined> {
  const existing = await findItemByOwner(db, ownerId, itemId);
  if (!existing) {
    return undefined;
  }

  const row = await queryOne<ItemRow>(
    db,
    `
      update items set
        title = $3,
        category = $4,
        size = $5,
        measurements = $6,
        era = $7,
        tag = $8,
        condition = $9,
        flaws = $10,
        estimated_value = $11,
        status = $12,
        trade_preference = $13,
        trade_notes = $14,
        visibility = $15,
        communication_preference = $16,
        allows_photo_requests = $17,
        allows_measurement_requests = $18,
        ai_suggestions = $19,
        published_at = case when $12 = 'tradeable' and published_at is null then now() else published_at end,
        archived_at = case when $12 = 'archived' then now() else archived_at end,
        updated_at = now()
      where id = $1 and owner_id = $2
      returning *
    `,
    [
      itemId,
      ownerId,
      input.title ?? existing.title,
      input.category ?? existing.category ?? null,
      input.size ?? existing.size ?? null,
      input.measurements ?? existing.measurements,
      input.era ?? existing.era ?? null,
      input.tag ?? existing.tag ?? null,
      input.condition ?? existing.condition ?? null,
      input.flaws ?? existing.flaws,
      input.estimatedValue ?? existing.estimatedValue,
      input.status ?? existing.status,
      input.tradePreference ?? existing.tradePreference ?? null,
      input.tradeNotes ?? existing.tradeNotes ?? null,
      input.visibility ?? existing.visibility,
      input.communicationPreference ?? existing.communicationPreference,
      input.allowsPhotoRequests ?? existing.allowsPhotoRequests,
      input.allowsMeasurementRequests ?? existing.allowsMeasurementRequests,
      input.aiSuggestions ?? existing.aiSuggestions ?? null,
    ],
  );

  if (!row) {
    return undefined;
  }

  if (input.photos) {
    await replaceItemPhotos(db, row.id, input.photos);
  }

  return findItemByOwner(db, ownerId, row.id);
}

export async function deleteItemForOwner(
  db: Queryable,
  ownerId: string,
  itemId: string,
): Promise<boolean> {
  const result = await db.query("delete from items where id = $1 and owner_id = $2", [
    itemId,
    ownerId,
  ]);
  return result.rowCount === 1;
}

export async function updateVerificationVideoForOwner(
  db: Queryable,
  ownerId: string,
  itemId: string,
  input: {
    videoUrl: string;
    verificationCode: string;
  },
): Promise<VerificationStatusSummary | undefined> {
  const row = await queryOne<ItemRow>(
    db,
    `
      update items set
        verification_video_url = $3,
        verification_status = 'pending',
        verification_failed_reason = null,
        verified_at = null,
        ai_metadata = jsonb_build_object('codeExpected', $4),
        updated_at = now()
      where id = $1 and owner_id = $2
      returning *
    `,
    [itemId, ownerId, input.videoUrl, input.verificationCode],
  );

  return row ? mapVerificationSummary(row) : undefined;
}

export async function findVerificationStatusByOwner(
  db: Queryable,
  ownerId: string,
  itemId: string,
): Promise<VerificationStatusSummary | undefined> {
  const row = await queryOne<ItemRow>(db, "select * from items where id = $1 and owner_id = $2", [
    itemId,
    ownerId,
  ]);

  return row ? mapVerificationSummary(row) : undefined;
}

export async function applyAiReviewResult(
  db: Queryable,
  input: {
    itemId: string;
    status: Extract<ItemVerificationStatus, "verified" | "failed">;
    verificationFailedReason?: string | undefined;
    aiMetadata?: ItemAiMetadata | undefined;
  },
): Promise<VerificationStatusSummary | undefined> {
  const row = await queryOne<ItemRow>(
    db,
    `
      update items set
        verification_status = $2,
        verification_failed_reason = case when $2 = 'failed' then $3 else null end,
        verified_at = case when $2 = 'verified' then now() else null end,
        ai_metadata = coalesce($4::jsonb, ai_metadata),
        updated_at = now()
      where id = $1
      returning *
    `,
    [input.itemId, input.status, input.verificationFailedReason ?? null, input.aiMetadata ?? null],
  );

  return row ? mapVerificationSummary(row) : undefined;
}

function mapItem(row: ItemRow, photos: ItemPhotoRow[]): TradeableItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    photos: photos.map((photo) => ({
      id: photo.id,
      uri: photo.public_url ?? photo.storage_key,
      kind: photo.kind,
      sortOrder: photo.sort_order,
      createdAt: photo.created_at.toISOString(),
    })),
    title: row.title,
    category: row.category ?? undefined,
    size: row.size ?? undefined,
    measurements: row.measurements,
    era: row.era ?? undefined,
    tag: row.tag ?? undefined,
    condition: row.condition ?? undefined,
    flaws: row.flaws,
    estimatedValue: row.estimated_value,
    status: row.status,
    tradePreference: row.trade_preference ?? undefined,
    tradeNotes: row.trade_notes ?? undefined,
    visibility: row.visibility,
    communicationPreference: row.communication_preference,
    allowsPhotoRequests: row.allows_photo_requests,
    allowsMeasurementRequests: row.allows_measurement_requests,
    verificationVideoUrl: row.verification_video_url ?? undefined,
    verificationStatus: row.verification_status,
    verificationFailedReason: row.verification_failed_reason ?? undefined,
    verifiedAt: row.verified_at?.toISOString(),
    aiMetadata: row.ai_metadata ?? undefined,
    aiSuggestions: row.ai_suggestions ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    publishedAt: row.published_at?.toISOString(),
    archivedAt: row.archived_at?.toISOString(),
  };
}

function mapVerificationSummary(row: ItemRow): VerificationStatusSummary {
  return {
    id: row.id,
    verificationVideoUrl: row.verification_video_url ?? undefined,
    verificationStatus: row.verification_status,
    verificationFailedReason: row.verification_failed_reason ?? undefined,
    verifiedAt: row.verified_at?.toISOString(),
    aiMetadata: row.ai_metadata ?? undefined,
  };
}

async function replaceItemPhotos(
  db: Queryable,
  itemId: string,
  photos: ItemPhoto[] | undefined,
): Promise<void> {
  if (!photos) {
    return;
  }

  await db.query("delete from item_photos where item_id = $1", [itemId]);

  for (const photo of photos) {
    await db.query(
      `
        insert into item_photos (item_id, storage_key, public_url, kind, sort_order, created_at)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [itemId, photo.uri, photo.uri, photo.kind, photo.sortOrder, new Date(photo.createdAt)],
    );
  }
}

function canViewItem(
  item: Pick<ItemRow, "owner_id" | "visibility">,
  viewer: { id: string; roles: PublicTradeableItem["owner"]["roles"] },
): boolean {
  if (item.owner_id === viewer.id) {
    return true;
  }

  if (item.visibility === "approved_members") {
    return true;
  }

  if (item.visibility === "verified_members") {
    return viewer.roles.some((role) =>
      ["admin", "verified_collector", "verified_seller"].includes(role),
    );
  }

  return false;
}
