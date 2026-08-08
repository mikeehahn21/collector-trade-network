import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { Conversation, ConversationMessage, UserProfile } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { useTheme } from "@/theme/theme-provider";

export default function ConversationDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>();
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const lastTypingSentAtRef = useRef(0);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refresh = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setIsLoading(true);
      }
      setError(undefined);

      try {
        const [meResponse, conversationResponse, messagesResponse] = await Promise.all([
          apiRef.current.getMe(),
          apiRef.current.getConversation(conversationId),
          apiRef.current.listMessages(conversationId),
        ]);

        setCurrentUser(meResponse.user);
        setConversation(conversationResponse.conversation);
        setMessages(messagesResponse.messages);

        const latestIncoming = [...messagesResponse.messages]
          .reverse()
          .find((message) => message.senderId !== meResponse.user.id);

        if (latestIncoming) {
          void apiRef.current.markMessageRead(latestIncoming.id);
        }
      } catch {
        setError("This conversation could not be loaded.");
      } finally {
        if (initial) {
          setIsLoading(false);
        }
      }
    },
    [conversationId],
  );

  useEffect(() => {
    void refresh({ initial: true });
    const interval = setInterval(() => {
      void refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  async function sendMessage() {
    const content = draft.trim();

    if (!content) {
      setError("Write a message before sending.");
      return;
    }

    setIsSending(true);
    setError(undefined);

    try {
      const response = await apiRef.current.sendMessage(conversationId, { content, type: "text" });
      setMessages((existing) => [...existing, response.message]);
      setDraft("");
      void refresh();
    } catch {
      setError("Message could not be sent.");
    } finally {
      setIsSending(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);

    const now = Date.now();
    if (now - lastTypingSentAtRef.current > 4000) {
      lastTypingSentAtRef.current = now;
      void apiRef.current.markConversationTyping(conversationId);
    }
  }

  if (isLoading) {
    return (
      <Screen>
        <ScreenState message="Loading contextual messages." title="Loading conversation" />
      </Screen>
    );
  }

  if (!conversation || !currentUser) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <ScreenState message={error} title="Conversation unavailable" tone="warning" />
          <AppButton
            accessibilityLabel="Back to conversations"
            onPress={() => router.replace("/conversations")}
          >
            Back to Conversations
          </AppButton>
        </View>
      </Screen>
    );
  }

  const otherTypingNames = conversation.participants
    .filter((participant) => participant.userId !== currentUser.id && participant.isTyping)
    .map((participant) => participant.displayName);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {conversation.contextType.toUpperCase()} CONVERSATION
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: "900" }}>
            {conversation.context.title}
          </Text>
          {conversation.context.subtitle ? (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              {conversation.context.subtitle}
            </Text>
          ) : null}
        </View>

        {conversation.contextType === "trade" ? (
          <View
            style={{
              backgroundColor: theme.colors.accentMuted,
              borderColor: theme.colors.accent,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              gap: theme.spacing.xs,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 17, fontWeight: "900" }}>
              Current offer
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              Status: {conversation.context.status ?? "active"}
            </Text>
          </View>
        ) : null}

        <View style={{ gap: theme.spacing.md }}>
          {messages.length === 0 ? (
            <ScreenState
              message="Ask a focused question about condition, measurements, photos, or trade terms."
              title="Start the conversation"
            />
          ) : (
            messages.map((message) => (
              <MessageBubble
                isMine={message.senderId === currentUser.id}
                key={message.id}
                message={message}
              />
            ))
          )}
        </View>

        {otherTypingNames.length > 0 ? (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
            {otherTypingNames.join(", ")} typing...
          </Text>
        ) : null}

        {error ? <Text style={{ color: theme.colors.warning, fontSize: 14 }}>{error}</Text> : null}

        <View style={{ gap: theme.spacing.md }}>
          <AppTextField
            label="Message"
            multiline
            onChangeText={handleDraftChange}
            placeholder="Ask about condition, measurements, photos, or trade terms."
            style={{ minHeight: 96, textAlignVertical: "top" }}
            value={draft}
          />
          <AppButton
            accessibilityLabel="Send message"
            disabled={!draft.trim()}
            loading={isSending}
            onPress={() => void sendMessage()}
          >
            Send Message
          </AppButton>
          <AppButton
            accessibilityLabel="Back to conversations"
            onPress={() => router.replace("/conversations")}
            variant="ghost"
          >
            Back to Conversations
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function MessageBubble({ isMine, message }: { isMine: boolean; message: ConversationMessage }) {
  const theme = useTheme();
  const isSystemEvent = message.type === "system_event";

  return (
    <View
      style={{
        alignItems: isSystemEvent ? "center" : isMine ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          backgroundColor: isSystemEvent
            ? theme.colors.surfaceElevated
            : isMine
              ? theme.colors.accent
              : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: isMine && !isSystemEvent ? 0 : 1,
          maxWidth: "86%",
          padding: theme.spacing.md,
          gap: theme.spacing.xs,
        }}
      >
        {!isMine || isSystemEvent ? (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: "800" }}>
            {message.senderDisplayName}
          </Text>
        ) : null}
        <Text
          style={{
            color: isMine && !isSystemEvent ? theme.colors.background : theme.colors.textPrimary,
            fontSize: 15,
            lineHeight: 21,
          }}
        >
          {message.content}
        </Text>
        <Text
          style={{
            color: isMine && !isSystemEvent ? theme.colors.background : theme.colors.textSecondary,
            fontSize: 11,
            opacity: 0.78,
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
          {isMine && message.readAt ? " / Read" : ""}
        </Text>
      </View>
    </View>
  );
}
