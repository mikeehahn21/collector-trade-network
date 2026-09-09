import type { FastifyBaseLogger } from "fastify";
import type { Conversation, ConversationMessage } from "@ctn/types";

import type { Env } from "../../config/env";
import { sendPushNotification } from "../notifications/one-signal";

export function buildMessagePushData(
  conversation: Pick<Conversation, "id">,
  message: Pick<ConversationMessage, "id">,
): Record<string, string> {
  return {
    conversationId: conversation.id,
    id: conversation.id,
    messageId: message.id,
    type: "message",
  };
}

export async function notifyConversationMessage(input: {
  conversation: Conversation;
  env: Env;
  logger: FastifyBaseLogger;
  message: ConversationMessage;
  senderUserId: string;
}): Promise<void> {
  const recipients = input.conversation.participants
    .map((participant) => participant.userId)
    .filter((userId) => userId !== input.senderUserId);

  await Promise.all(
    recipients.map((recipientUserId) =>
      sendPushNotification({
        contents: input.message.content,
        data: buildMessagePushData(input.conversation, input.message),
        env: input.env,
        headings: `New message from ${input.message.senderDisplayName}`,
        logger: input.logger,
        recipientUserId,
      }),
    ),
  );
}
