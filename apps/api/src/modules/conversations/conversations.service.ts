import type {
  Conversation,
  ConversationMessage,
  CreateConversationInput,
  SendMessageInput,
  UserProfile,
} from "@ctn/types";

import type { Queryable } from "../../db/types";
import {
  createMessageForConversation,
  createOrFindConversation,
  findConversationForUser,
  findItemConversationContext,
  findTradeConversationContext,
  listConversationsForUser,
  listMessagesForConversation,
  markMessageReadForUser,
  markTypingForUser,
} from "../../db/repositories/conversations.repository";

export async function createContextualConversation(
  db: Queryable,
  user: UserProfile,
  input: CreateConversationInput,
): Promise<Conversation | undefined> {
  const context =
    input.contextType === "item"
      ? await findItemConversationContext(db, input.contextId, { id: user.id, roles: user.roles })
      : await findTradeConversationContext(db, input.contextId, user.id);

  if (!context) {
    return undefined;
  }

  const conversationId = await createOrFindConversation(db, context);
  return findConversationForUser(db, conversationId, user.id);
}

export function listContextualConversations(
  db: Queryable,
  userId: string,
): Promise<Conversation[]> {
  return listConversationsForUser(db, userId);
}

export function getContextualConversation(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<Conversation | undefined> {
  return findConversationForUser(db, conversationId, userId);
}

export function listContextualMessages(
  db: Queryable,
  conversationId: string,
  userId: string,
  before?: string | undefined,
): Promise<ConversationMessage[]> {
  return listMessagesForConversation(db, conversationId, userId, before);
}

export function sendContextualMessage(
  db: Queryable,
  conversationId: string,
  userId: string,
  input: SendMessageInput,
): Promise<ConversationMessage | undefined> {
  return createMessageForConversation(db, conversationId, userId, input.content, input.type);
}

export function markContextualMessageRead(
  db: Queryable,
  messageId: string,
  userId: string,
  readAt?: string | undefined,
): Promise<boolean> {
  return markMessageReadForUser(db, messageId, userId, readAt ? new Date(readAt) : undefined);
}

export function markContextualTyping(
  db: Queryable,
  conversationId: string,
  userId: string,
): Promise<boolean> {
  return markTypingForUser(db, conversationId, userId);
}
