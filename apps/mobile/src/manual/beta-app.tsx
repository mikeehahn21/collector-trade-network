import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StatusBar, Switch, Text, View } from "react-native";
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
import type { TradeableItem, WishlistItem } from "@ctn/types";

import {
  categoryLabels,
  conditionLabels,
  sizeLabels,
  statusLabels,
  tradePreferenceLabels,
  visibilityLabels,
} from "@/lib/item-display";
import { getMockAiListingSuggestions } from "@/lib/mock-ai-listing";
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
import { CollectionStateProvider, useCollectionState } from "@/state/collection-state";
import { OnboardingStateProvider } from "@/state/onboarding-state";
import { WishlistStateProvider, useWishlistState } from "@/state/wishlist-state";
import { ThemeProvider } from "@/theme/theme-provider";

type Tab = "home" | "inventory" | "wishlist" | "messages" | "trades";
type ManualRoute = { mode: "list" | "detail" | "edit"; itemId: string | undefined };
type MessageRoute = { conversationId: string | undefined; mode: "list" | "detail" };
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
  contextType: "item" | "trade";
  id: string;
  messages: LocalMessage[];
  participant: string;
  unreadCount: number;
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
      <ThemeProvider>
        <OnboardingStateProvider>
          <CollectionStateProvider>
            <WishlistStateProvider>
              <StatusBar barStyle="dark-content" />
              <BetaShell />
            </WishlistStateProvider>
          </CollectionStateProvider>
        </OnboardingStateProvider>
      </ThemeProvider>
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
        {tab === "trades" ? <TradesTab /> : null}
      </View>
      <BetaTabBar active={tab} onChange={openTab} tabs={tabs} />
    </View>
  );
}

function HomeTab({ setTab }: { setTab: (tab: Tab) => void }) {
  const theme = beta;
  const { items, summary: collectionSummary } = useCollectionState();
  const { activeItems, summary: wishlistSummary } = useWishlistState();
  const tradeableItems = useMemo(
    () => items.filter((item) => item.status === "tradeable"),
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
  const [draft, setDraft] = useState("");
  const conversation =
    route.conversationId === undefined
      ? undefined
      : localConversations.find((item) => item.id === route.conversationId);

  if (route.mode === "detail") {
    return (
      <ConversationDetail
        conversation={conversation}
        draft={draft}
        onBack={() => {
          setDraft("");
          setRoute({ conversationId: undefined, mode: "list" });
        }}
        onChangeDraft={setDraft}
        onSend={() => {
          Alert.alert(
            "Local message draft",
            "This beta screen is visual-only. Live sending comes after the API wiring pass.",
          );
          setDraft("");
        }}
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

        {localConversations.map((conversationItem) => (
          <ConversationRow
            conversation={conversationItem}
            key={conversationItem.id}
            onPress={() => setRoute({ conversationId: conversationItem.id, mode: "detail" })}
          />
        ))}
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

function ConversationDetail({
  conversation,
  draft,
  onBack,
  onChangeDraft,
  onSend,
}: {
  conversation: LocalConversation | undefined;
  draft: string;
  onBack: () => void;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
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
              color:
                conversation.contextType === "trade" ? beta.colors.surface : beta.colors.orange,
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {conversation.contextType.toUpperCase()} CONVERSATION
          </Text>
          <Text
            style={{
              color: conversation.contextType === "trade" ? beta.colors.surface : beta.colors.ink,
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
        </BetaPanel>

        <View style={{ gap: theme.spacing.md }}>
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </View>

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
          accessibilityLabel="Send local message"
          disabled={!draft.trim()}
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
      ? beta.colors.ink
      : beta.colors.surface;
  const textColor = message.isMine && !isSystem ? beta.colors.surface : beta.colors.ink;
  const metaColor = message.isMine && !isSystem ? beta.colors.orangeSoft : beta.colors.inkMuted;

  return (
    <View style={{ alignItems }}>
      <View
        style={{
          backgroundColor,
          borderColor: isSystem || !message.isMine ? beta.colors.border : beta.colors.ink,
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
  const { archiveItem, publishItem } = useCollectionState();

  if (!item) {
    return <MissingRecord title="Item not found" onBack={onBack} />;
  }

  const measurements = [
    item.measurements.chest ? `Chest ${item.measurements.chest}` : undefined,
    item.measurements.length ? `Length ${item.measurements.length}` : undefined,
    item.measurements.shoulder ? `Shoulder ${item.measurements.shoulder}` : undefined,
    item.measurements.sleeve ? `Sleeve ${item.measurements.sleeve}` : undefined,
  ]
    .filter(Boolean)
    .join(" - ");
  const value =
    item.estimatedValue.min || item.estimatedValue.max
      ? `$${item.estimatedValue.min ?? "?"} - $${item.estimatedValue.max ?? "?"}`
      : "Not estimated";

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
          }}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: "800" }}>
            {item.photos.length > 0 ? `${item.photos.length} photos` : "No photos yet"}
          </Text>
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

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton accessibilityLabel="Edit item" onPress={() => onEdit(item.id)}>
            Edit item
          </BetaButton>
          <BetaButton
            accessibilityLabel="Publish item"
            disabled={item.status === "tradeable"}
            onPress={() => publishItem(item.id)}
            variant="secondary"
          >
            Publish as Tradeable
          </BetaButton>
          <BetaButton
            accessibilityLabel="Archive item"
            onPress={() => {
              archiveItem(item.id);
              onBack();
            }}
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
  const { updateItem } = useCollectionState();

  if (!item) {
    return <MissingRecord title="Item not found" onBack={onBack} />;
  }
  const currentItem = item;

  function applyAiSuggestions() {
    const suggestions = getMockAiListingSuggestions(currentItem);
    updateItem(currentItem.id, { aiSuggestions: suggestions });
    Alert.alert("AI suggestions ready", "Suggestions were added for review.");
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
  const { archiveWishlistItem } = useWishlistState();

  if (!item) {
    return <MissingRecord title="Wishlist item not found" onBack={onBack} />;
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

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton accessibilityLabel="Edit wishlist item" onPress={() => onEdit(item.id)}>
            Edit want
          </BetaButton>
          <BetaButton
            accessibilityLabel="Archive wishlist item"
            onPress={() => {
              archiveWishlistItem(item.id);
              onBack();
            }}
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
  const { updateWishlistItem } = useWishlistState();

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
        <BetaButton accessibilityLabel="Done editing wishlist item" onPress={onBack}>
          Done
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

function TradesTab() {
  const theme = beta;
  const { items } = useCollectionState();
  const { activeItems } = useWishlistState();
  const offeredItem = items.find((item) => item.status === "tradeable") ?? items[0];
  const requestedItem = activeItems.find((item) => item.isGrail) ?? activeItems[0];

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

        <BetaPanel tone="black">
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 12, fontWeight: "900" }}>
            TRADE REVIEW
          </Text>
          <Text style={{ color: theme.colors.surface, fontSize: 24, fontWeight: "900" }}>
            One-for-one proposal
          </Text>
          <Text style={{ color: theme.colors.orangeSoft, fontSize: 15, lineHeight: 22 }}>
            Condition, sizing, and notes matter more than price. Cash balancing can come later.
          </Text>
        </BetaPanel>

        <View style={{ gap: theme.spacing.md }}>
          <TradeObjectPanel
            emptyMessage="Add and publish a collection item to make this side real."
            item={offeredItem}
            label="Your offer"
          />
          <View
            style={{
              alignSelf: "center",
              backgroundColor: theme.colors.orange,
              borderRadius: 999,
              height: 4,
              width: 96,
            }}
          />
          <TradeObjectPanel
            emptyMessage="Add a want or grail to preview the requested side."
            item={requestedItem}
            label="Their item"
          />
        </View>

        <DetailPanel
          rows={[
            ["Status", "Draft review"],
            ["Conversation", "Message collector before sending"],
            ["Shipping", "Both sides confirm tracking later"],
            ["Trust rule", "Trade stays contextual and item-bound"],
          ]}
          title="Terms checkpoint"
        />

        <View style={{ gap: theme.spacing.md }}>
          <BetaButton
            accessibilityLabel="Open trade message concept"
            onPress={() =>
              Alert.alert(
                "Trade messaging preview",
                "Messages are now available as a local beta tab. Live trade conversations come after API wiring.",
              )
            }
            variant="black"
          >
            Message collector
          </BetaButton>
          <BetaButton
            accessibilityLabel="Review trade concept"
            onPress={() =>
              Alert.alert(
                "Review trade",
                "This is the visual trade-review concept. Sending real proposals stays disabled until backend wiring is restored.",
              )
            }
            variant="secondary"
          >
            Review trade
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
  emptyMessage: string;
  item: TradeableItem | WishlistItem | undefined;
  label: string;
}) {
  if (!item) {
    return <BetaEmptyState message={emptyMessage} title={label} />;
  }

  const title = item.title || "Untitled record";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "Any size";
  const isWishlistItem = "isGrail" in item;
  const status = isWishlistItem
    ? item.isGrail
      ? "Grail want"
      : `${wishlistPriorityLabels[item.priority]} want`
    : statusLabels[item.status];

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
