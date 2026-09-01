import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  apiRoutes,
  conversationTypingContract,
  createConversationContract,
  markMessageReadContract,
  sendMessageContract,
} from "@ctn/api-contracts";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";
import {
  createContextualConversation,
  getContextualConversation,
  listContextualConversations,
  listContextualMessages,
  markContextualMessageRead,
  markContextualTyping,
  sendContextualMessage,
} from "./conversations.service";
import { notifyConversationMessage } from "./conversation-notifications";

export async function registerConversationRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.post(apiRoutes.conversations, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = createConversationContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_CONVERSATION_CONTEXT",
        message: "A conversation must be tied to a valid item or trade.",
      });
    }

    const conversation = await createContextualConversation(services.db, user, parsed.data);

    if (!conversation) {
      return reply.status(403).send({
        code: "CONVERSATION_NOT_ALLOWED",
        message: "You cannot start a conversation for that context.",
      });
    }

    return reply.status(201).send({ conversation });
  });

  app.get(apiRoutes.conversations, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const conversations = await listContextualConversations(services.db, user.id);

    return reply.status(200).send({ conversations });
  });

  app.get("/v1/conversations/:conversationId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const conversationId = (request.params as { conversationId: string }).conversationId;
    const conversation = await getContextualConversation(services.db, conversationId, user.id);

    if (!conversation) {
      return reply.status(404).send({
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found.",
      });
    }

    return reply.status(200).send({ conversation });
  });

  app.get("/v1/conversations/:conversationId/messages", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const conversationId = (request.params as { conversationId: string }).conversationId;
    const before = (request.query as { before?: string | undefined }).before;
    const conversation = await getContextualConversation(services.db, conversationId, user.id);

    if (!conversation) {
      return reply.status(404).send({
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found.",
      });
    }

    const messages = await listContextualMessages(services.db, conversationId, user.id, before);
    const nextBefore = messages.length > 0 ? messages[0]?.createdAt : undefined;

    return reply.status(200).send({ messages, nextBefore });
  });

  app.post("/v1/conversations/:conversationId/messages", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const conversationId = (request.params as { conversationId: string }).conversationId;
    const parsed = sendMessageContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_MESSAGE",
        message: "Message content is invalid.",
      });
    }

    const message = await sendContextualMessage(services.db, conversationId, user.id, parsed.data);

    if (!message) {
      return reply.status(403).send({
        code: "MESSAGE_NOT_ALLOWED",
        message: "You cannot send messages in that conversation.",
      });
    }

    const conversation = await getContextualConversation(services.db, conversationId, user.id);
    if (conversation) {
      await notifyConversationMessage({
        conversation,
        env: services.env,
        logger: request.log,
        message,
        senderUserId: user.id,
      });
    }

    return reply.status(201).send({ message });
  });

  app.patch("/v1/messages/:messageId/read", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const messageId = (request.params as { messageId: string }).messageId;
    const parsed = markMessageReadContract.body.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_READ_RECEIPT",
        message: "Read receipt is invalid.",
      });
    }

    const didMarkRead = await markContextualMessageRead(
      services.db,
      messageId,
      user.id,
      parsed.data.readAt,
    );

    if (!didMarkRead) {
      return reply.status(404).send({
        code: "MESSAGE_NOT_FOUND",
        message: "Message not found.",
      });
    }

    return reply.status(204).send();
  });

  app.post(apiRoutes.conversationTyping, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = conversationTypingContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_TYPING_CONTEXT",
        message: "Typing events must belong to a conversation.",
      });
    }

    const didMarkTyping = await markContextualTyping(
      services.db,
      parsed.data.conversationId,
      user.id,
    );

    if (!didMarkTyping) {
      return reply.status(404).send({
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found.",
      });
    }

    return reply.status(204).send();
  });
}

async function requireCurrentUser(request: FastifyRequest, services: AppServices) {
  const auth = await requireAuthContext(request, services.env);
  const user = await findUserByClerkId(services.db, auth.clerkUserId);

  if (!user || user.accessStatus !== "active") {
    throw new UserProfileRequiredError();
  }

  return user;
}
