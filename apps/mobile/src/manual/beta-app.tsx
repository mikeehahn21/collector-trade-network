import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, ScrollView, StatusBar, Switch, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ITEM_CONDITIONS,
  ITEM_ERAS,
  SHIRT_SIZES,
  VINTAGE_CATEGORIES,
  WISHLIST_MATCH_PREFERENCES,
  WISHLIST_PRIORITIES,
  WISHLIST_VISIBILITY_OPTIONS,
} from "@ctn/constants";
import type {
  Conversation,
  ConversationMessage,
  RecommendationSummary,
  Trade,
  TradeRecommendation,
  TradeStatus,
  TradeableItem,
  UserProfile,
  WishlistItem,
  ItemPhoto,
} from "@ctn/types";

import {
  categoryLabels,
  conditionLabels,
  sizeLabels,
  statusLabels,
  tradePreferenceLabels,
  visibilityLabels,
} from "@/lib/item-display";
import { getMockAiListingSuggestions } from "@/lib/mock-ai-listing";
import { getPublishCheck } from "@/lib/item-validation";
import { tradeStatusLabels } from "@/lib/trade-display";
import { betaTokens as beta } from "@/manual/beta-tokens";
import {
  BetaBody,
  BetaButton,
  BetaChip,
  BetaChoice,
  BetaEmptyState,
  BetaItemCard,
  BetaKicker,
  BetaPanel,
  BetaScreen,
  BetaStatPanel,
  BetaTabBar,
  BetaTextField,
  BetaTitle,
  BetaWantCard,
} from "@/manual/beta-ui";
import {
  wishlistMatchPreferenceLabels,
  wishlistPriorityLabels,
  wishlistVisibilityLabels,
} from "@/lib/wishlist-display";
import { useApiClient } from "@/api/use-api-client";
import { MobileAuthProvider } from "@/auth/clerk-provider";
import { CollectionStateProvider, useCollectionState } from "@/state/collection-state";
import { OnboardingStateProvider } from "@/state/onboarding-state";
import { useRecommendations } from "@/state/recommendation-state";
import { UserProfileProvider, useUserProfile } from "@/state/user-profile-state";
import { WishlistStateProvider, useWishlistState } from "@/state/wishlist-state";
import { DataSyncBootstrap } from "@/sync/data-sync-bootstrap";
import { ThemeProvider } from "@/theme/theme-provider";

type Tab = "home" | "inventory" | "wishlist" | "messages" | "trades";
type ManualRoute = { mode: "list" | "detail" | "edit"; itemId: string | undefined };
type MessageRoute = { conversationId: string | undefined; mode: "list" | "detail" };
type TradeRoute = { mode: "list" | "detail" | "compose"; tradeId: string | undefined };
type LocalMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  sender: string;
  type?: "text" | "system";
};
type LocalConversation = {
  contextSubtitle: string;
  contextTitle: string;
  contextType: Conversation["contextType"];
  id: string;
  messages: LocalMessage[];
  participant: string;
  unreadCount: number;
};
type LocalTradeProposal = {
  id: string;
  offeredItemId: string | undefined;
  requestedTitle: string;
  requestedSubtitle: string;
  status: TradeStatus;
  counterparty: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "inventory", label: "Inventory" },
  { id: "wishlist", label: "Wishlist" },
  { id: "messages", label: "Messages" },
  { id: "trades", label: "Trades" },
];

const localConversations: LocalConversation[] = [
  {
    contextSubtitle: "Item question - Brockum tag, XL",
    contextTitle: "Beta test tee 1",
    contextType: "item",
    id: "conv_item_condition",
    messages: [
      {
        content: "Can you send a closer tag photo and pit-to-pit measurement?",
        createdAt: "2026-08-12T10:16:00.000Z",
        id: "msg_1",
        isMine: false,
        sender: "Jordan M.",
      },
      {
        content: "Yes. Chest is 23 in flat. I can add tag and back-print photos tonight.",
        createdAt: "2026-08-12T10:19:00.000Z",
        id: "msg_2",
        isMine: true,
        sender: "You",
      },
    ],
    participant: "Jordan M.",
    unreadCount: 1,
  },
  {
    contextSubtitle: "Trade thread - rap tee for sports grail",
    contextTitle: "Trade review pending",
    contextType: "trade",
    id: "conv_trade_review",
    messages: [
      {
        content:
          "Trade conversation opened. Keep condition, shipping, and final terms in this thread.",
        createdAt: "2026-08-12T11:04:00.000Z",
        id: "msg_3",
        isMine: false,
        sender: "Konnesor",
        type: "system",
      },
      {
        content: "I am open if the Bulls tee is as clean as the listing says.",
        createdAt: "2026-08-12T11:08:00.000Z",
        id: "msg_4",
        isMine: false,
        sender: "Avery R.",
      },
    ],
    participant: "Avery R.",
    unreadCount: 0,
  },
];

export default function BetaApp() {
  return (
    <SafeAreaProvider>
      <MobileAuthProvider>
        <ThemeProvider>
          <OnboardingStateProvider>
            <CollectionStateProvider>
              <WishlistStateProvider>
                <UserProfileProvider>
                  <DataSyncBootstrap />
                  <StatusBar barStyle="light-content" />
                  <BetaShell />
                </UserProfileProvider>
              </WishlistStateProvider>
            </CollectionStateProvider>
          </OnboardingStateProvider>
        </ThemeProvider>
      </MobileAuthProvider>
    </SafeAreaProvider>
  );
}

function BetaShell() {
  const [tab, setTab] = useState<Tab>("home");
  const [inventoryRoute, setInventoryRoute] = useState<ManualRoute>({
    itemId: undefined,
    mode: "list",
  });
  const [wishlistRoute, setWishlistRoute] = useState<ManualRoute>({
    itemId: undefined,
    mode: "list",
  });
  const [messageRoute, setMessageRoute] = useState<MessageRoute>({
    conversationId: undefined,
    mode: "list",
  });
  const [tradeRoute, setTradeRoute] = useState<TradeRoute>({
    mode: "list",
    tradeId: undefined,
  });
  const [localTrades, setLocalTrades] = useState<LocalTradeProposal[]>([]);

  function openTab(nextTab: Tab) {
    setTab(nextTab);
    if (nextTab !== "inventory") {
      setInventoryRoute({ itemId: undefined, mode: "list" });
    }
    if (nextTab !== "wishlist") {
      setWishlistRoute({ itemId: undefined, mode: "list" });
    }
    if (nextTab !== "messages") {
      setMessageRoute({ conversationId: undefined, mode: "list" });
    }
    if (nextTab !== "trades") {
      setTradeRoute({ mode: "list", tradeId: undefined });
    }
  }

  return (
    <View style={{ backgroundColor: beta.colors.background, flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "home" ? <HomeTab setTab={openTab} /> : null}
        {tab === "inventory" ? (
          <InventoryTab route={inventoryRoute} setRoute={setInventoryRoute} />
        ) : null}
        {tab === "wishlist" ? (
          <WishlistTab route={wishlistRoute} setRoute={setWishlistRoute} />
        ) : null}
        {tab === "messages" ? (
          <MessagesTab route={messageRoute} setRoute={setMessageRoute} />
        ) : null}
        {tab === "trades" ? (
          <TradesTab
            localTrades={localTrades}
            route={tradeRoute}
            setLocalTrades={setLocalTrades}
            setRoute={setTradeRoute}
          />
        ) : null}
      </View>
      <BetaTabBar active={tab} onChange={openTab} tabs={tabs} />
    </View>
  );
}

function HomeTab({ setTab }: { setTab: (tab: Tab) => void }) {
  const theme = beta;
  const { items, summary: collectionSummary } = useCollectionState();
  const { activeItems, summary: wishlistSummary } = useWishlistState();
  const { isLoading: isProfileLoading, profile } = useUserProfile();
  const {
    error: recommendationError,
    isLoading: isRecommendationsLoading,
    recommendations,
    refresh: refreshRecommendations,
    summary: recommendationSummary,
  } = useRecommendations();
  const tradeableItems = useMemo(
    () => items.filter((item) => item.status === "tradeable"),
    [items],
  );
  const publishReadyCount = useMemo(
    () => items.filter((item) => getPublishCheck(item).isValid).length,
    [items],
  );

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>IPHONE BETA</BetaKicker>
          <BetaTitle size={36}>Konnesor is running.</BetaTitle>
          <BetaBody>
            A bright collector archive for trade-ready pieces, serious wants, and structured swaps.
            This iPhone shell stays off Expo Router while we restore the product safely.
          </BetaBody>
        </View>

        <BetaStatPanel
          stats={[
            { label: "Tradeable", value: collectionSummary.tradeableItems },
            { label: "Wishlist", value: wishlistSummary.activeItems },
            { label: "Grails", value: wishlistSummary.grailItems },
          ]}
        />

        <MatchPreview tradeableItems={tradeableItems} wishlistItems={activeItems} />
        <RecommendationPreview
          error={recommendationError}
          isLoading={isRecommendationsLoading}
          onRefresh={() => void refreshRecommendations()}
          recommendations={recommendations}
          summary={recommendationSummary}
        />

        <BetaReadinessPanel
          metrics={[
            {
              detail:
                profile?.displayName ??
                (isProfileLoading ? "Checking live account" : "Local beta identity"),
              label: "Account",
              status: profile ? "Live" : "Local",
            },
            {
              detail: `${publishReadyCount} of ${collectionSummary.totalItems} records pass publish checks`,
              label: "Collection",
              status: publishReadyCount > 0 ? "Ready" : "Needs records",
            },
            {
              detail: `${wishlistSummary.activeItems} active wants, ${wishlistSummary.grailItems} grails`,
              label: "Wishlist",
              status: wishlistSummary.activeItems > 0 ? "Ready" : "Needs wants",
            },
            {
              detail: "Live API attempt with local fallback",
              label: "Messages",
              status: "Beta wired",
            },
            {
              detail: `${recommendationSummary.total} live opportunities checked`,
              label: "Recommendations",
              status: recommendationSummary.total > 0 ? "Live" : "Checking",
            },
            {
              detail: "Live API attempt with local proposal fallback",
              label: "Trades",
              status: "Beta wired",
            },
          ]}
        />

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton accessibilityLabel="Open inventory" onPress={() => setTab("inventory")}>
            Open collection
          </BetaButton>
          <BetaButton
            accessibilityLabel="Open wishlist"
            onPress={() => setTab("wishlist")}
            variant="secondary"
          >
            Open wants
          </BetaButton>
          <BetaButton
            accessibilityLabel="Open messages"
            onPress={() => setTab("messages")}
            variant="black"
          >
            Open messages
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

function MatchPreview({
  tradeableItems,
  wishlistItems,
}: {
  tradeableItems: TradeableItem[];
  wishlistItems: WishlistItem[];
}) {
  const firstTradeable = tradeableItems[0];
  const firstWant = wishlistItems[0];

  if (!firstTradeable || !firstWant) {
    return (
      <BetaPanel>
        <BetaKicker>TRADE GRAPH PREVIEW</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
          Add one tradeable item and one want to preview a match.
        </Text>
        <BetaBody>
          Konnesor should explain why two collectors should talk before it pushes a trade.
        </BetaBody>
      </BetaPanel>
    );
  }

  const sameSize = firstTradeable.size && firstWant.size && firstTradeable.size === firstWant.size;
  const sameCategory =
    firstTradeable.category && firstWant.category && firstTradeable.category === firstWant.category;

  return (
    <BetaPanel tone="peach">
      <BetaKicker>TRADE GRAPH PREVIEW</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
        {firstTradeable.title || "Collection item"} may help unlock{" "}
        {firstWant.title || "wishlist want"}.
      </Text>
      <BetaBody>
        Signals: {sameCategory ? "category match" : "category gap"} /{" "}
        {sameSize ? "size match" : "size flexible"} /{" "}
        {firstWant.isGrail ? "grail priority" : "active want"}.
      </BetaBody>
    </BetaPanel>
  );
}

function RecommendationPreview({
  error,
  isLoading,
  onRefresh,
  recommendations,
  summary,
}: {
  error?: string | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  recommendations: TradeRecommendation[];
  summary: RecommendationSummary;
}) {
  const topRecommendation = recommendations[0];

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>LIVE OPPORTUNITIES</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
          {isLoading ? "Checking trade graph." : `${summary.total} opportunities`}
        </Text>
        <BetaBody>
          {summary.grailMatches} grail matches / {summary.mutualMatches} mutual matches /{" "}
          {summary.newMatches} new signals
        </BetaBody>
      </View>

      {topRecommendation ? (
        <View
          style={{
            backgroundColor: beta.colors.orangeSoft,
            borderColor: beta.colors.orange,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            gap: beta.spacing.sm,
            padding: beta.spacing.md,
          }}
        >
          <Text style={{ color: beta.colors.ink, fontSize: 18, fontWeight: "900" }}>
            {topRecommendation.counterpartyDisplayName}
          </Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
            Score {topRecommendation.score} / {topRecommendation.confidence} confidence /{" "}
            {topRecommendation.reasons[0]?.label ?? "match signal"}
          </Text>
        </View>
      ) : (
        <BetaBody>
          {error ?? "Add tradeable inventory and wants, then refresh for backend match signals."}
        </BetaBody>
      )}

      <BetaButton
        accessibilityLabel="Refresh live recommendations"
        onPress={onRefresh}
        variant="secondary"
      >
        Refresh opportunities
      </BetaButton>
    </BetaPanel>
  );
}

function BetaReadinessPanel({
  metrics,
}: {
  metrics: Array<{ detail: string; label: string; status: string }>;
}) {
  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>BETA READINESS</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
          Product checkpoints
        </Text>
      </View>
      <View style={{ gap: beta.spacing.sm }}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={{
              borderColor: beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              gap: beta.spacing.xs,
              padding: beta.spacing.md,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: beta.spacing.md,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>
                {metric.label}
              </Text>
              <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
                {metric.status}
              </Text>
            </View>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {metric.detail}
            </Text>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

function InventoryTab({
  route,
  setRoute,
}: {
  route: ManualRoute;
  setRoute: (route: ManualRoute) => void;
}) {
  const theme = beta;
  const { createItem, getItem, items, publishItem, summary } = useCollectionState();
  const visibleItems = useMemo(() => items.filter((item) => item.status !== "archived"), [items]);
  const selectedItem = route.itemId ? getItem(route.itemId) : undefined;

  if (route.mode === "detail") {
    return (
      <InventoryDetail
        item={selectedItem}
        onBack={() => setRoute({ itemId: undefined, mode: "list" })}
        onEdit={(itemId) => setRoute({ mode: "edit", itemId })}
      />
    );
  }

  if (route.mode === "edit") {
    return (
      <InventoryEdit
        item={selectedItem}
        onBack={() =>
          setRoute(
            route.itemId
              ? { mode: "detail", itemId: route.itemId }
              : { itemId: undefined, mode: "list" },
          )
        }
      />
    );
  }

  function addSampleItem() {
    const item = createItem({
      category: "band",
      condition: "very_good",
      era: "1990s",
      estimatedValue: { currency: "USD", min: 180, max: 260 },
      size: "xl",
      status: "draft",
      tag: "Brockum",
      title: `Beta test tee ${visibleItems.length + 1}`,
      tradePreference: "wishlist_only",
      visibility: "approved_members",
    });
    publishItem(item.id);
    setRoute({ mode: "detail", itemId: item.id });
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>COLLECTION</BetaKicker>
          <BetaTitle>Your tradeable archive.</BetaTitle>
          <BetaBody>
            Document condition, size, and trade posture before an item enters the network.
          </BetaBody>
        </View>

        <BetaStatPanel
          stats={[
            { label: "Total", value: summary.totalItems },
            { label: "Tradeable", value: summary.tradeableItems },
            { label: "Drafts", value: summary.draftItems },
          ]}
        />

        <BetaButton accessibilityLabel="Add sample item" onPress={addSampleItem}>
          Add archive item
        </BetaButton>

        {visibleItems.length === 0 ? (
          <BetaEmptyState
            message="Tap Add archive item to create the first local beta collection record."
            title="No collection records yet"
          />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            {visibleItems.map((item) => (
              <View key={item.id} style={{ width: "47%" }}>
                <BetaItemCard
                  item={item}
                  onPress={() => setRoute({ mode: "detail", itemId: item.id })}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </BetaScreen>
  );
}

function WishlistTab({
  route,
  setRoute,
}: {
  route: ManualRoute;
  setRoute: (route: ManualRoute) => void;
}) {
  const theme = beta;
  const { activeItems, createWishlistItem, getWishlistItem, moveWishlistItem, summary } =
    useWishlistState();
  const selectedItem = route.itemId ? getWishlistItem(route.itemId) : undefined;

  if (route.mode === "detail") {
    return (
      <WishlistDetail
        item={selectedItem}
        onBack={() => setRoute({ itemId: undefined, mode: "list" })}
        onEdit={(itemId) => setRoute({ mode: "edit", itemId })}
      />
    );
  }

  if (route.mode === "edit") {
    return (
      <WishlistEdit
        item={selectedItem}
        onBack={() =>
          setRoute(
            route.itemId
              ? { mode: "detail", itemId: route.itemId }
              : { itemId: undefined, mode: "list" },
          )
        }
      />
    );
  }

  function addSampleWish() {
    const item = createWishlistItem({
      category: "rap",
      isGrail: activeItems.length === 0,
      matchPreference: "similar",
      preferredCondition: "good",
      preferredEra: "1990s",
      priority: activeItems.length === 0 ? "high" : "medium",
      size: "xl",
      title: `Beta wishlist grail ${activeItems.length + 1}`,
      visibility: "approved_members",
    });
    setRoute({ mode: "detail", itemId: item.id });
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>WANTS</BetaKicker>
          <BetaTitle>What are you hunting?</BetaTitle>
          <BetaBody>
            Rank grails and wants so future trade matches understand what actually matters.
          </BetaBody>
        </View>

        <BetaStatPanel
          stats={[
            { label: "Active", value: summary.activeItems },
            { label: "Grails", value: summary.grailItems },
            { label: "High", value: summary.highPriorityItems },
          ]}
        />

        <BetaButton accessibilityLabel="Add sample wishlist item" onPress={addSampleWish}>
          Add want
        </BetaButton>

        {activeItems.length === 0 ? (
          <BetaEmptyState
            message="Tap Add sample want to create the first local beta wishlist record."
            title="No wants yet"
          />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {activeItems.map((item, index) => (
              <BetaWantCard
                index={index}
                item={item}
                key={item.id}
                onMoveDown={() => moveWishlistItem(item.id, "down")}
                onMoveUp={() => moveWishlistItem(item.id, "up")}
                onPress={() => setRoute({ mode: "detail", itemId: item.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </BetaScreen>
  );
}

function MessagesTab({
  route,
  setRoute,
}: {
  route: MessageRoute;
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
    } catch {
      setError("Live messages are unavailable. Showing local beta conversations.");
      setSource("local");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      } catch {
        setError("This conversation could not be loaded live.");
      }
    },
    [currentUser?.id],
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
      : localConversations;
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
      Alert.alert(
        "Local message draft",
        "Live messages are unavailable in fallback mode. The UI is still available for design review.",
      );
      setDraft("");
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
    } catch {
      setError("Message could not be sent.");
    } finally {
      setIsSending(false);
    }
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
          <BetaKicker>MESSAGES</BetaKicker>
          <BetaTitle>Contextual collector chat.</BetaTitle>
          <BetaBody>
            Every thread stays attached to an item or trade so condition, measurements, and terms
            stay organized.
          </BetaBody>
        </View>

        {error ? <BetaEmptyState message={error} title="Offline fallback" tone="warning" /> : null}

        {isLoading ? (
          <BetaEmptyState
            message="Checking the live conversation API before using the fallback."
            title="Loading messages"
          />
        ) : conversations.length === 0 ? (
          <BetaEmptyState
            message="Start a thread from an item or trade once the backend has conversation records."
            title="No live conversations yet"
          />
        ) : null}

        {conversations.map((conversationItem) => (
          <ConversationRow
            conversation={conversationItem}
            key={conversationItem.id}
            onPress={() => setRoute({ conversationId: conversationItem.id, mode: "detail" })}
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

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: LocalConversation;
  onPress: () => void;
}) {
  const lastMessage = conversation.messages.at(-1);

  return (
    <Pressable
      accessibilityLabel={`Open ${conversation.contextTitle} conversation`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: conversation.unreadCount > 0 ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.sm,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.lg,
      })}
    >
      <View style={{ flexDirection: "row", gap: beta.spacing.md, justifyContent: "space-between" }}>
        <BetaKicker>{conversation.contextType.toUpperCase()}</BetaKicker>
        {conversation.unreadCount > 0 ? (
          <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
            {conversation.unreadCount} unread
          </Text>
        ) : null}
      </View>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
        {conversation.contextTitle}
      </Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
        {lastMessage ? `${lastMessage.sender}: ${lastMessage.content}` : "No messages yet"}
      </Text>
    </Pressable>
  );
}

function toDisplayConversation(
  conversation: Conversation,
  currentUserId: string | undefined,
): LocalConversation {
  const participantNames = conversation.participants
    .map((participant) => participant.displayName)
    .filter(Boolean);
  const lastMessage = conversation.lastMessage
    ? toDisplayMessage(conversation.lastMessage, currentUserId)
    : undefined;

  return {
    contextSubtitle: conversation.context.subtitle ?? "Contextual collector thread",
    contextTitle: conversation.context.title,
    contextType: conversation.contextType,
    id: conversation.id,
    messages: lastMessage ? [lastMessage] : [],
    participant: participantNames.length > 0 ? participantNames.join(", ") : "Collector",
    unreadCount: conversation.unreadCount,
  };
}

function toDisplayMessage(
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

function ConversationDetail({
  conversation,
  draft,
  error,
  isSending,
  messages,
  onBack,
  onChangeDraft,
  onSend,
  source,
}: {
  conversation: LocalConversation | undefined;
  draft: string;
  error?: string | undefined;
  isSending: boolean;
  messages: LocalMessage[];
  onBack: () => void;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
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
        <BetaButton accessibilityLabel="Back to messages" onPress={onBack} variant="ghost">
          Back to messages
        </BetaButton>

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

function MessageBubble({ message }: { message: LocalMessage }) {
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

function InventoryDetail({
  item,
  onBack,
  onEdit,
}: {
  item: TradeableItem | undefined;
  onBack: () => void;
  onEdit: (itemId: string) => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const { archiveItem, publishItem, updateItem, upsertItemFromServer } = useCollectionState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | undefined>();

  if (!item) {
    return <MissingRecord title="Item not found" onBack={onBack} />;
  }

  const currentItem = item;
  const publishCheck = getPublishCheck(currentItem);
  const measurements = [
    currentItem.measurements.chest ? `Chest ${currentItem.measurements.chest}` : undefined,
    currentItem.measurements.length ? `Length ${currentItem.measurements.length}` : undefined,
    currentItem.measurements.shoulder ? `Shoulder ${currentItem.measurements.shoulder}` : undefined,
    currentItem.measurements.sleeve ? `Sleeve ${currentItem.measurements.sleeve}` : undefined,
  ]
    .filter(Boolean)
    .join(" - ");
  const value =
    currentItem.estimatedValue.min || currentItem.estimatedValue.max
      ? `$${currentItem.estimatedValue.min ?? "?"} - $${currentItem.estimatedValue.max ?? "?"}`
      : "Not estimated";

  async function addPhoto(kind: ItemPhoto["kind"]) {
    const photo = await pickItemPhoto(kind, currentItem.photos.length);
    if (!photo) {
      return;
    }

    updateItem(currentItem.id, { photos: [...currentItem.photos, photo] });
  }

  async function saveLive(nextItem: TradeableItem, mode: "draft" | "publish") {
    setIsSyncing(true);
    setSyncMessage(undefined);

    try {
      if (mode === "publish") {
        const response = isLocalRecordId(nextItem.id)
          ? await api.publishItem({ ...nextItem, status: "tradeable" })
          : await api.updateItem(nextItem.id, { ...nextItem, status: "tradeable" });
        upsertItemFromServer(response.item, isLocalRecordId(nextItem.id) ? nextItem.id : undefined);
        setSyncMessage("Saved live as tradeable.");
        return;
      }

      const response = isLocalRecordId(nextItem.id)
        ? await api.createItem(nextItem)
        : await api.updateItem(nextItem.id, nextItem);
      upsertItemFromServer(response.item, isLocalRecordId(nextItem.id) ? nextItem.id : undefined);
      setSyncMessage("Draft saved live.");
    } catch {
      setSyncMessage("Live sync unavailable. Local record is still saved on this phone.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handlePublish() {
    if (!publishCheck.isValid) {
      Alert.alert("Item is not publish-ready", publishCheck.missing.join("\n"));
      return;
    }

    publishItem(currentItem.id);
    await saveLive({ ...currentItem, status: "tradeable" }, "publish");
  }

  async function handleArchive() {
    archiveItem(currentItem.id);
    if (!isLocalRecordId(currentItem.id)) {
      try {
        await api.updateItem(currentItem.id, { status: "archived" });
      } catch {
        // Local archive remains authoritative for the iPhone beta.
      }
    }
    onBack();
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to inventory" onPress={onBack} variant="ghost">
          Back to inventory
        </BetaButton>
        <View
          style={{
            alignItems: "center",
            aspectRatio: 0.86,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.lg,
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {item.photos[0] ? (
            <Image
              accessibilityLabel={`${item.title || "Item"} primary photo`}
              source={{ uri: item.photos[0].uri }}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: "800" }}>
              No photos yet
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <BetaButton accessibilityLabel="Add front photo" onPress={() => void addPhoto("front")}>
              Add front photo
            </BetaButton>
          </View>
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Add tag photo"
              onPress={() => void addPhoto("tag")}
              variant="secondary"
            >
              Add tag photo
            </BetaButton>
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>{statusLabels[item.status]}</BetaKicker>
          <BetaTitle>{item.title || "Untitled draft"}</BetaTitle>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {item.category ? categoryLabels[item.category] : "No category"} -{" "}
            {item.size ? sizeLabels[item.size] : "No size"}
          </Text>
        </View>

        <DetailPanel
          rows={[
            ["Condition", item.condition ? conditionLabels[item.condition] : "Not set"],
            ["Tag", item.tag || "Not set"],
            ["Era", item.era || "Not set"],
            ["Measurements", measurements || "Not set"],
            ["Value", value],
            ["Visibility", visibilityLabels[item.visibility]],
            [
              "Trade preference",
              item.tradePreference ? tradePreferenceLabels[item.tradePreference] : "Not set",
            ],
          ]}
          title="Item details"
        />
        <DetailPanel
          rows={[
            ["Publish-ready", publishCheck.isValid ? "Yes" : "No"],
            ["Missing", publishCheck.missing.length > 0 ? publishCheck.missing.join(", ") : "None"],
            ["Live record", isLocalRecordId(item.id) ? "Not yet synced" : "Synced ID"],
          ]}
          title="Readiness"
        />
        {syncMessage ? <BetaEmptyState message={syncMessage} title="Sync status" /> : null}

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton accessibilityLabel="Edit item" onPress={() => onEdit(item.id)}>
            Edit item
          </BetaButton>
          <BetaButton
            accessibilityLabel="Save draft live"
            loading={isSyncing}
            onPress={() => void saveLive(item, "draft")}
            variant="secondary"
          >
            Save draft live
          </BetaButton>
          <BetaButton
            accessibilityLabel="Publish item"
            disabled={item.status === "tradeable"}
            loading={isSyncing}
            onPress={() => void handlePublish()}
            variant="black"
          >
            Publish as Tradeable
          </BetaButton>
          <BetaButton
            accessibilityLabel="Archive item"
            onPress={() => void handleArchive()}
            variant="ghost"
          >
            Archive item
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

function InventoryEdit({ item, onBack }: { item: TradeableItem | undefined; onBack: () => void }) {
  const theme = beta;
  const api = useApiClient();
  const { updateItem, upsertItemFromServer } = useCollectionState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | undefined>();

  if (!item) {
    return <MissingRecord title="Item not found" onBack={onBack} />;
  }
  const currentItem = item;

  function applyAiSuggestions() {
    const suggestions = getMockAiListingSuggestions(currentItem);
    updateItem(currentItem.id, { aiSuggestions: suggestions });
    Alert.alert("AI suggestions ready", "Suggestions were added for review.");
  }

  async function addPhoto(kind: ItemPhoto["kind"]) {
    const photo = await pickItemPhoto(kind, currentItem.photos.length);
    if (!photo) {
      return;
    }

    updateItem(currentItem.id, { photos: [...currentItem.photos, photo] });
  }

  async function saveDraftLive() {
    setIsSyncing(true);
    setSyncMessage(undefined);

    try {
      const response = isLocalRecordId(currentItem.id)
        ? await api.createItem(currentItem)
        : await api.updateItem(currentItem.id, currentItem);
      upsertItemFromServer(
        response.item,
        isLocalRecordId(currentItem.id) ? currentItem.id : undefined,
      );
      setSyncMessage("Draft saved live.");
    } catch {
      setSyncMessage("Live sync unavailable. Local edits are still saved on this phone.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to item detail" onPress={onBack} variant="ghost">
          Back to item
        </BetaButton>
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>ITEM BUILDER</BetaKicker>
          <BetaTitle>Shape the item record.</BetaTitle>
        </View>

        <BetaButton
          accessibilityLabel="Generate mocked AI suggestions"
          onPress={applyAiSuggestions}
          variant="secondary"
        >
          Generate AI suggestions
        </BetaButton>
        {currentItem.aiSuggestions ? (
          <DetailPanel
            rows={[
              ["Confidence", currentItem.aiSuggestions.confidence],
              ["Suggested title", currentItem.aiSuggestions.title ?? "Untitled suggestion"],
            ]}
            title="AI suggestions"
          />
        ) : null}

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Add front item photo"
              onPress={() => void addPhoto("front")}
              variant="black"
            >
              Add front photo
            </BetaButton>
          </View>
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Add detail item photo"
              onPress={() => void addPhoto("detail")}
              variant="secondary"
            >
              Add detail photo
            </BetaButton>
          </View>
        </View>
        <DetailPanel
          rows={[
            ["Photos", `${currentItem.photos.length} attached`],
            [
              "Publish readiness",
              getPublishCheck(currentItem).isValid
                ? "Ready"
                : getPublishCheck(currentItem).missing.join(", "),
            ],
          ]}
          title="Media and readiness"
        />
        {syncMessage ? <BetaEmptyState message={syncMessage} title="Sync status" /> : null}

        <BetaTextField
          label="Title"
          onChangeText={(title) => updateItem(currentItem.id, { title })}
          placeholder="1996 Chicago Bulls championship tee"
          value={currentItem.title}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {VINTAGE_CATEGORIES.map((category) => (
            <BetaChip
              key={category.value}
              label={category.label}
              onPress={() => updateItem(currentItem.id, { category: category.value })}
              selected={currentItem.category === category.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Size
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {SHIRT_SIZES.map((size) => (
            <BetaChip
              key={size.value}
              label={size.label}
              onPress={() => updateItem(currentItem.id, { size: size.value })}
              selected={currentItem.size === size.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Era
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {ITEM_ERAS.map((era) => (
            <BetaChip
              key={era}
              label={era}
              onPress={() => updateItem(currentItem.id, { era })}
              selected={currentItem.era === era}
            />
          ))}
        </View>

        <BetaTextField
          label="Tag"
          onChangeText={(tag) => updateItem(currentItem.id, { tag })}
          placeholder="Giant, Screen Stars, Brockum, unknown"
          value={currentItem.tag ?? ""}
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <BetaTextField
              label="Chest"
              onChangeText={(chest) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, chest, unit: "in" },
                })
              }
              placeholder="23 in"
              value={currentItem.measurements.chest ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BetaTextField
              label="Length"
              onChangeText={(length) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, length, unit: "in" },
                })
              }
              placeholder="29 in"
              value={currentItem.measurements.length ?? ""}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <BetaTextField
              keyboardType="numeric"
              label="Value min"
              onChangeText={(value) =>
                updateItem(currentItem.id, {
                  estimatedValue: {
                    ...currentItem.estimatedValue,
                    currency: "USD",
                    min: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                  },
                })
              }
              placeholder="120"
              value={currentItem.estimatedValue.min?.toString() ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BetaTextField
              keyboardType="numeric"
              label="Value max"
              onChangeText={(value) =>
                updateItem(currentItem.id, {
                  estimatedValue: {
                    ...currentItem.estimatedValue,
                    currency: "USD",
                    max: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                  },
                })
              }
              placeholder="220"
              value={currentItem.estimatedValue.max?.toString() ?? ""}
            />
          </View>
        </View>
        <BetaTextField
          label="Trade notes"
          multiline
          numberOfLines={4}
          onChangeText={(tradeNotes) => updateItem(currentItem.id, { tradeNotes })}
          placeholder="What would make you move this piece?"
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={currentItem.tradeNotes ?? ""}
        />
        <BetaButton accessibilityLabel="Done editing item" onPress={onBack}>
          Done
        </BetaButton>
        <BetaButton
          accessibilityLabel="Save item draft live"
          loading={isSyncing}
          onPress={() => void saveDraftLive()}
          variant="secondary"
        >
          Save draft live
        </BetaButton>
      </ScrollView>
    </BetaScreen>
  );
}

function WishlistDetail({
  item,
  onBack,
  onEdit,
}: {
  item: WishlistItem | undefined;
  onBack: () => void;
  onEdit: (itemId: string) => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const { archiveWishlistItem, upsertWishlistItemFromServer } = useWishlistState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | undefined>();

  if (!item) {
    return <MissingRecord title="Wishlist item not found" onBack={onBack} />;
  }

  const currentItem = item;

  async function saveWantLive() {
    setIsSyncing(true);
    setSyncMessage(undefined);

    try {
      const response = isLocalRecordId(currentItem.id)
        ? await api.publishWishlistItem(currentItem)
        : await api.updateWishlistItem(currentItem.id, currentItem);
      upsertWishlistItemFromServer(
        response.wishlistItem,
        isLocalRecordId(currentItem.id) ? currentItem.id : undefined,
      );
      setSyncMessage("Want saved live.");
    } catch {
      setSyncMessage("Live sync unavailable. Local want is still saved on this phone.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleArchiveWant() {
    archiveWishlistItem(currentItem.id);
    if (!isLocalRecordId(currentItem.id)) {
      try {
        await api.updateWishlistItem(currentItem.id, { isArchived: true });
      } catch {
        // Local archive remains authoritative for the iPhone beta.
      }
    }
    onBack();
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to wishlist" onPress={onBack} variant="ghost">
          Back to wishlist
        </BetaButton>
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>
            {item.isGrail
              ? "GRAIL"
              : `${wishlistPriorityLabels[item.priority].toUpperCase()} PRIORITY`}
          </BetaKicker>
          <BetaTitle size={34}>{item.title || "Untitled want"}</BetaTitle>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {item.category ? categoryLabels[item.category] : "No category"} -{" "}
            {item.size ? sizeLabels[item.size] : "Any size"}
          </Text>
        </View>

        <DetailPanel
          rows={[
            ["Match type", wishlistMatchPreferenceLabels[item.matchPreference]],
            ["Preferred era", item.preferredEra || "Any"],
            ["Preferred tag", item.preferredTag || "Any"],
            [
              "Preferred condition",
              item.preferredCondition ? conditionLabels[item.preferredCondition] : "Flexible",
            ],
            ["Visibility", wishlistVisibilityLabels[item.visibility]],
            ["Archived", item.isArchived ? "Yes" : "No"],
          ]}
          title="Wishlist details"
        />
        {item.notes ? <DetailPanel rows={[["Collector note", item.notes]]} title="Notes" /> : null}
        <DetailPanel
          rows={[
            ["Live record", isLocalRecordId(item.id) ? "Not yet synced" : "Synced ID"],
            ["Minimum fields", item.title.trim().length >= 3 ? "Ready" : "Needs title"],
            ["Visibility", wishlistVisibilityLabels[item.visibility]],
          ]}
          title="Readiness"
        />
        {syncMessage ? <BetaEmptyState message={syncMessage} title="Sync status" /> : null}

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton accessibilityLabel="Edit wishlist item" onPress={() => onEdit(item.id)}>
            Edit want
          </BetaButton>
          <BetaButton
            accessibilityLabel="Save want live"
            loading={isSyncing}
            onPress={() => void saveWantLive()}
            variant="black"
          >
            Save want live
          </BetaButton>
          <BetaButton
            accessibilityLabel="Archive wishlist item"
            onPress={() => void handleArchiveWant()}
            variant="secondary"
          >
            Archive want
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

function WishlistEdit({ item, onBack }: { item: WishlistItem | undefined; onBack: () => void }) {
  const theme = beta;
  const api = useApiClient();
  const { updateWishlistItem, upsertWishlistItemFromServer } = useWishlistState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | undefined>();

  if (!item) {
    return <MissingRecord title="Wishlist item not found" onBack={onBack} />;
  }
  const currentItem = item;

  function updateGrail(isGrail: boolean) {
    const result = updateWishlistItem(currentItem.id, { isGrail });
    if (!result.ok) {
      Alert.alert("Grail limit reached", result.message);
    }
  }

  async function saveWantLive() {
    setIsSyncing(true);
    setSyncMessage(undefined);

    try {
      const response = isLocalRecordId(currentItem.id)
        ? await api.publishWishlistItem(currentItem)
        : await api.updateWishlistItem(currentItem.id, currentItem);
      upsertWishlistItemFromServer(
        response.wishlistItem,
        isLocalRecordId(currentItem.id) ? currentItem.id : undefined,
      );
      setSyncMessage("Want saved live.");
    } catch {
      setSyncMessage("Live sync unavailable. Local edits are still saved on this phone.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to wishlist detail" onPress={onBack} variant="ghost">
          Back to want
        </BetaButton>
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>WISH BUILDER</BetaKicker>
          <BetaTitle>Define the hunt.</BetaTitle>
        </View>

        <BetaTextField
          label="Wanted item"
          onChangeText={(title) => updateWishlistItem(item.id, { title })}
          placeholder="Mosquitohead Soundgarden"
          value={item.title}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {VINTAGE_CATEGORIES.map((category) => (
            <BetaChip
              key={category.value}
              label={category.label}
              onPress={() => updateWishlistItem(item.id, { category: category.value })}
              selected={item.category === category.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Size
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {SHIRT_SIZES.map((size) => (
            <BetaChip
              key={size.value}
              label={size.label}
              onPress={() => updateWishlistItem(item.id, { size: size.value })}
              selected={item.size === size.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Preferred era
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {ITEM_ERAS.map((era) => (
            <BetaChip
              key={era}
              label={era}
              onPress={() => updateWishlistItem(item.id, { preferredEra: era })}
              selected={item.preferredEra === era}
            />
          ))}
        </View>

        <BetaTextField
          label="Preferred tag"
          onChangeText={(preferredTag) => updateWishlistItem(item.id, { preferredTag })}
          placeholder="Giant, Brockum, Screen Stars, any"
          value={item.preferredTag ?? ""}
        />

        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderColor: item.isGrail ? theme.colors.accent : theme.colors.border,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            padding: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
              Mark as Grail
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              Grails are limited and become the strongest demand signal later.
            </Text>
          </View>
          <Switch
            onValueChange={updateGrail}
            thumbColor={item.isGrail ? theme.colors.accent : theme.colors.textSecondary}
            value={item.isGrail}
          />
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Preferred condition
        </Text>
        {ITEM_CONDITIONS.map((condition) => (
          <BetaChoice
            description={condition.description}
            key={condition.value}
            label={condition.label}
            onPress={() => updateWishlistItem(item.id, { preferredCondition: condition.value })}
            selected={item.preferredCondition === condition.value}
          />
        ))}

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Priority
        </Text>
        {WISHLIST_PRIORITIES.map((priority) => (
          <BetaChoice
            description={priority.description}
            key={priority.value}
            label={priority.label}
            onPress={() => updateWishlistItem(item.id, { priority: priority.value })}
            selected={item.priority === priority.value}
          />
        ))}

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Match preference
        </Text>
        {WISHLIST_MATCH_PREFERENCES.map((preference) => (
          <BetaChoice
            description={preference.description}
            key={preference.value}
            label={preference.label}
            onPress={() => updateWishlistItem(item.id, { matchPreference: preference.value })}
            selected={item.matchPreference === preference.value}
          />
        ))}

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Visibility
        </Text>
        {WISHLIST_VISIBILITY_OPTIONS.map((visibility) => (
          <BetaChoice
            description={visibility.description}
            key={visibility.value}
            label={visibility.label}
            onPress={() => updateWishlistItem(item.id, { visibility: visibility.value })}
            selected={item.visibility === visibility.value}
          />
        ))}

        <BetaTextField
          label="Notes"
          multiline
          numberOfLines={4}
          onChangeText={(notes) => updateWishlistItem(item.id, { notes })}
          placeholder="What details matter?"
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={item.notes ?? ""}
        />
        {syncMessage ? <BetaEmptyState message={syncMessage} title="Sync status" /> : null}
        <BetaButton accessibilityLabel="Done editing wishlist item" onPress={onBack}>
          Done
        </BetaButton>
        <BetaButton
          accessibilityLabel="Save wishlist item live"
          loading={isSyncing}
          onPress={() => void saveWantLive()}
          variant="secondary"
        >
          Save want live
        </BetaButton>
      </ScrollView>
    </BetaScreen>
  );
}

function DetailPanel({ rows, title }: { rows: [string, string][]; title: string }) {
  const theme = beta;

  return (
    <BetaPanel>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
        {title}
      </Text>
      {rows.map(([label, value]) => (
        <View
          key={label}
          style={{ flexDirection: "row", gap: theme.spacing.md, justifyContent: "space-between" }}
        >
          <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>{label}</Text>
          <Text
            style={{
              color: theme.colors.textPrimary,
              flex: 1,
              fontWeight: "700",
              textAlign: "right",
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </BetaPanel>
  );
}

function MissingRecord({ onBack, title }: { onBack: () => void; title: string }) {
  const theme = beta;

  return (
    <BetaScreen>
      <View style={{ gap: theme.spacing.md }}>
        <BetaTitle size={24}>{title}</BetaTitle>
        <BetaButton accessibilityLabel="Back" onPress={onBack}>
          Back
        </BetaButton>
      </View>
    </BetaScreen>
  );
}

function isLocalRecordId(id: string): boolean {
  return id.startsWith("item_") || id.startsWith("wish_") || id.startsWith("local_");
}

async function pickItemPhoto(
  kind: ItemPhoto["kind"],
  sortOrder: number,
): Promise<ItemPhoto | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Photo permission needed", "Allow photo access to attach item photos.");
    return undefined;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 5],
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.82,
  });

  if (result.canceled || result.assets.length === 0) {
    return undefined;
  }

  const asset = result.assets[0];
  if (!asset?.uri) {
    return undefined;
  }

  return {
    createdAt: new Date().toISOString(),
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    sortOrder,
    uri: asset.uri,
  };
}

function TradesTab({
  localTrades,
  route,
  setLocalTrades,
  setRoute,
}: {
  localTrades: LocalTradeProposal[];
  route: TradeRoute;
  setLocalTrades: (updater: (current: LocalTradeProposal[]) => LocalTradeProposal[]) => void;
  setRoute: (route: TradeRoute) => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const apiRef = useRef(api);
  const { items } = useCollectionState();
  const { activeItems } = useWishlistState();
  const [draftNotes, setDraftNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [source, setSource] = useState<"api" | "local">("local");
  const offeredItem = items.find((item) => item.status === "tradeable") ?? items[0];
  const requestedItem = activeItems.find((item) => item.isGrail) ?? activeItems[0];
  const selectedLiveTrade = liveTrades.find((trade) => trade.id === route.tradeId);
  const selectedLocalTrade = localTrades.find((trade) => trade.id === route.tradeId);
  const localSummary = getLocalTradeSummary(localTrades);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refreshTrades = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await apiRef.current.listTrades();
      setLiveTrades(response.trades);
      setSource("api");
    } catch {
      setError("Live trades are unavailable. Local proposal workflow is active.");
      setSource("local");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTrades();
  }, [refreshTrades]);

  function createLocalProposal() {
    if (!offeredItem || !requestedItem) {
      Alert.alert(
        "Trade needs two sides",
        "Add one archive item and one want before composing a proposal.",
      );
      return;
    }

    const now = new Date().toISOString();
    const proposal: LocalTradeProposal = {
      counterparty: requestedItem.isGrail ? "Grail match collector" : "Matching collector",
      createdAt: now,
      id: `local_trade_${Date.now()}`,
      notes:
        draftNotes.trim() ||
        "Condition, measurements, and shipping details should be confirmed before sending.",
      offeredItemId: offeredItem.id,
      requestedSubtitle: [
        requestedItem.category ? categoryLabels[requestedItem.category] : undefined,
        requestedItem.size ? sizeLabels[requestedItem.size] : undefined,
        requestedItem.isGrail ? "grail" : wishlistPriorityLabels[requestedItem.priority],
      ]
        .filter(Boolean)
        .join(" / "),
      requestedTitle: requestedItem.title || "Untitled wanted item",
      status: "pending",
      updatedAt: now,
    };

    setLocalTrades((current) => [proposal, ...current]);
    setDraftNotes("");
    setRoute({ mode: "detail", tradeId: proposal.id });
  }

  function updateLocalTradeStatus(tradeId: string, status: TradeStatus) {
    setLocalTrades((current) =>
      current.map((trade) =>
        trade.id === tradeId ? { ...trade, status, updatedAt: new Date().toISOString() } : trade,
      ),
    );
  }

  if (route.mode === "compose") {
    return (
      <BetaScreen>
        <ScrollView
          contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
        >
          <BetaButton
            accessibilityLabel="Back to trades"
            onPress={() => setRoute({ mode: "list", tradeId: undefined })}
            variant="ghost"
          >
            Back to trades
          </BetaButton>

          <View style={{ gap: theme.spacing.sm }}>
            <BetaKicker>COMPOSE TRADE</BetaKicker>
            <BetaTitle>Build a structured proposal.</BetaTitle>
            <BetaBody>
              This beta composer uses your first tradeable item and strongest want as the two sides.
            </BetaBody>
          </View>

          <TradeObjectPanel
            emptyMessage="Publish one archive item before composing a trade."
            item={offeredItem}
            label="Your offer"
          />
          <TradeObjectPanel
            emptyMessage="Add a want before composing a trade."
            item={requestedItem}
            label="Target"
          />

          <BetaTextField
            label="Proposal note"
            multiline
            numberOfLines={4}
            onChangeText={setDraftNotes}
            placeholder="Explain condition, fit, what you want confirmed, and why the swap makes sense."
            style={{ minHeight: 104, textAlignVertical: "top" }}
            value={draftNotes}
          />

          <BetaButton
            accessibilityLabel="Create local trade proposal"
            disabled={!offeredItem || !requestedItem}
            onPress={createLocalProposal}
            variant="black"
          >
            Create proposal
          </BetaButton>
        </ScrollView>
      </BetaScreen>
    );
  }

  if (route.mode === "detail") {
    if (selectedLiveTrade) {
      return (
        <TradeDetail
          onBack={() => setRoute({ mode: "list", tradeId: undefined })}
          trade={selectedLiveTrade}
        />
      );
    }

    if (selectedLocalTrade) {
      return (
        <LocalTradeDetail
          getItem={(itemId) => items.find((item) => item.id === itemId)}
          onBack={() => setRoute({ mode: "list", tradeId: undefined })}
          onUpdateStatus={(status) => updateLocalTradeStatus(selectedLocalTrade.id, status)}
          trade={selectedLocalTrade}
        />
      );
    }

    return (
      <MissingRecord
        onBack={() => setRoute({ mode: "list", tradeId: undefined })}
        title="Trade not found"
      />
    );
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>TRADES</BetaKicker>
          <BetaTitle>Review a structured swap.</BetaTitle>
          <BetaBody>
            Trades should feel balanced, documented, and deliberate before collectors enter a
            conversation.
          </BetaBody>
        </View>

        <BetaStatPanel
          stats={[
            { label: "Live", value: liveTrades.length },
            { label: "Local", value: localTrades.length },
            { label: "Active", value: localSummary.active },
          ]}
        />

        {error ? <BetaEmptyState message={error} title="Trade mode" tone="warning" /> : null}
        {isLoading ? (
          <BetaEmptyState
            message="Checking the live trade API before falling back to local proposals."
            title="Loading trades"
          />
        ) : null}

        <BetaPanel tone="black">
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 12, fontWeight: "900" }}>
            {source === "api" ? "LIVE TRADE FEED" : "LOCAL TRADE WORKFLOW"}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            Structured swaps are now interactive.
          </Text>
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 15, lineHeight: 22 }}>
            Compose a proposal, review both sides, and move local beta trades through pending,
            accepted, countered, cancelled, or completed.
          </Text>
        </BetaPanel>

        <BetaButton
          accessibilityLabel="Compose trade proposal"
          onPress={() => setRoute({ mode: "compose", tradeId: undefined })}
        >
          Compose trade
        </BetaButton>

        {liveTrades.length === 0 && localTrades.length === 0 && !isLoading ? (
          <BetaEmptyState
            message="Compose a local proposal after adding one archive item and one want."
            title="No trades yet"
          />
        ) : null}

        <View style={{ gap: theme.spacing.md }}>
          {liveTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              onPress={() => setRoute({ mode: "detail", tradeId: trade.id })}
              subtitle={`${trade.proposerDisplayName} <> ${trade.counterpartyDisplayName}`}
              title={`${trade.proposerItem.title} for ${trade.counterpartyItem.title}`}
              status={trade.status}
              source="Live"
            />
          ))}
          {localTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              onPress={() => setRoute({ mode: "detail", tradeId: trade.id })}
              subtitle={trade.counterparty}
              title={trade.requestedTitle}
              status={trade.status}
              source="Local"
            />
          ))}
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

function TradeRow({
  onPress,
  source,
  status,
  subtitle,
  title,
}: {
  onPress: () => void;
  source: string;
  status: TradeStatus;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open ${title} trade`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: status === "accepted" ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.sm,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.lg,
      })}
    >
      <View style={{ flexDirection: "row", gap: beta.spacing.md, justifyContent: "space-between" }}>
        <BetaKicker>{source.toUpperCase()}</BetaKicker>
        <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
          {tradeStatusLabels[status]}
        </Text>
      </View>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
    </Pressable>
  );
}

function TradeDetail({ onBack, trade }: { onBack: () => void; trade: Trade }) {
  const theme = beta;

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to trades" onPress={onBack} variant="ghost">
          Back to trades
        </BetaButton>
        <BetaPanel tone="black">
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 12, fontWeight: "900" }}>
            LIVE TRADE
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            {tradeStatusLabels[trade.status]}
          </Text>
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 15, lineHeight: 22 }}>
            {trade.proposerDisplayName} and {trade.counterpartyDisplayName}
          </Text>
        </BetaPanel>
        <TradeObjectPanel item={trade.proposerItem} label="Proposer item" />
        <TradeObjectPanel item={trade.counterpartyItem} label="Counterparty item" />
        <DetailPanel
          rows={[
            ["Your role", trade.viewerRole],
            ["Proposer shipping", trade.proposerShipping.status],
            ["Counterparty shipping", trade.counterpartyShipping.status],
            ["Updated", new Date(trade.updatedAt).toLocaleDateString()],
          ]}
          title="Live trade details"
        />
      </ScrollView>
    </BetaScreen>
  );
}

function LocalTradeDetail({
  getItem,
  onBack,
  onUpdateStatus,
  trade,
}: {
  getItem: (itemId: string | undefined) => TradeableItem | undefined;
  onBack: () => void;
  onUpdateStatus: (status: TradeStatus) => void;
  trade: LocalTradeProposal;
}) {
  const theme = beta;
  const offeredItem = getItem(trade.offeredItemId);

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BetaButton accessibilityLabel="Back to trades" onPress={onBack} variant="ghost">
          Back to trades
        </BetaButton>
        <BetaPanel tone="black">
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 12, fontWeight: "900" }}>
            LOCAL PROPOSAL
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            {tradeStatusLabels[trade.status]}
          </Text>
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 15, lineHeight: 22 }}>
            {trade.counterparty}
          </Text>
        </BetaPanel>
        <TradeObjectPanel
          emptyMessage="The offered archive item is no longer available."
          item={offeredItem}
          label="Your offer"
        />
        <BetaPanel>
          <BetaKicker>TARGET</BetaKicker>
          <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
            {trade.requestedTitle}
          </Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 15, lineHeight: 22 }}>
            {trade.requestedSubtitle || "Wanted item"}
          </Text>
        </BetaPanel>
        <DetailPanel
          rows={[
            ["Notes", trade.notes],
            ["Created", new Date(trade.createdAt).toLocaleDateString()],
            ["Updated", new Date(trade.updatedAt).toLocaleDateString()],
            ["Next step", getTradeNextStep(trade.status)],
          ]}
          title="Proposal checkpoint"
        />
        <View style={{ gap: theme.spacing.md }}>
          <BetaButton
            accessibilityLabel="Mark proposal accepted"
            disabled={trade.status === "accepted"}
            onPress={() => onUpdateStatus("accepted")}
            variant="black"
          >
            Mark accepted
          </BetaButton>
          <BetaButton
            accessibilityLabel="Mark proposal countered"
            disabled={trade.status === "countered"}
            onPress={() => onUpdateStatus("countered")}
            variant="secondary"
          >
            Mark countered
          </BetaButton>
          <BetaButton
            accessibilityLabel="Mark proposal completed"
            disabled={trade.status === "completed"}
            onPress={() => onUpdateStatus("completed")}
            variant="secondary"
          >
            Mark completed
          </BetaButton>
          <BetaButton
            accessibilityLabel="Cancel proposal"
            disabled={trade.status === "cancelled"}
            onPress={() => onUpdateStatus("cancelled")}
            variant="ghost"
          >
            Cancel proposal
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

function TradeObjectPanel({
  emptyMessage,
  item,
  label,
}: {
  emptyMessage?: string;
  item:
    | TradeableItem
    | WishlistItem
    | {
        category?: TradeableItem["category"];
        size?: TradeableItem["size"];
        status?: TradeableItem["status"];
        title: string;
      }
    | undefined;
  label: string;
}) {
  if (!item) {
    return emptyMessage ? (
      <BetaEmptyState message={emptyMessage} title={label} />
    ) : (
      <BetaEmptyState title={label} />
    );
  }

  const title = item.title || "Untitled record";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "Any size";
  const isWishlistItem = "isGrail" in item;
  const status = isWishlistItem
    ? item.isGrail
      ? "Grail want"
      : `${wishlistPriorityLabels[item.priority]} want`
    : item.status
      ? statusLabels[item.status]
      : "Trade item";

  return (
    <BetaPanel>
      <BetaKicker>{label.toUpperCase()}</BetaKicker>
      <View
        style={{
          alignItems: "center",
          aspectRatio: 1.35,
          backgroundColor: beta.colors.surfaceWarm,
          borderRadius: beta.radius.md,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
          Object image
        </Text>
      </View>
      <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 15 }}>
        {category} / {size} / {status}
      </Text>
    </BetaPanel>
  );
}

function getLocalTradeSummary(trades: LocalTradeProposal[]): { active: number; history: number } {
  return trades.reduce(
    (summary, trade) =>
      ["completed", "declined", "cancelled", "disputed"].includes(trade.status)
        ? { ...summary, history: summary.history + 1 }
        : { ...summary, active: summary.active + 1 },
    { active: 0, history: 0 },
  );
}

function getTradeNextStep(status: TradeStatus): string {
  switch (status) {
    case "pending":
      return "Confirm condition details in messages before accepting.";
    case "accepted":
      return "Collect shipping details and tracking from both sides.";
    case "countered":
      return "Review the counter offer and adjust the item side.";
    case "completed":
      return "Archive the trade and update collector reputation.";
    case "cancelled":
    case "declined":
      return "No action needed unless the collectors reopen terms.";
    case "disputed":
      return "Hold completion until support reviews the issue.";
  }
}
