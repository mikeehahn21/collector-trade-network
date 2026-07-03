import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Conversation } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { useTheme } from "@/theme/theme-provider";

export default function ConversationListScreen() {
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiRef.current.listConversations();
      setConversations(response.conversations);
    } catch {
      setError("Conversations could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (isLoading) {
    return (
      <Screen>
        <ScreenState
          message="Loading your item and trade conversations."
          title="Loading conversations"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            CONTEXTUAL MESSAGES
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            Conversations
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Every thread belongs to an item or trade, so collector questions stay focused.
          </Text>
        </View>

        {error ? <ScreenState message={error} title="Unable to load" tone="warning" /> : null}

        {conversations.length === 0 ? (
          <ScreenState
            message="Contact an owner from an item detail or open a trade conversation to start."
            title="No conversations yet"
          />
        ) : (
          conversations.map((conversation) => (
            <ConversationRow
              conversation={conversation}
              key={conversation.id}
              onPress={() => router.push(`/conversations/${conversation.id}`)}
            />
          ))
        )}

        <AppButton
          accessibilityLabel="Refresh conversations"
          onPress={() => void refresh()}
          variant="secondary"
        >
          Refresh
        </AppButton>
      </ScrollView>
    </Screen>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const theme = useTheme();
  const lastMessage = conversation.lastMessage;

  return (
    <Pressable
      accessibilityLabel={`Open ${conversation.context.title} conversation`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderColor: conversation.unreadCount > 0 ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.sm,
        opacity: pressed ? 0.82 : 1,
        padding: theme.spacing.lg,
      })}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
      >
        <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: "900" }}>
          {conversation.contextType.toUpperCase()}
        </Text>
        {conversation.unreadCount > 0 ? (
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {conversation.unreadCount} unread
          </Text>
        ) : null}
      </View>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
        {conversation.context.title}
      </Text>
      <Text
        numberOfLines={2}
        style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}
      >
        {lastMessage
          ? `${lastMessage.senderDisplayName}: ${lastMessage.content}`
          : "No messages yet"}
      </Text>
    </Pressable>
  );
}
