import type {
  Conversation,
  ConversationContextSummary,
  ConversationContextType,
  ConversationMessage,
  ConversationMessageType,
  ConversationParticipant,
  UserRole,
} from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type ConversationRow = {
  id: string;
  type: ConversationContextType;
  context_id: string;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_display_name: string;
  content: string;
  type: ConversationMessageType;
  read_at: Date | null;
  created_at: Date;
};

type ParticipantRow = {
  user_id: string;
  display_name: string;
  last_read_message_id: string | null;
  last_read_at: Date | null;
  last_typing_at: Date | null;
};

type ItemContextRow = {
  id: string;
  owner_id: string;
  title: string;
  category: string | null;
  size: string | null;
  visibility: string;
  photo_uri: string | null;
};

type TradeContextRow = {
  id: string;
  proposer_id: string;
  counterparty_id: string;
  proposer_display_name: string;
  counterparty_display_name: string;
  proposer_item_title: string;
  counterparty_item_title: string;
  status: string;
};

export type ConversationContext = {
  contextType: Exclude<ConversationContextType, "system">;
  contextId: string;
  createdByUserId: string;
  participantIds: string[];
};

export async function createOrFindConversation(
  db: Queryable,
  context: ConversationContext,
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    db,
    `
      insert into conversations (type, context_id, created_by_user_id)
      values ($1, $2, $3)
      on conflict (type, context_id, created_by_user_id) do update
        set updated_at = conversations.updated_at
      returning id
    `,
    [context.contextType, context.contextId, context.createdByUserId],
  );

  if (!row) {
    throw new Error("Failed to create conversation.");
  }

  for (const participantId of context.participantIds) {
    await db.query(
      `
        insert into conversation_participants (conversation_id, user_id)
        values ($1, $2)
        on conflict (conversation_id, user_id) do nothing
      `,
      [row.id, participantId],
    );
  }

  return row.id;
}

export async function listConversationsForUser(
  db: Queryable,
  userId: string,
): Promise<Conversation[]> {
  const rows = await queryMany<ConversationRow>(
    db,
    `
      select conversations.*
      from conversations
      join conversation_participants on conversation_participants.conversation_id = conversations.id
      where conversation_participants.user_id = $1
        and conversations.archived_at is null
        and not exists (
          select 1
          from conversation_participants blocked_participant
          join user_blocks on user_blocks.blocked_user_id = blocked_participant.user_id
          where blocked_participant.conversation_id = conversations.id
            and blocked_participant.user_id <> $1
            and user_blocks.blocker_id = $1
        )
      order by conversations.updated_at desc
      limit 50
    `,
    [userId],
  );

  const hydrated = await Promise.all(rows.map((row) => hydrateConversation(db, row, userId)));
  return hydrated.filter((conversation): conversation is Conversation => Boolean(conversation));
}

export async function findConversationForUser(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<Conversation | undefined> {
  const row = await queryOne<ConversationRow>(
    db,
    `
      select conversations.*
      from conversations
      join conversation_participants on conversation_participants.conversation_id = conversations.id
      where conversations.id = $1
        and conversation_participants.user_id = $2
        and conversations.archived_at is null
        and not exists (
          select 1
          from conversation_participants blocked_participant
          join user_blocks on user_blocks.blocked_user_id = blocked_participant.user_id
          where blocked_participant.conversation_id = conversations.id
            and blocked_participant.user_id <> $2
            and user_blocks.blocker_id = $2
        )
    `,
    [conversationId, userId],
  );

  return row ? hydrateConversation(db, row, userId) : undefined;
}

export async function listMessagesForConversation(
  db: Queryable,
  conversationId: string,
  userId: string,
  before?: string,
  limit = 30,
): Promise<ConversationMessage[]> {
  const isParticipant = await isConversationParticipant(db, conversationId, userId);
  if (!isParticipant) {
    return [];
  }

  const rows = await queryMany<MessageRow>(
    db,
    `
      select
        messages.*,
        users.display_name as sender_display_name
      from messages
      join users on users.id = messages.sender_id
      where messages.conversation_id = $1
        and not exists (
          select 1
          from user_blocks
          where user_blocks.blocker_id = $2
            and user_blocks.blocked_user_id = messages.sender_id
        )
        and ($3::timestamptz is null or messages.created_at < $3::timestamptz)
      order by messages.created_at desc
      limit $4
    `,
    [conversationId, userId, before ?? null, limit],
  );

  return rows.reverse().map(mapMessage);
}

export async function createMessageForConversation(
  db: Queryable,
  conversationId: string,
  senderId: string,
  content: string,
  type: Extract<ConversationMessageType, "text" | "image">,
): Promise<ConversationMessage | undefined> {
  const isParticipant = await isConversationParticipant(db, conversationId, senderId);
  if (!isParticipant) {
    return undefined;
  }

  const blocked = await queryOne<{ blocked_user_id: string }>(
    db,
    `
      select user_blocks.blocked_user_id
      from conversation_participants
      join user_blocks on user_blocks.blocker_id = conversation_participants.user_id
      where conversation_participants.conversation_id = $1
        and conversation_participants.user_id <> $2
        and user_blocks.blocked_user_id = $2
      limit 1
    `,
    [conversationId, senderId],
  );

  if (blocked) {
    return undefined;
  }

  const row = await queryOne<MessageRow>(
    db,
    `
      insert into messages (conversation_id, sender_id, content, type)
      values ($1, $2, $3, $4)
      returning
        messages.*,
        (select display_name from users where users.id = messages.sender_id) as sender_display_name
    `,
    [conversationId, senderId, content, type],
  );

  await db.query("update conversations set updated_at = now() where id = $1", [conversationId]);

  return row ? mapMessage(row) : undefined;
}

export async function createTradeSystemMessage(
  db: Queryable,
  tradeId: string,
  actorUserId: string,
  content: string,
): Promise<ConversationMessage | undefined> {
  const context = await findTradeConversationContext(db, tradeId, actorUserId);
  if (!context) {
    return undefined;
  }

  const conversationId = await createOrFindConversation(db, context);
  const row = await queryOne<MessageRow>(
    db,
    `
      insert into messages (conversation_id, sender_id, content, type)
      values ($1, $2, $3, 'system_event')
      returning
        messages.*,
        (select display_name from users where users.id = messages.sender_id) as sender_display_name
    `,
    [conversationId, actorUserId, content],
  );

  await db.query("update conversations set updated_at = now() where id = $1", [conversationId]);

  return row ? mapMessage(row) : undefined;
}

export async function markMessageReadForUser(
  db: Queryable,
  messageId: string,
  userId: string,
  readAt = new Date(),
): Promise<boolean> {
  const row = await queryOne<{ conversation_id: string; sender_id: string }>(
    db,
    `
      select messages.conversation_id, messages.sender_id
      from messages
      join conversation_participants on conversation_participants.conversation_id = messages.conversation_id
      where messages.id = $1
        and conversation_participants.user_id = $2
    `,
    [messageId, userId],
  );

  if (!row) {
    return false;
  }

  if (row.sender_id !== userId) {
    await db.query("update messages set read_at = coalesce(read_at, $2) where id = $1", [
      messageId,
      readAt,
    ]);
  }

  await db.query(
    `
      update conversation_participants
      set last_read_message_id = $3,
          last_read_at = $4
      where conversation_id = $1
        and user_id = $2
    `,
    [row.conversation_id, userId, messageId, readAt],
  );

  return true;
}

export async function markTypingForUser(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const result = await db.query(
    `
      update conversation_participants
      set last_typing_at = now()
      where conversation_id = $1
        and user_id = $2
    `,
    [conversationId, userId],
  );

  return result.rowCount === 1;
}

export async function findItemConversationContext(
  db: Queryable,
  itemId: string,
  viewer: { id: string; roles: UserRole[] },
): Promise<ConversationContext | undefined> {
  const row = await queryOne<ItemContextRow>(
    db,
    `
      select
        items.id,
        items.owner_id,
        items.title,
        items.category,
        items.size,
        items.visibility,
        item_photos.public_url as photo_uri
      from items
      join users on users.id = items.owner_id
      left join lateral (
        select public_url
        from item_photos
        where item_photos.item_id = items.id
        order by sort_order asc
        limit 1
      ) item_photos on true
      where items.id = $1
        and items.status = 'tradeable'
        and items.verification_status = 'verified'
        and items.archived_at is null
        and users.access_status = 'active'
    `,
    [itemId],
  );

  if (!row || row.owner_id === viewer.id || !canViewItem(row, viewer)) {
    return undefined;
  }

  return {
    contextType: "item",
    contextId: row.id,
    createdByUserId: viewer.id,
    participantIds: [viewer.id, row.owner_id],
  };
}

export async function findTradeConversationContext(
  db: Queryable,
  tradeId: string,
  userId: string,
): Promise<ConversationContext | undefined> {
  const row = await queryOne<TradeContextRow>(
    db,
    `
      select
        trades.id,
        trades.proposer_id,
        trades.counterparty_id,
        proposer.display_name as proposer_display_name,
        counterparty.display_name as counterparty_display_name,
        proposer_item.title as proposer_item_title,
        counterparty_item.title as counterparty_item_title,
        trades.status
      from trades
      join users proposer on proposer.id = trades.proposer_id
      join users counterparty on counterparty.id = trades.counterparty_id
      join items proposer_item on proposer_item.id = trades.proposer_item_id
      join items counterparty_item on counterparty_item.id = trades.counterparty_item_id
      where trades.id = $1
        and (trades.proposer_id = $2 or trades.counterparty_id = $2)
    `,
    [tradeId, userId],
  );

  if (!row) {
    return undefined;
  }

  return {
    contextType: "trade",
    contextId: row.id,
    createdByUserId: row.proposer_id,
    participantIds: [row.proposer_id, row.counterparty_id],
  };
}

async function hydrateConversation(
  db: Queryable,
  row: ConversationRow,
  userId: string,
): Promise<Conversation | undefined> {
  const [participants, lastMessage, unreadCount, context] = await Promise.all([
    listParticipants(db, row.id),
    findLastMessage(db, row.id),
    countUnreadMessages(db, row.id, userId),
    getContextSummary(db, row),
  ]);

  if (!context) {
    return undefined;
  }

  return {
    id: row.id,
    contextType: row.type,
    contextId: row.context_id,
    context,
    participants,
    lastMessage,
    unreadCount,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    archivedAt: row.archived_at?.toISOString(),
  };
}

async function listParticipants(
  db: Queryable,
  conversationId: string,
): Promise<ConversationParticipant[]> {
  const rows = await queryMany<ParticipantRow>(
    db,
    `
      select
        conversation_participants.user_id,
        users.display_name,
        conversation_participants.last_read_message_id,
        conversation_participants.last_read_at,
        conversation_participants.last_typing_at
      from conversation_participants
      join users on users.id = conversation_participants.user_id
      where conversation_participants.conversation_id = $1
      order by users.display_name asc
    `,
    [conversationId],
  );

  const typingCutoff = Date.now() - 10_000;

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    lastReadMessageId: row.last_read_message_id ?? undefined,
    lastReadAt: row.last_read_at?.toISOString(),
    lastTypingAt: row.last_typing_at?.toISOString(),
    isTyping: Boolean(row.last_typing_at && row.last_typing_at.getTime() > typingCutoff),
  }));
}

async function findLastMessage(
  db: Queryable,
  conversationId: string,
): Promise<ConversationMessage | undefined> {
  const row = await queryOne<MessageRow>(
    db,
    `
      select messages.*, users.display_name as sender_display_name
      from messages
      join users on users.id = messages.sender_id
      where messages.conversation_id = $1
      order by messages.created_at desc
      limit 1
    `,
    [conversationId],
  );

  return row ? mapMessage(row) : undefined;
}

async function countUnreadMessages(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<number> {
  const row = await queryOne<{ count: string }>(
    db,
    `
      select count(*)::text as count
      from messages
      join conversation_participants on conversation_participants.conversation_id = messages.conversation_id
      where messages.conversation_id = $1
        and conversation_participants.user_id = $2
        and messages.sender_id <> $2
        and messages.created_at > coalesce(conversation_participants.last_read_at, 'epoch'::timestamptz)
    `,
    [conversationId, userId],
  );

  return Number(row?.count ?? 0);
}

async function getContextSummary(
  db: Queryable,
  row: ConversationRow,
): Promise<ConversationContextSummary | undefined> {
  if (row.type === "item") {
    const item = await queryOne<ItemContextRow>(
      db,
      `
        select
          items.id,
          items.owner_id,
          items.title,
          items.category,
          items.size,
          items.visibility,
          item_photos.public_url as photo_uri
        from items
        left join lateral (
          select public_url
          from item_photos
          where item_photos.item_id = items.id
          order by sort_order asc
          limit 1
        ) item_photos on true
        where items.id = $1
      `,
      [row.context_id],
    );

    return item
      ? {
          type: "item",
          id: item.id,
          title: item.title,
          subtitle: [item.category, item.size].filter(Boolean).join(" / ") || undefined,
          thumbnailUri: item.photo_uri ?? undefined,
        }
      : undefined;
  }

  if (row.type === "trade") {
    const trade = await queryOne<TradeContextRow>(
      db,
      `
        select
          trades.id,
          trades.proposer_id,
          trades.counterparty_id,
          proposer.display_name as proposer_display_name,
          counterparty.display_name as counterparty_display_name,
          proposer_item.title as proposer_item_title,
          counterparty_item.title as counterparty_item_title,
          trades.status
        from trades
        join users proposer on proposer.id = trades.proposer_id
        join users counterparty on counterparty.id = trades.counterparty_id
        join items proposer_item on proposer_item.id = trades.proposer_item_id
        join items counterparty_item on counterparty_item.id = trades.counterparty_item_id
        where trades.id = $1
      `,
      [row.context_id],
    );

    return trade
      ? {
          type: "trade",
          id: trade.id,
          title: `${trade.proposer_item_title} for ${trade.counterparty_item_title}`,
          subtitle: `${trade.proposer_display_name} and ${trade.counterparty_display_name}`,
          status: trade.status,
        }
      : undefined;
  }

  return {
    type: "system",
    id: row.context_id,
    title: "Collector Trade Network",
    subtitle: "Platform update",
  };
}

function mapMessage(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderDisplayName: row.sender_display_name,
    content: row.content,
    type: row.type,
    readAt: row.read_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

async function isConversationParticipant(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const row = await queryOne<{ conversation_id: string }>(
    db,
    `
      select conversation_id
      from conversation_participants
      where conversation_id = $1
        and user_id = $2
    `,
    [conversationId, userId],
  );

  return Boolean(row);
}

function canViewItem(
  item: Pick<ItemContextRow, "owner_id" | "visibility">,
  viewer: { id: string; roles: UserRole[] },
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
