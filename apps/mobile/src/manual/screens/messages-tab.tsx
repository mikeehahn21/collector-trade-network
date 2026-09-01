/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Alert,
  Animated,
  BetaBody,
  BetaButton,
  BetaChip,
  BetaChoice,
  BetaEmptyState,
  BetaItemCard,
  BetaKicker,
  BetaLoopingVideo,
  BetaPanel,
  BetaScreen,
  BetaStatPanel,
  BetaTextField,
  BetaTitle,
  Easing,
  Image,
  ImagePicker,
  ITEM_CONDITIONS,
  ITEM_ERAS,
  Linking,
  Pressable,
  SHIRT_SIZES,
  ScrollView,
  Switch,
  Text,
  TextInput,
  VINTAGE_CATEGORIES,
  View,
  WISHLIST_MATCH_PREFERENCES,
  WISHLIST_PRIORITIES,
  WISHLIST_VISIBILITY_OPTIONS,
  WebBrowser,
  apiRoutes,
  beta,
  categoryLabels,
  categoryOptions,
  collectorTypeOptions,
  communicationPreferenceLabels,
  communicationPreferenceOptions,
  conditionLabels,
  getDiagnosticErrorDetail,
  getDiagnosticErrorMessage,
  getMobileEnv,
  getMockAiListingSuggestions,
  getPublishCheck,
  isUuid,
  itemPhotoKindLabels,
  konnesorSymbol,
  konnesorWordmark,
  reportBackendDiagnostic,
  reportReasonOptions,
  sizeLabels,
  sizeOptions,
  statusLabels,
  tabs,
  tradeComposeSteps,
  tradePreferenceLabels,
  tradeOfferPreferenceOptions,
  tradeProgressSteps,
  tradeStatusLabels,
  useApiClient,
  useAuthSession,
  useCallback,
  useCollectionState,
  useEffect,
  useMemo,
  useOnboardingState,
  useRecommendations,
  useRef,
  useState,
  useUserProfile,
  useWindowDimensions,
  useWishlistState,
  visibilityLabels,
  wishlistMatchPreferenceLabels,
  wishlistPriorityLabels,
  wishlistVisibilityLabels,
} from "../beta-app.shared";
import { BackArrowButton } from "./onboarding-flow";
import type {
  BackendFallbackState,
  BackendHealthState,
  BetaFeedback,
  BlockedUser,
  CollectionSummary,
  CollectorType,
  CommunicationPreference,
  CompSource,
  FallbackScope,
  Conversation,
  ConversationMessage,
  ImageSource,
  InventoryFilter,
  InventorySort,
  ItemPhoto,
  LocalConversation,
  LocalMessage,
  LocalTradeProposal,
  ManualRoute,
  MessageRoute,
  ModerationTarget,
  MvpChecklistItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PublicTradeableItem,
  RecommendationSummary,
  ReportReason,
  ShirtSize,
  Tab,
  Trade,
  TradeComposeStep,
  TradeItemSummary,
  TradeOfferPreference,
  TradeProgressStep,
  TradeRoute,
  TradeRecommendation,
  TradeStatus,
  TradeableItem,
  UserProfile,
  VintageCategory,
  WishlistFilter,
  WishlistItem,
  WishlistSort,
  WishlistSummary,
} from "../beta-app.shared";
import {
  AvatarBadge,
  getOfflineBannerReason,
  MissingRecord,
  ModerationActionsPanel,
  OfflineModeBanner,
  ReleaseEmptyState,
  shouldShowOfflineBanner,
} from "../components/shared-panels";

export function MessagesTab({
  backendFallback,
  backendHealth,
  localThreads,
  onBlockUser,
  onBackendFallback,
  onBackendRecovered,
  route,
  setLocalThreads,
  setRoute,
}: {
  backendFallback?: BackendFallbackState | undefined;
  backendHealth: BackendHealthState;
  localThreads: LocalConversation[];
  onBlockUser: (target: ModerationTarget) => void;
  onBackendFallback: (scope: FallbackScope, operation: string, error: unknown) => void;
  onBackendRecovered: (scope: FallbackScope) => void;
  route: MessageRoute;
  setLocalThreads: (updater: (current: LocalConversation[]) => LocalConversation[]) => void;
  setRoute: (route: MessageRoute) => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const apiRef = useRef(api);
  const [draft, setDraft] = useState("");
  const [apiConversations, setApiConversations] = useState<Conversation[]>([]);
  const [apiMessages, setApiMessages] = useState<Record<string, ConversationMessage[]>>({});
  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [source, setSource] = useState<"api" | "local">("local");

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refreshConversations = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);

    try {
      const [meResponse, conversationsResponse] = await Promise.all([
        apiRef.current.getMe(),
        apiRef.current.listConversations(),
      ]);
      setCurrentUser(meResponse.user);
      setApiConversations(conversationsResponse.conversations);
      setSource("api");
      onBackendRecovered("messages");
    } catch (loadError) {
      setError("Live messages are unavailable. Showing local beta conversations.");
      setSource("local");
      onBackendFallback("messages", "load conversations", loadError);
    } finally {
      setIsLoading(false);
    }
  }, [onBackendFallback, onBackendRecovered]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const loadConversationMessages = useCallback(
    async (conversationId: string) => {
      try {
        const [conversationResponse, messagesResponse] = await Promise.all([
          apiRef.current.getConversation(conversationId),
          apiRef.current.listMessages(conversationId),
        ]);
        setApiConversations((existing) => [
          conversationResponse.conversation,
          ...existing.filter((item) => item.id !== conversationId),
        ]);
        setApiMessages((existing) => ({
          ...existing,
          [conversationId]: messagesResponse.messages,
        }));

        const latestIncoming = [...messagesResponse.messages]
          .reverse()
          .find((message) => message.senderId !== currentUser?.id);
        if (latestIncoming) {
          void apiRef.current.markMessageRead(latestIncoming.id);
        }
      } catch (loadError) {
        setError("This conversation could not be loaded live.");
        onBackendFallback("messages", `load conversation ${conversationId}`, loadError);
      }
    },
    [currentUser?.id, onBackendFallback],
  );

  useEffect(() => {
    if (source !== "api" || route.mode !== "detail" || !route.conversationId) {
      return;
    }

    void loadConversationMessages(route.conversationId);
  }, [loadConversationMessages, route.conversationId, route.mode, source]);

  const conversations =
    source === "api"
      ? apiConversations.map((item) => toDisplayConversation(item, currentUser?.id))
      : localThreads;
  const conversation =
    route.conversationId === undefined
      ? undefined
      : conversations.find((item) => item.id === route.conversationId);
  const messages =
    source === "api" && route.conversationId
      ? (apiMessages[route.conversationId] ?? []).map((message) =>
          toDisplayMessage(message, currentUser?.id),
        )
      : (conversation?.messages ?? []);

  async function sendMessage() {
    const content = draft.trim();

    if (!content || !route.conversationId) {
      return;
    }

    if (source !== "api") {
      const localMessage: LocalMessage = {
        content,
        createdAt: new Date().toISOString(),
        id: `local_msg_${Date.now()}`,
        isMine: true,
        sender: "You",
      };
      setLocalThreads((threads) =>
        threads.map((thread) =>
          thread.id === route.conversationId
            ? {
                ...thread,
                messages: [...thread.messages, localMessage],
                unreadCount: 0,
              }
            : thread,
        ),
      );
      setDraft("");
      setError("Message saved locally. Live send will activate when the backend session is ready.");
      return;
    }

    setError(undefined);
    setIsSending(true);

    try {
      const response = await apiRef.current.sendMessage(route.conversationId, {
        content,
        type: "text",
      });
      const conversationId = route.conversationId;
      setApiMessages((existing) => ({
        ...existing,
        [conversationId]: [...(existing[conversationId] ?? []), response.message],
      }));
      setDraft("");
      void loadConversationMessages(conversationId);
    } catch (sendError) {
      setError("Message could not be sent.");
      onBackendFallback("messages", `send message ${route.conversationId}`, sendError);
    } finally {
      setIsSending(false);
    }
  }

  async function reportConversationUser(
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) {
    if (!isUuid(target.userId)) {
      console.log("[Konnesor moderation] local report", { reason, target, note });
      setError("Report saved locally for this beta thread.");
      return;
    }

    try {
      await apiRef.current.reportUser({
        note,
        reason,
        reportedUserId: target.userId,
      });
      setError("Report submitted.");
    } catch (reportError) {
      setError("Report could not reach the live API.");
      onBackendFallback("messages", `report user ${target.userId}`, reportError);
      throw reportError;
    }
  }

  async function blockConversationUser(target: ModerationTarget) {
    if (!target.userId) {
      setError("This beta thread does not have a user id to block.");
      return;
    }

    onBlockUser(target);

    if (isUuid(target.userId)) {
      try {
        await apiRef.current.blockUser({ blockedUserId: target.userId });
      } catch (blockError) {
        setError("Blocked locally. Live block will need to sync when the API is reachable.");
        onBackendFallback("messages", `block user ${target.userId}`, blockError);
      }
    } else {
      setError("Blocked locally for this beta thread.");
    }

    setRoute({ conversationId: undefined, mode: "list" });
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (source === "api" && route.conversationId) {
      void apiRef.current.markConversationTyping(route.conversationId);
    }
  }

  if (route.mode === "detail") {
    return (
      <ConversationDetail
        conversation={conversation}
        draft={draft}
        error={error}
        isSending={isSending}
        messages={messages}
        onBack={() => {
          setDraft("");
          setRoute({ conversationId: undefined, mode: "list" });
        }}
        onChangeDraft={handleDraftChange}
        onSend={() => void sendMessage()}
        offlineReason={getOfflineBannerReason(backendHealth, backendFallback)}
        onBlockUser={blockConversationUser}
        onReportUser={reportConversationUser}
        source={source}
      />
    );
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaTitle size={31}>MESSAGES</BetaTitle>
          <BetaBody>Collector conversations.</BetaBody>
        </View>

        <OfflineModeBanner
          detail={getOfflineBannerReason(backendHealth, backendFallback)}
          kind="message"
          visible={shouldShowOfflineBanner(backendHealth, source, backendFallback, isLoading)}
        />

        {error ? <BetaEmptyState message={error} title="Offline fallback" tone="warning" /> : null}

        {isLoading ? (
          <BetaEmptyState
            message="Checking the live conversation API before using the fallback."
            title="Loading messages"
          />
        ) : conversations.length === 0 ? (
          <ReleaseEmptyState
            message="Create a trade proposal or open an item question to start the first beta conversation thread."
            title="No conversations yet"
          />
        ) : null}

        {conversations.map((conversationItem) => (
          <ConversationRow
            conversation={conversationItem}
            key={conversationItem.id}
            onPress={() => {
              if (source === "local") {
                setLocalThreads((threads) =>
                  threads.map((thread) =>
                    thread.id === conversationItem.id ? { ...thread, unreadCount: 0 } : thread,
                  ),
                );
              }
              setRoute({ conversationId: conversationItem.id, mode: "detail" });
            }}
          />
        ))}

        <BetaButton
          accessibilityLabel="Refresh live conversations"
          onPress={() => void refreshConversations()}
          variant="secondary"
        >
          Refresh messages
        </BetaButton>
      </ScrollView>
    </BetaScreen>
  );
}

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: LocalConversation;
  onPress: () => void;
}) {
  const lastMessage = conversation.messages.at(-1);
  const isBrand = conversation.participant.toLowerCase().includes("trade team");

  return (
    <Pressable
      accessibilityLabel={`Open ${conversation.contextTitle} conversation`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: beta.colors.surface,
        borderColor: conversation.unreadCount > 0 ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: beta.spacing.md,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.md,
      })}
    >
      <AvatarBadge label={conversation.participant} tone={isBrand ? "brand" : "person"} />
      <View style={{ flex: 1, gap: beta.spacing.xs }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.sm }}>
          <Text style={{ color: beta.colors.ink, flex: 1, fontSize: 16, fontWeight: "900" }}>
            {conversation.participant}
          </Text>
          {conversation.unreadCount > 0 ? (
            <View
              style={{
                backgroundColor: beta.colors.orange,
                borderRadius: 999,
                height: 10,
                width: 10,
              }}
            />
          ) : null}
        </View>
        <Text style={{ color: beta.colors.ink, fontSize: 13, fontWeight: "800" }}>
          {conversation.contextTitle}
        </Text>
        <Text
          numberOfLines={2}
          style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}
        >
          {lastMessage ? `${lastMessage.sender}: ${lastMessage.content}` : "No messages yet"}
        </Text>
      </View>
      <View
        style={{
          alignItems: "center",
          backgroundColor: beta.colors.surfaceWarm,
          borderColor: beta.colors.border,
          borderRadius: beta.radius.sm,
          borderWidth: 1,
          height: 58,
          justifyContent: "center",
          width: 58,
        }}
      >
        <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
          {conversation.contextType === "trade" ? "↔" : "TEE"}
        </Text>
      </View>
    </Pressable>
  );
}

export function toDisplayConversation(
  conversation: Conversation,
  currentUserId: string | undefined,
): LocalConversation {
  const otherParticipant =
    conversation.participants.find((participant) => participant.userId !== currentUserId) ??
    conversation.participants[0];
  const lastMessage = conversation.lastMessage
    ? toDisplayMessage(conversation.lastMessage, currentUserId)
    : undefined;

  return {
    contextSubtitle: conversation.context.subtitle ?? "Contextual collector thread",
    contextTitle: conversation.context.title,
    contextType: conversation.contextType,
    id: conversation.id,
    messages: lastMessage ? [lastMessage] : [],
    participant: otherParticipant?.displayName ?? "Collector",
    participantId: otherParticipant?.userId,
    unreadCount: conversation.unreadCount,
  };
}

export function toDisplayMessage(
  message: ConversationMessage,
  currentUserId: string | undefined,
): LocalMessage {
  return {
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    isMine: Boolean(currentUserId && message.senderId === currentUserId),
    sender: message.senderDisplayName,
    type: message.type === "system_event" ? "system" : "text",
  };
}

export function ConversationDetail({
  conversation,
  draft,
  error,
  isSending,
  messages,
  onBack,
  onBlockUser,
  onChangeDraft,
  onReportUser,
  onSend,
  offlineReason,
  source,
}: {
  conversation: LocalConversation | undefined;
  draft: string;
  error?: string | undefined;
  isSending: boolean;
  messages: LocalMessage[];
  onBack: () => void;
  onBlockUser: (target: ModerationTarget) => Promise<void> | void;
  onChangeDraft: (value: string) => void;
  onReportUser: (
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) => Promise<void> | void;
  onSend: () => void;
  offlineReason?: string | undefined;
  source: "api" | "local";
}) {
  const theme = beta;

  if (!conversation) {
    return <MissingRecord title="Conversation not found" onBack={onBack} />;
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BackArrowButton accessibilityLabel="Back to messages" onPress={onBack} />

        <OfflineModeBanner detail={offlineReason} kind="message" visible={source === "local"} />

        <BetaPanel tone={conversation.contextType === "trade" ? "black" : "peach"}>
          <Text
            style={{
              color: beta.colors.orange,
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {conversation.contextType.toUpperCase()} CONVERSATION
          </Text>
          <Text
            style={{
              color: beta.colors.ink,
              fontSize: 24,
              fontWeight: "900",
            }}
          >
            {conversation.contextTitle}
          </Text>
          <Text
            style={{
              color:
                conversation.contextType === "trade"
                  ? beta.colors.orangeSoft
                  : beta.colors.inkMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {conversation.contextSubtitle}
          </Text>
          <Text
            style={{
              color:
                conversation.contextType === "trade"
                  ? beta.colors.orangeSoft
                  : beta.colors.inkMuted,
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {source === "api" ? "LIVE API THREAD" : "LOCAL FALLBACK THREAD"}
          </Text>
        </BetaPanel>

        <ModerationActionsPanel
          onBlock={onBlockUser}
          onReport={onReportUser}
          target={{
            displayName: conversation.participant,
            userId: conversation.participantId,
          }}
        />

        <View style={{ gap: theme.spacing.md }}>
          {messages.length === 0 ? (
            <BetaEmptyState
              message="Ask a focused question about condition, measurements, photos, or trade terms."
              title="Start the conversation"
            />
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
        </View>

        {error ? <BetaEmptyState message={error} title="Message status" tone="warning" /> : null}

        <BetaTextField
          label="Message"
          multiline
          numberOfLines={4}
          onChangeText={onChangeDraft}
          placeholder="Ask about condition, measurements, photos, or trade terms."
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={draft}
        />
        <BetaButton
          accessibilityLabel="Send message"
          disabled={!draft.trim()}
          loading={isSending}
          onPress={onSend}
        >
          Send message
        </BetaButton>
      </ScrollView>
    </BetaScreen>
  );
}

export function MessageBubble({ message }: { message: LocalMessage }) {
  const isSystem = message.type === "system";
  const alignItems = isSystem ? "center" : message.isMine ? "flex-end" : "flex-start";
  const backgroundColor = isSystem
    ? beta.colors.surfaceWarm
    : message.isMine
      ? beta.colors.orange
      : beta.colors.surface;
  const textColor = message.isMine && !isSystem ? beta.colors.background : beta.colors.ink;
  const metaColor = message.isMine && !isSystem ? beta.colors.background : beta.colors.inkMuted;

  return (
    <View style={{ alignItems }}>
      <View
        style={{
          backgroundColor,
          borderColor: isSystem || !message.isMine ? beta.colors.border : beta.colors.orange,
          borderRadius: beta.radius.lg,
          borderWidth: 1,
          gap: beta.spacing.xs,
          maxWidth: "88%",
          padding: beta.spacing.md,
        }}
      >
        {!message.isMine || isSystem ? (
          <Text style={{ color: metaColor, fontSize: 11, fontWeight: "900" }}>
            {message.sender}
          </Text>
        ) : null}
        <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>{message.content}</Text>
        <Text style={{ color: metaColor, fontSize: 11 }}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}
