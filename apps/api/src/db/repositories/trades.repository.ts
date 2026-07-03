import type { Trade, TradeCarrier, TradeShippingStatus, TradeStatus } from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type TradeRow = {
  id: string;
  proposer_id: string;
  proposer_display_name: string;
  counterparty_id: string;
  counterparty_display_name: string;
  proposer_item_id: string;
  proposer_item_title: string;
  proposer_item_category: Trade["proposerItem"]["category"] | null;
  proposer_item_size: Trade["proposerItem"]["size"] | null;
  proposer_item_status: Trade["proposerItem"]["status"];
  counterparty_item_id: string;
  counterparty_item_title: string;
  counterparty_item_category: Trade["counterpartyItem"]["category"] | null;
  counterparty_item_size: Trade["counterpartyItem"]["size"] | null;
  counterparty_item_status: Trade["counterpartyItem"]["status"];
  status: TradeStatus;
  shipping_status_proposer: TradeShippingStatus;
  shipping_status_counterparty: TradeShippingStatus;
  tracking_number_proposer: string | null;
  tracking_number_counterparty: string | null;
  carrier_proposer: TradeCarrier | null;
  carrier_counterparty: TradeCarrier | null;
  proposer_notes: string | null;
  counterparty_notes: string | null;
  completed_at: Date | null;
  disputed_at: Date | null;
  dispute_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

type TradeableItemOwnerRow = {
  id: string;
  owner_id: string;
  visibility: string;
};

export type CreateTradeRepositoryInput = {
  proposerId: string;
  proposerItemId: string;
  counterpartyItemId: string;
  proposerNotes?: string | undefined;
};

export type CounterTradeRepositoryInput = {
  tradeId: string;
  userId: string;
  proposerItemId: string;
  counterpartyItemId: string;
  counterpartyNotes?: string | undefined;
};

export type ShipTradeRepositoryInput = {
  tradeId: string;
  userId: string;
  trackingNumber: string;
  carrier: TradeCarrier;
};

export type DisputeTradeRepositoryInput = {
  tradeId: string;
  userId: string;
  reason: string;
};

export async function createTrade(
  db: Queryable,
  input: CreateTradeRepositoryInput,
): Promise<Trade | undefined> {
  const proposerItem = await findTradeableItem(db, input.proposerItemId);
  const counterpartyItem = await findTradeableItem(db, input.counterpartyItemId);

  if (
    !proposerItem ||
    !counterpartyItem ||
    proposerItem.owner_id !== input.proposerId ||
    counterpartyItem.owner_id === input.proposerId ||
    counterpartyItem.visibility === "private"
  ) {
    return undefined;
  }

  const row = await queryOne<{ id: string }>(
    db,
    `
      insert into trades (
        proposer_id,
        counterparty_id,
        proposer_item_id,
        counterparty_item_id,
        status,
        proposer_notes
      )
      values ($1, $2, $3, $4, 'pending', $5)
      returning id
    `,
    [
      input.proposerId,
      counterpartyItem.owner_id,
      input.proposerItemId,
      input.counterpartyItemId,
      input.proposerNotes ?? null,
    ],
  );

  return row ? findTradeByParticipant(db, row.id, input.proposerId) : undefined;
}

export async function listTradesForUser(db: Queryable, userId: string): Promise<Trade[]> {
  const rows = await queryMany<TradeRow>(
    db,
    `
      ${tradeSelectSql}
      where trades.proposer_id = $1 or trades.counterparty_id = $1
      order by trades.updated_at desc
    `,
    [userId],
  );

  return rows.map((row) => mapTrade(row, userId));
}

export async function findTradeByParticipant(
  db: Queryable,
  tradeId: string,
  userId: string,
): Promise<Trade | undefined> {
  const row = await queryOne<TradeRow>(
    db,
    `
      ${tradeSelectSql}
      where trades.id = $1
        and (trades.proposer_id = $2 or trades.counterparty_id = $2)
    `,
    [tradeId, userId],
  );

  return row ? mapTrade(row, userId) : undefined;
}

export async function updateTradeStatusForUser(
  db: Queryable,
  tradeId: string,
  userId: string,
  status: Extract<TradeStatus, "accepted" | "declined" | "cancelled">,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, tradeId, userId);

  if (!trade || !canUpdateTradeStatus(trade, userId, status)) {
    return undefined;
  }

  await db.query("update trades set status = $1, updated_at = now() where id = $2", [status, tradeId]);

  if (status === "accepted") {
    await db.query("update items set status = 'reserved', updated_at = now() where id = any($1::uuid[])", [
      [trade.proposerItemId, trade.counterpartyItemId],
    ]);
  }

  return findTradeByParticipant(db, tradeId, userId);
}

export async function shipTradeForUser(
  db: Queryable,
  input: ShipTradeRepositoryInput,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, input.tradeId, input.userId);

  if (!trade || !canShipTrade(trade, input.userId)) {
    return undefined;
  }

  const isProposer = trade.proposerId === input.userId;
  const shippingColumn = isProposer ? "shipping_status_proposer" : "shipping_status_counterparty";
  const trackingColumn = isProposer ? "tracking_number_proposer" : "tracking_number_counterparty";
  const carrierColumn = isProposer ? "carrier_proposer" : "carrier_counterparty";

  await db.query(
    `
      update trades set
        ${shippingColumn} = 'shipped',
        ${trackingColumn} = $2,
        ${carrierColumn} = $3,
        updated_at = now()
      where id = $1
    `,
    [input.tradeId, input.trackingNumber, input.carrier],
  );

  return findTradeByParticipant(db, input.tradeId, input.userId);
}

export async function receiveTradeForUser(
  db: Queryable,
  tradeId: string,
  userId: string,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, tradeId, userId);

  if (!trade || !canReceiveTrade(trade, userId)) {
    return undefined;
  }

  const shippingColumn =
    trade.proposerId === userId ? "shipping_status_counterparty" : "shipping_status_proposer";

  await db.query(
    `
      update trades set
        ${shippingColumn} = 'delivered',
        updated_at = now()
      where id = $1
    `,
    [tradeId],
  );

  return findTradeByParticipant(db, tradeId, userId);
}

export async function completeTradeForUser(
  db: Queryable,
  tradeId: string,
  userId: string,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, tradeId, userId);

  if (!trade || !canCompleteTrade(trade)) {
    return undefined;
  }

  await db.query(
    `
      update trades set
        status = 'completed',
        completed_at = now(),
        updated_at = now()
      where id = $1
    `,
    [tradeId],
  );
  await db.query("update items set status = 'traded', updated_at = now() where id = any($1::uuid[])", [
    [trade.proposerItemId, trade.counterpartyItemId],
  ]);

  return findTradeByParticipant(db, tradeId, userId);
}

export async function disputeTradeForUser(
  db: Queryable,
  input: DisputeTradeRepositoryInput,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, input.tradeId, input.userId);

  if (!trade || !canDisputeTrade(trade, input.userId)) {
    return undefined;
  }

  await db.query(
    `
      update trades set
        status = 'disputed',
        disputed_at = now(),
        dispute_reason = $2,
        updated_at = now()
      where id = $1
    `,
    [input.tradeId, input.reason],
  );

  return findTradeByParticipant(db, input.tradeId, input.userId);
}

export async function counterTradeForUser(
  db: Queryable,
  input: CounterTradeRepositoryInput,
): Promise<Trade | undefined> {
  const trade = await findTradeByParticipant(db, input.tradeId, input.userId);
  const proposerItem = await findTradeableItem(db, input.proposerItemId);
  const counterpartyItem = await findTradeableItem(db, input.counterpartyItemId);

  if (
    !trade ||
    trade.counterpartyId !== input.userId ||
    !["pending", "countered"].includes(trade.status) ||
    !proposerItem ||
    !counterpartyItem ||
    proposerItem.owner_id !== trade.proposerId ||
    counterpartyItem.owner_id !== trade.counterpartyId
  ) {
    return undefined;
  }

  await db.query(
    `
      update trades set
        proposer_item_id = $2,
        counterparty_item_id = $3,
        counterparty_notes = $4,
        status = 'countered',
        updated_at = now()
      where id = $1
    `,
    [input.tradeId, input.proposerItemId, input.counterpartyItemId, input.counterpartyNotes ?? null],
  );

  return findTradeByParticipant(db, input.tradeId, input.userId);
}

export function canUpdateTradeStatus(
  trade: Trade,
  userId: string,
  status: Extract<TradeStatus, "accepted" | "declined" | "cancelled">,
): boolean {
  if (status === "accepted" || status === "declined") {
    return trade.counterpartyId === userId && ["pending", "countered"].includes(trade.status);
  }

  if (status === "cancelled") {
    return trade.proposerId === userId && ["pending", "countered"].includes(trade.status);
  }

  return false;
}

export function canShipTrade(trade: Trade, userId: string): boolean {
  if (trade.status !== "accepted") {
    return false;
  }

  if (trade.proposerId === userId) {
    return trade.proposerShipping.status === "pending";
  }

  if (trade.counterpartyId === userId) {
    return trade.counterpartyShipping.status === "pending";
  }

  return false;
}

export function canReceiveTrade(trade: Trade, userId: string): boolean {
  if (trade.status !== "accepted") {
    return false;
  }

  if (trade.proposerId === userId) {
    return trade.counterpartyShipping.status === "shipped";
  }

  if (trade.counterpartyId === userId) {
    return trade.proposerShipping.status === "shipped";
  }

  return false;
}

export function canCompleteTrade(trade: Trade): boolean {
  return (
    trade.status === "accepted" &&
    trade.proposerShipping.status === "delivered" &&
    trade.counterpartyShipping.status === "delivered"
  );
}

export function canDisputeTrade(trade: Trade, userId: string): boolean {
  return (
    trade.status === "accepted" &&
    (trade.proposerId === userId || trade.counterpartyId === userId) &&
    (trade.proposerShipping.status === "delivered" ||
      trade.counterpartyShipping.status === "delivered" ||
      trade.proposerShipping.status === "shipped" ||
      trade.counterpartyShipping.status === "shipped")
  );
}

async function findTradeableItem(db: Queryable, itemId: string): Promise<TradeableItemOwnerRow | undefined> {
  return queryOne<TradeableItemOwnerRow>(
    db,
    `
      select items.id, items.owner_id, items.visibility
      from items
      join users on users.id = items.owner_id
      where items.id = $1
        and items.status = 'tradeable'
        and items.archived_at is null
        and users.access_status = 'active'
    `,
    [itemId],
  );
}

const tradeSelectSql = `
  select
    trades.id,
    trades.proposer_id,
    proposer.display_name as proposer_display_name,
    trades.counterparty_id,
    counterparty.display_name as counterparty_display_name,
    trades.proposer_item_id,
    proposer_item.title as proposer_item_title,
    proposer_item.category as proposer_item_category,
    proposer_item.size as proposer_item_size,
    proposer_item.status as proposer_item_status,
    trades.counterparty_item_id,
    counterparty_item.title as counterparty_item_title,
    counterparty_item.category as counterparty_item_category,
    counterparty_item.size as counterparty_item_size,
    counterparty_item.status as counterparty_item_status,
    trades.status,
    trades.shipping_status_proposer,
    trades.shipping_status_counterparty,
    trades.tracking_number_proposer,
    trades.tracking_number_counterparty,
    trades.carrier_proposer,
    trades.carrier_counterparty,
    trades.proposer_notes,
    trades.counterparty_notes,
    trades.completed_at,
    trades.disputed_at,
    trades.dispute_reason,
    trades.created_at,
    trades.updated_at
  from trades
  join users proposer on proposer.id = trades.proposer_id
  join users counterparty on counterparty.id = trades.counterparty_id
  join items proposer_item on proposer_item.id = trades.proposer_item_id
  join items counterparty_item on counterparty_item.id = trades.counterparty_item_id
`;

function mapTrade(row: TradeRow, viewerId: string): Trade {
  return {
    id: row.id,
    proposerId: row.proposer_id,
    proposerDisplayName: row.proposer_display_name,
    counterpartyId: row.counterparty_id,
    counterpartyDisplayName: row.counterparty_display_name,
    proposerItemId: row.proposer_item_id,
    counterpartyItemId: row.counterparty_item_id,
    proposerItem: {
      id: row.proposer_item_id,
      ownerId: row.proposer_id,
      ownerDisplayName: row.proposer_display_name,
      title: row.proposer_item_title,
      category: row.proposer_item_category ?? undefined,
      size: row.proposer_item_size ?? undefined,
      status: row.proposer_item_status,
    },
    counterpartyItem: {
      id: row.counterparty_item_id,
      ownerId: row.counterparty_id,
      ownerDisplayName: row.counterparty_display_name,
      title: row.counterparty_item_title,
      category: row.counterparty_item_category ?? undefined,
      size: row.counterparty_item_size ?? undefined,
      status: row.counterparty_item_status,
    },
    status: row.status,
    proposerShipping: {
      status: row.shipping_status_proposer,
      trackingNumber: row.tracking_number_proposer ?? undefined,
      carrier: row.carrier_proposer ?? undefined,
    },
    counterpartyShipping: {
      status: row.shipping_status_counterparty,
      trackingNumber: row.tracking_number_counterparty ?? undefined,
      carrier: row.carrier_counterparty ?? undefined,
    },
    proposerNotes: row.proposer_notes ?? undefined,
    counterpartyNotes: row.counterparty_notes ?? undefined,
    completedAt: row.completed_at?.toISOString(),
    disputedAt: row.disputed_at?.toISOString(),
    disputeReason: row.dispute_reason ?? undefined,
    viewerRole: row.proposer_id === viewerId ? "proposer" : "counterparty",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
