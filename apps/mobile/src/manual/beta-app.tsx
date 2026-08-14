import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from "react-native";
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
  CollectionSummary,
  Conversation,
  ConversationMessage,
  ItemPhoto,
  TradeItemSummary,
  RecommendationSummary,
  Trade,
  TradeRecommendation,
  TradeStatus,
  TradeableItem,
  UserProfile,
  WishlistItem,
  WishlistSummary,
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
  BetaLoopingVideo,
  BetaPanel,
  BetaScreen,
  BetaStatPanel,
  BetaTabBar,
  BetaTextField,
  BetaTitle,
} from "@/manual/beta-ui";
import {
  wishlistMatchPreferenceLabels,
  wishlistPriorityLabels,
  wishlistVisibilityLabels,
} from "@/lib/wishlist-display";
import { useApiClient } from "@/api/use-api-client";
import { MobileAuthProvider } from "@/auth/clerk-provider";
import { useAuthSession } from "@/auth/use-auth-session";
import { CollectionStateProvider, useCollectionState } from "@/state/collection-state";
import { OnboardingStateProvider } from "@/state/onboarding-state";
import { useRecommendations } from "@/state/recommendation-state";
import { UserProfileProvider, useUserProfile } from "@/state/user-profile-state";
import { WishlistStateProvider, useWishlistState } from "@/state/wishlist-state";
import { DataSyncBootstrap } from "@/sync/data-sync-bootstrap";
import { ThemeProvider } from "@/theme/theme-provider";
import konnesorSymbol from "../../assets/brand/konnesor-symbol.png";
import konnesorWordmark from "../../assets/brand/konnesor-wordmark.png";

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
type TradeComposeStep = "offer" | "target" | "terms" | "review";
type TradeProgressStep = "Proposed" | "Review" | "Counter" | "Ship" | "Complete";
type InventoryFilter = "all" | "tradeable" | "draft" | "needs_photos" | "ready";
type InventorySort = "recent" | "ready" | "value";
type WishlistFilter = "all" | "grails" | "high" | "medium" | "low";
type WishlistSort = "rank" | "grails" | "recent";
type MvpChecklistItem = {
  description: string;
  done: boolean;
  label: string;
};

const tabs: Array<{ icon: string; id: Tab; label: string }> = [
  { icon: "⌂", id: "home", label: "Home" },
  { icon: "▤", id: "inventory", label: "Archive" },
  { icon: "★", id: "wishlist", label: "Wishlist" },
  { icon: "○", id: "messages", label: "Messages" },
  { icon: "≋", id: "trades", label: "Trades" },
];

const itemPhotoKindLabels: Record<ItemPhoto["kind"], string> = {
  back: "Back",
  detail: "Detail",
  flaw: "Flaw",
  front: "Front",
  tag: "Tag",
};

const tradeComposeSteps: Array<{ id: TradeComposeStep; label: string }> = [
  { id: "offer", label: "Offer" },
  { id: "target", label: "Target" },
  { id: "terms", label: "Terms" },
  { id: "review", label: "Review" },
];

const tradeProgressSteps: TradeProgressStep[] = [
  "Proposed",
  "Review",
  "Counter",
  "Ship",
  "Complete",
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
  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.92)).current;
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

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(introOpacity, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(introScale, {
          duration: 520,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1600),
      Animated.timing(introOpacity, {
        duration: 360,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowIntro(false);
      }
    });

    return () => animation.stop();
  }, [introOpacity, introScale]);

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

  if (showIntro) {
    return <KonnesorIntro opacity={introOpacity} scale={introScale} />;
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

function KonnesorIntro({ opacity, scale }: { opacity: Animated.Value; scale: Animated.Value }) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: beta.colors.background,
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: beta.spacing.xl,
      }}
    >
      <Animated.View
        style={{
          alignItems: "center",
          gap: beta.spacing.lg,
          opacity,
          transform: [{ scale }],
          width: "100%",
        }}
      >
        <Image
          accessibilityLabel="Konnesor intro logo"
          resizeMode="contain"
          source={konnesorWordmark}
          style={{ height: 92, width: "100%" }}
        />
        <View
          style={{
            backgroundColor: beta.colors.surface,
            borderRadius: 999,
            height: 3,
            overflow: "hidden",
            width: 132,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: beta.colors.orange,
              borderRadius: 999,
              height: 3,
              opacity,
              transform: [{ scaleX: scale }],
              width: 132,
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function HomeTab({ setTab }: { setTab: (tab: Tab) => void }) {
  const theme = beta;
  const auth = useAuthSession();
  const { items, summary: collectionSummary } = useCollectionState();
  const { activeItems, summary: wishlistSummary } = useWishlistState();
  const { isLoading: isProfileLoading, profile } = useUserProfile();
  const [showProfile, setShowProfile] = useState(false);
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
  const photoReadyCount = useMemo(
    () => items.filter((item) => item.photos.length >= 2).length,
    [items],
  );
  const mvpChecklist = useMemo(
    () =>
      buildMvpChecklist({
        auth,
        collectionSummary,
        photoReadyCount,
        publishReadyCount,
        recommendationCount: recommendationSummary.total,
        wishlistSummary,
      }),
    [
      auth,
      collectionSummary,
      photoReadyCount,
      publishReadyCount,
      recommendationSummary.total,
      wishlistSummary,
    ],
  );

  if (showProfile) {
    return (
      <CollectorProfilePanel
        auth={auth}
        collectionSummary={collectionSummary}
        onBack={() => setShowProfile(false)}
        onOpenTab={(nextTab) => {
          setShowProfile(false);
          setTab(nextTab);
        }}
        photoReadyCount={photoReadyCount}
        profile={profile}
        publishReadyCount={publishReadyCount}
        wishlistSummary={wishlistSummary}
        checklist={mvpChecklist}
      />
    );
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}
      >
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Image
            accessibilityLabel="Konnesor logo"
            resizeMode="contain"
            source={konnesorWordmark}
            style={{ height: 48, width: 260 }}
          />
          <Pressable
            accessibilityLabel="Open collector profile"
            accessibilityRole="button"
            onPress={() => setShowProfile(true)}
            style={({ pressed }) => ({
              alignItems: "center",
              borderColor: theme.colors.border,
              borderRadius: 999,
              borderWidth: 1,
              height: 36,
              justifyContent: "center",
              marginLeft: "auto",
              marginRight: theme.spacing.sm,
              opacity: pressed ? 0.82 : 1,
              width: 36,
            })}
          >
            <Image
              accessibilityLabel="Konnesor symbol"
              resizeMode="contain"
              source={konnesorSymbol}
              style={{ height: 28, width: 28 }}
            />
          </Pressable>
        </View>

        <View style={{ gap: 5 }}>
          <Text
            style={{ color: theme.colors.ink, fontSize: 26, fontWeight: "900", lineHeight: 30 }}
          >
            Welcome back,{"\n"}Collector.
          </Text>
          <Text style={{ color: theme.colors.inkMuted, fontSize: 14 }}>
            Good finds. Better connections.
          </Text>
        </View>

        <HomeTradeMatchCard
          matchPercent={94}
          onReview={() => setTab("trades")}
          tradeableItem={tradeableItems[0]}
          wishlistItem={activeItems[0]}
        />

        <BetaStatPanel
          stats={[
            { label: "Tradeable", value: collectionSummary.tradeableItems },
            { label: "Wishlist", value: wishlistSummary.activeItems },
            { label: "Grails", value: wishlistSummary.grailItems },
          ]}
        />

        <MvpLaunchPanel
          checklist={mvpChecklist}
          onOpenArchive={() => setTab("inventory")}
          onOpenMessages={() => setTab("messages")}
          onOpenTrades={() => setTab("trades")}
          onOpenWishlist={() => setTab("wishlist")}
        />

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

        <View style={{ gap: theme.spacing.sm }}>
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

function HomeTradeMatchCard({
  matchPercent,
  onReview,
  tradeableItem,
  wishlistItem,
}: {
  matchPercent: number;
  onReview: () => void;
  tradeableItem: TradeableItem | undefined;
  wishlistItem: WishlistItem | undefined;
}) {
  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>YOUR TRADE MATCH</BetaKicker>
        <Text
          style={{
            color: beta.colors.orange,
            fontSize: 44,
            fontWeight: "900",
            lineHeight: 50,
            textAlign: "center",
          }}
        >
          {matchPercent}%
        </Text>
        <Text
          style={{
            color: beta.colors.orange,
            fontSize: 14,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          MATCH
        </Text>
      </View>

      <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.sm }}>
        <HomeMatchImage item={tradeableItem} label="Your piece" />
        <View
          style={{
            alignItems: "center",
            backgroundColor: beta.colors.background,
            borderColor: beta.colors.orange,
            borderRadius: 999,
            borderWidth: 1,
            height: 40,
            justifyContent: "center",
            marginHorizontal: -4,
            width: 40,
            zIndex: 2,
          }}
        >
          <Text style={{ color: beta.colors.orange, fontSize: 22, fontWeight: "900" }}>↔</Text>
        </View>
        <HomeMatchImage item={wishlistItem} label="Their want" />
      </View>

      <View style={{ gap: beta.spacing.xs }}>
        <Text style={{ color: beta.colors.ink, fontSize: 13, fontWeight: "900" }}>
          These pieces match because:
        </Text>
        {["Similar era and theme", "Size compatible", "High grail alignment"].map((reason) => (
          <View
            key={reason}
            style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.xs }}
          >
            <View
              style={{
                backgroundColor: beta.colors.orange,
                borderRadius: 999,
                height: 7,
                width: 7,
              }}
            />
            <Text style={{ color: beta.colors.inkMuted, fontSize: 12 }}>{reason}</Text>
          </View>
        ))}
      </View>

      <BetaButton accessibilityLabel="Review trade match" onPress={onReview}>
        Review match
      </BetaButton>
    </BetaPanel>
  );
}

function HomeMatchImage({
  item,
  label,
}: {
  item: TradeableItem | WishlistItem | undefined;
  label: string;
}) {
  const photo = item && "photos" in item ? item.photos[0] : undefined;
  const itemTitle = item?.title || label;
  return (
    <View
      style={{
        alignItems: "center",
        aspectRatio: 0.78,
        backgroundColor: beta.colors.surfaceWarm,
        borderColor: beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        flex: 1,
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {photo ? (
        <Image
          accessibilityLabel={`${itemTitle} photo`}
          source={{ uri: photo.uri }}
          style={{ height: "100%", width: "100%" }}
        />
      ) : (
        <Text
          style={{
            color: beta.colors.inkMuted,
            fontSize: 12,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {itemTitle}
        </Text>
      )}
    </View>
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

function MvpLaunchPanel({
  checklist,
  onOpenArchive,
  onOpenMessages,
  onOpenTrades,
  onOpenWishlist,
}: {
  checklist: MvpChecklistItem[];
  onOpenArchive: () => void;
  onOpenMessages: () => void;
  onOpenTrades: () => void;
  onOpenWishlist: () => void;
}) {
  const completeCount = checklist.filter((item) => item.done).length;

  return (
    <BetaPanel tone="black">
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>MVP PATH</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
          {completeCount} of {checklist.length} launch checkpoints are covered.
        </Text>
        <BetaBody>
          Build one complete listing, rank one grail, compose one trade, and send one message to
          prove the core collector loop.
        </BetaBody>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        <MiniActionButton label="Archive" onPress={onOpenArchive} />
        <MiniActionButton label="Wishlist" onPress={onOpenWishlist} />
        <MiniActionButton label="Trades" onPress={onOpenTrades} />
        <MiniActionButton label="Messages" onPress={onOpenMessages} />
      </View>
    </BetaPanel>
  );
}

function MiniActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.orange,
        borderRadius: 999,
        borderWidth: 1,
        opacity: pressed ? 0.82 : 1,
        paddingHorizontal: beta.spacing.md,
        paddingVertical: beta.spacing.sm,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 13, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function MvpChecklistPanel({ checklist, title }: { checklist: MvpChecklistItem[]; title: string }) {
  return (
    <BetaPanel>
      <BetaKicker>PRODUCT READINESS</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>{title}</Text>
      <View style={{ gap: beta.spacing.sm }}>
        {checklist.map((item) => (
          <View
            key={item.label}
            style={{
              alignItems: "flex-start",
              borderColor: item.done ? beta.colors.orange : beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              flexDirection: "row",
              gap: beta.spacing.sm,
              padding: beta.spacing.md,
            }}
          >
            <Text
              style={{
                color: item.done ? beta.colors.orange : beta.colors.inkMuted,
                fontSize: 16,
                fontWeight: "900",
              }}
            >
              {item.done ? "✓" : "•"}
            </Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900" }}>
                {item.label}
              </Text>
              <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

function buildMvpChecklist({
  auth,
  collectionSummary,
  photoReadyCount,
  publishReadyCount,
  recommendationCount,
  wishlistSummary,
}: {
  auth: ReturnType<typeof useAuthSession>;
  collectionSummary: CollectionSummary;
  photoReadyCount: number;
  publishReadyCount: number;
  recommendationCount: number;
  wishlistSummary: WishlistSummary;
}): MvpChecklistItem[] {
  return [
    {
      description: auth.isLoaded
        ? "Account/session layer is available in this build."
        : "Waiting on account state.",
      done: auth.isLoaded && auth.isSignedIn,
      label: "Onboarding/account",
    },
    {
      description: `${collectionSummary.totalItems} active archive records, ${collectionSummary.tradeableItems} tradeable.`,
      done: collectionSummary.totalItems > 0,
      label: "Archive/listings",
    },
    {
      description: `${photoReadyCount} archive records have at least two photos attached.`,
      done: photoReadyCount > 0,
      label: "Photo upload/readiness",
    },
    {
      description: `${publishReadyCount} records pass required publish checks.`,
      done: publishReadyCount > 0,
      label: "Publish-ready item",
    },
    {
      description: `${wishlistSummary.activeItems} active wants, ${wishlistSummary.grailItems} grails.`,
      done: wishlistSummary.activeItems > 0,
      label: "Wishlist/grails",
    },
    {
      description: "Trade composer and local status controls are available from the Trades tab.",
      done: collectionSummary.tradeableItems > 0 && wishlistSummary.activeItems > 0,
      label: "Trade proposal flow",
    },
    {
      description: "Message threads support live API mode plus local beta fallback replies.",
      done: true,
      label: "Messages",
    },
    {
      description:
        recommendationCount > 0
          ? `${recommendationCount} recommendation signals loaded.`
          : "Local bundle, icon, splash, privacy text, and beta checks are in place.",
      done: true,
      label: "Device/TestFlight readiness",
    },
  ];
}

function CollectorProfilePanel({
  auth,
  checklist,
  collectionSummary,
  onBack,
  onOpenTab,
  photoReadyCount,
  profile,
  publishReadyCount,
  wishlistSummary,
}: {
  auth: ReturnType<typeof useAuthSession>;
  checklist: MvpChecklistItem[];
  collectionSummary: CollectionSummary;
  onBack: () => void;
  onOpenTab: (tab: Tab) => void;
  photoReadyCount: number;
  profile: UserProfile | undefined;
  publishReadyCount: number;
  wishlistSummary: WishlistSummary;
}) {
  const collectorName = profile?.displayName ?? "Collector";
  const email = auth.userEmail ?? "Local beta session";
  const readinessScore = Math.min(
    100,
    Math.round(
      (collectionSummary.tradeableItems > 0 ? 25 : 0) +
        (publishReadyCount > 0 ? 25 : 0) +
        (wishlistSummary.activeItems > 0 ? 25 : 0) +
        (photoReadyCount > 0 ? 25 : 0),
    ),
  );

  return (
    <BetaScreen>
      <ScrollView contentContainerStyle={{ gap: beta.spacing.lg, paddingBottom: beta.spacing.xl }}>
        <BetaButton accessibilityLabel="Back to home" onPress={onBack} variant="ghost">
          Back to home
        </BetaButton>

        <BetaPanel tone="black">
          <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.md }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: beta.colors.orange,
                borderRadius: 999,
                height: 58,
                justifyContent: "center",
                width: 58,
              }}
            >
              <Image
                accessibilityLabel="Konnesor symbol"
                resizeMode="cover"
                source={konnesorSymbol}
                style={{ borderRadius: 999, height: 58, width: 58 }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <BetaKicker>COLLECTOR PROFILE</BetaKicker>
              <Text style={{ color: beta.colors.ink, fontSize: 28, fontWeight: "900" }}>
                {collectorName}
              </Text>
              <Text style={{ color: beta.colors.inkMuted, fontSize: 13 }}>{email}</Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: beta.colors.orangeSoft,
              borderColor: beta.colors.orange,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              gap: beta.spacing.xs,
              padding: beta.spacing.md,
            }}
          >
            <Text style={{ color: beta.colors.orange, fontSize: 44, fontWeight: "900" }}>
              {readinessScore}%
            </Text>
            <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>
              Beta trade readiness
            </Text>
            <BetaBody>
              Add complete photos, publish-ready records, and active wants to raise this score.
            </BetaBody>
          </View>
        </BetaPanel>

        <BetaStatPanel
          stats={[
            { label: "Archive", value: collectionSummary.totalItems },
            { label: "Ready", value: publishReadyCount },
            { label: "Wants", value: wishlistSummary.activeItems },
          ]}
        />

        <BetaPanel>
          <BetaKicker>ACCOUNT MODE</BetaKicker>
          <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
            {auth.clerkEnabled ? "Live account" : "Local beta"}
          </Text>
          <BetaBody>
            {auth.clerkEnabled
              ? "Signed-in account features are enabled for live services."
              : "This build keeps working locally while the live account layer is optional."}
          </BetaBody>
        </BetaPanel>

        <MvpChecklistPanel checklist={checklist} title="MVP checklist" />

        <BetaPanel>
          <BetaKicker>NEXT BEST ACTIONS</BetaKicker>
          <ProfileActionRow
            detail={`${collectionSummary.tradeableItems} tradeable pieces, ${collectionSummary.draftItems} drafts`}
            label="Review archive"
            onPress={() => onOpenTab("inventory")}
          />
          <ProfileActionRow
            detail={`${wishlistSummary.grailItems} grails and ${wishlistSummary.highPriorityItems} high-priority wants`}
            label="Tune wishlist"
            onPress={() => onOpenTab("wishlist")}
          />
          <ProfileActionRow
            detail="Check conversations and condition questions"
            label="Open messages"
            onPress={() => onOpenTab("messages")}
          />
          <ProfileActionRow
            detail="Review proposed swaps and trade status"
            label="Open trades"
            onPress={() => onOpenTab("trades")}
          />
        </BetaPanel>
      </ScrollView>
    </BetaScreen>
  );
}

function ProfileActionRow({
  detail,
  label,
  onPress,
}: {
  detail: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        borderBottomColor: beta.colors.border,
        borderBottomWidth: 1,
        gap: beta.spacing.xs,
        opacity: pressed ? 0.82 : 1,
        paddingVertical: beta.spacing.md,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 18 }}>{detail}</Text>
    </Pressable>
  );
}

const inventoryFilterOptions: Array<{ label: string; value: InventoryFilter }> = [
  { label: "All", value: "all" },
  { label: "Tradeable", value: "tradeable" },
  { label: "Drafts", value: "draft" },
  { label: "Needs photos", value: "needs_photos" },
  { label: "Publish-ready", value: "ready" },
];

const inventorySortOptions: Array<{ label: string; value: InventorySort }> = [
  { label: "Recent", value: "recent" },
  { label: "Ready first", value: "ready" },
  { label: "Value", value: "value" },
];

const wishlistFilterOptions: Array<{ label: string; value: WishlistFilter }> = [
  { label: "All", value: "all" },
  { label: "Grails", value: "grails" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const wishlistSortOptions: Array<{ label: string; value: WishlistSort }> = [
  { label: "Rank", value: "rank" },
  { label: "Grails first", value: "grails" },
  { label: "Recent", value: "recent" },
];

function getInventorySearchText(item: TradeableItem): string {
  return [
    item.title,
    item.category ? categoryLabels[item.category] : undefined,
    item.size ? sizeLabels[item.size] : undefined,
    item.era,
    item.tag,
    item.condition ? conditionLabels[item.condition] : undefined,
    statusLabels[item.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortInventoryItems(a: TradeableItem, b: TradeableItem, sort: InventorySort): number {
  if (sort === "ready") {
    return Number(getPublishCheck(b).isValid) - Number(getPublishCheck(a).isValid);
  }
  if (sort === "value") {
    return getItemValue(b) - getItemValue(a);
  }
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function getItemValue(item: TradeableItem): number {
  return item.estimatedValue.max ?? item.estimatedValue.min ?? 0;
}

function getWishlistSearchText(item: WishlistItem): string {
  return [
    item.title,
    item.category ? categoryLabels[item.category] : undefined,
    item.size ? sizeLabels[item.size] : undefined,
    item.preferredEra,
    item.preferredTag,
    item.preferredCondition ? conditionLabels[item.preferredCondition] : undefined,
    wishlistPriorityLabels[item.priority],
    item.isGrail ? "grail" : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortWishlistItems(a: WishlistItem, b: WishlistItem, sort: WishlistSort): number {
  if (sort === "grails") {
    const grailSort = Number(b.isGrail) - Number(a.isGrail);
    if (grailSort !== 0) {
      return grailSort;
    }
    return getWishlistPriorityRank(b.priority) - getWishlistPriorityRank(a.priority);
  }
  if (sort === "recent") {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }
  return a.sortOrder - b.sortOrder;
}

function getWishlistPriorityRank(priority: WishlistItem["priority"]): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
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
  const [categoryFilter, setCategoryFilter] = useState<TradeableItem["category"] | "all">("all");
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<InventorySort>("recent");
  const selectedItem = route.itemId ? getItem(route.itemId) : undefined;
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(visibleItems.map((item) => item.category).filter(Boolean))) as Array<
        NonNullable<TradeableItem["category"]>
      >,
    [visibleItems],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return visibleItems
      .filter((item) => {
        if (categoryFilter !== "all" && item.category !== categoryFilter) {
          return false;
        }

        if (filter === "tradeable" && item.status !== "tradeable") {
          return false;
        }
        if (filter === "draft" && item.status !== "draft") {
          return false;
        }
        if (filter === "needs_photos" && item.photos.length >= 2) {
          return false;
        }
        if (filter === "ready" && !getPublishCheck(item).isValid) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return getInventorySearchText(item).includes(normalizedQuery);
      })
      .sort((a, b) => sortInventoryItems(a, b, sort));
  }, [categoryFilter, filter, query, sort, visibleItems]);

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
          <BetaTitle size={31}>ARCHIVE</BetaTitle>
          <BetaBody>Your tradeable collection.</BetaBody>
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

        <BetaPanel>
          <BetaKicker>FIND RECORDS</BetaKicker>
          <BetaTextField
            autoCapitalize="none"
            label="Search archive"
            onChangeText={setQuery}
            placeholder="Search title, era, tag, category, size"
            value={query}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {inventoryFilterOptions.map((option) => (
              <BetaChip
                key={option.value}
                label={option.label}
                onPress={() => setFilter(option.value)}
                selected={filter === option.value}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            <BetaChip
              label="All categories"
              onPress={() => setCategoryFilter("all")}
              selected={categoryFilter === "all"}
            />
            {categoryOptions.map((category) => (
              <BetaChip
                key={category}
                label={categoryLabels[category]}
                onPress={() => setCategoryFilter(category)}
                selected={categoryFilter === category}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {inventorySortOptions.map((option) => (
              <BetaChip
                key={option.value}
                label={option.label}
                onPress={() => setSort(option.value)}
                selected={sort === option.value}
              />
            ))}
          </View>
          <BetaBody>
            Showing {filteredItems.length} of {visibleItems.length} archive records.
          </BetaBody>
        </BetaPanel>

        {visibleItems.length === 0 ? (
          <BetaEmptyState
            message="Tap Add archive item to create the first local beta collection record."
            title="No collection records yet"
          />
        ) : filteredItems.length === 0 ? (
          <BetaEmptyState
            message="No archive records match this search. Clear filters or add another piece."
            title="Nothing found"
          />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            {filteredItems.map((item) => (
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
  const [filter, setFilter] = useState<WishlistFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WishlistSort>("rank");
  const selectedItem = route.itemId ? getWishlistItem(route.itemId) : undefined;
  const filteredWants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeItems
      .filter((item) => {
        if (filter === "grails" && !item.isGrail) {
          return false;
        }
        if (filter === "high" && item.priority !== "high") {
          return false;
        }
        if (filter === "medium" && item.priority !== "medium") {
          return false;
        }
        if (filter === "low" && item.priority !== "low") {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return getWishlistSearchText(item).includes(normalizedQuery);
      })
      .sort((a, b) => sortWishlistItems(a, b, sort));
  }, [activeItems, filter, query, sort]);

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
          <BetaTitle size={31}>WISHLIST</BetaTitle>
          <BetaBody>Rank your grails.</BetaBody>
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

        <BetaPanel>
          <BetaKicker>FIND WANTS</BetaKicker>
          <BetaTextField
            autoCapitalize="none"
            label="Search wishlist"
            onChangeText={setQuery}
            placeholder="Search title, era, category, priority"
            value={query}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {wishlistFilterOptions.map((option) => (
              <BetaChip
                key={option.value}
                label={option.label}
                onPress={() => setFilter(option.value)}
                selected={filter === option.value}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {wishlistSortOptions.map((option) => (
              <BetaChip
                key={option.value}
                label={option.label}
                onPress={() => setSort(option.value)}
                selected={sort === option.value}
              />
            ))}
          </View>
          <BetaBody>
            Showing {filteredWants.length} of {activeItems.length} wishlist records.
          </BetaBody>
        </BetaPanel>

        {activeItems.length === 0 ? (
          <BetaEmptyState
            message="Tap Add sample want to create the first local beta wishlist record."
            title="No wants yet"
          />
        ) : filteredWants.length === 0 ? (
          <BetaEmptyState
            message="No wants match this search. Clear filters or add another grail."
            title="Nothing found"
          />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {filteredWants.map((item, index) => (
              <MockupWishlistRow
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

function MockupWishlistRow({
  index,
  item,
  onMoveDown,
  onMoveUp,
  onPress,
}: {
  index: number;
  item: WishlistItem;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onPress: () => void;
}) {
  const title = item.title.trim() || "Untitled grail";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "Any size";

  return (
    <Pressable
      accessibilityLabel={`Open ${title} wishlist item`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: beta.colors.surface,
        borderColor: item.isGrail ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: beta.spacing.md,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.sm,
      })}
    >
      <View style={{ position: "relative" }}>
        <View
          style={{
            backgroundColor: beta.colors.surfaceElevated,
            borderColor: beta.colors.border,
            borderRadius: beta.radius.sm,
            borderWidth: 1,
            left: -4,
            paddingHorizontal: beta.spacing.sm,
            paddingVertical: 3,
            position: "absolute",
            top: -4,
            zIndex: 2,
          }}
        >
          <Text style={{ color: beta.colors.orange, fontSize: 18, fontWeight: "900" }}>
            {index + 1}
          </Text>
        </View>
        <ItemThumb item={item} label={title} size={112} />
      </View>
      <View style={{ flex: 1, gap: beta.spacing.sm }}>
        <Text style={{ color: beta.colors.ink, fontSize: 17, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 18 }}>
          {category} / {size}
        </Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 12 }}>
          {wishlistMatchPreferenceLabels[item.matchPreference]}
        </Text>
        <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
          <Pressable accessibilityRole="button" onPress={onMoveUp} style={rankButtonStyle}>
            <Text style={rankButtonTextStyle}>↑</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onMoveDown} style={rankButtonStyle}>
            <Text style={rankButtonTextStyle}>↓</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const rankButtonStyle = {
  alignItems: "center" as const,
  backgroundColor: beta.colors.surfaceElevated,
  borderColor: beta.colors.border,
  borderRadius: beta.radius.sm,
  borderWidth: 1,
  height: 34,
  justifyContent: "center" as const,
  width: 38,
};

const rankButtonTextStyle = {
  color: beta.colors.ink,
  fontSize: 18,
  fontWeight: "900" as const,
};

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
  const [localThreads, setLocalThreads] = useState<LocalConversation[]>(localConversations);
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
          <BetaTitle size={31}>MESSAGES</BetaTitle>
          <BetaBody>Collector conversations.</BetaBody>
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

  async function addVideoClip() {
    const clipUri = await pickItemVideoClip();
    if (!clipUri) {
      return;
    }

    updateItem(currentItem.id, { verificationVideoUrl: clipUri });
  }

  function removeVideoClip() {
    updateItem(currentItem.id, { verificationVideoUrl: undefined });
  }

  function setCoverPhoto(photoId: string) {
    const selected = currentItem.photos.find((photo) => photo.id === photoId);
    if (!selected) {
      return;
    }

    updateItem(currentItem.id, {
      photos: [
        { ...selected, sortOrder: 0 },
        ...currentItem.photos
          .filter((photo) => photo.id !== photoId)
          .map((photo, index) => ({ ...photo, sortOrder: index + 1 })),
      ],
    });
  }

  function removePhoto(photoId: string) {
    updateItem(currentItem.id, {
      photos: currentItem.photos
        .filter((photo) => photo.id !== photoId)
        .map((photo, index) => ({ ...photo, sortOrder: index })),
    });
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
        <ItemPhotoGallery
          onRemovePhoto={removePhoto}
          onSetCover={setCoverPhoto}
          photos={item.photos}
          title={item.title || "Item"}
        />
        <PhotoActionGrid onAddPhoto={(kind) => void addPhoto(kind)} />
        <ItemVideoClip
          onAddVideo={() => void addVideoClip()}
          onRemoveVideo={removeVideoClip}
          videoUrl={item.verificationVideoUrl}
        />

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
            ["Photos", getPhotoSummary(item.photos)],
            ["Item clip", item.verificationVideoUrl ? "5 sec loop attached" : "Not attached"],
            ["Live record", isLocalRecordId(item.id) ? "Not yet synced" : "Synced ID"],
          ]}
          title="Readiness"
        />
        <PublishReadinessChecklist missing={publishCheck.missing} />
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

  async function addVideoClip() {
    const clipUri = await pickItemVideoClip();
    if (!clipUri) {
      return;
    }

    updateItem(currentItem.id, { verificationVideoUrl: clipUri });
  }

  function removeVideoClip() {
    updateItem(currentItem.id, { verificationVideoUrl: undefined });
  }

  function setCoverPhoto(photoId: string) {
    const selected = currentItem.photos.find((photo) => photo.id === photoId);
    if (!selected) {
      return;
    }

    updateItem(currentItem.id, {
      photos: [
        { ...selected, sortOrder: 0 },
        ...currentItem.photos
          .filter((photo) => photo.id !== photoId)
          .map((photo, index) => ({ ...photo, sortOrder: index + 1 })),
      ],
    });
  }

  function removePhoto(photoId: string) {
    updateItem(currentItem.id, {
      photos: currentItem.photos
        .filter((photo) => photo.id !== photoId)
        .map((photo, index) => ({ ...photo, sortOrder: index })),
    });
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

        <ItemPhotoGallery
          onRemovePhoto={removePhoto}
          onSetCover={setCoverPhoto}
          photos={currentItem.photos}
          title={currentItem.title || "Item"}
        />
        <PhotoActionGrid onAddPhoto={(kind) => void addPhoto(kind)} />
        <ItemVideoClip
          onAddVideo={() => void addVideoClip()}
          onRemoveVideo={removeVideoClip}
          videoUrl={currentItem.verificationVideoUrl}
        />
        <DetailPanel
          rows={[
            ["Photos", getPhotoSummary(currentItem.photos)],
            ["Item clip", currentItem.verificationVideoUrl ? "5 sec loop attached" : "Optional"],
            [
              "Publish readiness",
              getPublishCheck(currentItem).isValid
                ? "Ready"
                : getPublishCheck(currentItem).missing.join(", "),
            ],
          ]}
          title="Media and readiness"
        />
        <PublishReadinessChecklist missing={getPublishCheck(currentItem).missing} />
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

function ItemThumb({
  item,
  label,
  size = 72,
}: {
  item: TradeItemSummary | TradeableItem | WishlistItem | undefined;
  label: string;
  size?: number;
}) {
  const photo = item && "photos" in item ? item.photos[0] : undefined;
  const itemTitle = item?.title || label;

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: beta.colors.surfaceWarm,
        borderColor: beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        height: size,
        justifyContent: "center",
        overflow: "hidden",
        width: size,
      }}
    >
      {photo ? (
        <Image
          accessibilityLabel={`${itemTitle} thumbnail`}
          source={{ uri: photo.uri }}
          style={{ height: "100%", width: "100%" }}
        />
      ) : (
        <Text style={{ color: beta.colors.orange, fontSize: 18, fontWeight: "900" }}>
          {label.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function AvatarBadge({ label, tone = "person" }: { label: string; tone?: "brand" | "person" }) {
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: tone === "brand" ? beta.colors.orangeSoft : beta.colors.surfaceWarm,
        borderColor: tone === "brand" ? beta.colors.orange : beta.colors.border,
        borderRadius: 999,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        width: 42,
      }}
    >
      <Text
        style={{
          color: tone === "brand" ? beta.colors.orange : beta.colors.ink,
          fontSize: 14,
          fontWeight: "900",
        }}
      >
        {tone === "brand" ? "K" : initials || "C"}
      </Text>
    </View>
  );
}

function TradeProgressRail({ status }: { status: TradeStatus }) {
  const activeIndex = getTradeProgressIndex(status);

  return (
    <View style={{ gap: beta.spacing.xs }}>
      <View style={{ alignItems: "center", flexDirection: "row" }}>
        {tradeProgressSteps.map((step, index) => {
          const active = index <= activeIndex;
          return (
            <View
              key={step}
              style={{
                alignItems: "center",
                flex: 1,
                flexDirection: "row",
              }}
            >
              <View
                style={{
                  backgroundColor: active ? beta.colors.orange : beta.colors.surfaceElevated,
                  borderColor: active ? beta.colors.orange : beta.colors.border,
                  borderRadius: 999,
                  borderWidth: 1,
                  height: 12,
                  width: 12,
                }}
              />
              {index < tradeProgressSteps.length - 1 ? (
                <View
                  style={{
                    backgroundColor: index < activeIndex ? beta.colors.orange : beta.colors.border,
                    flex: 1,
                    height: 2,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {tradeProgressSteps.map((step, index) => (
          <Text
            key={step}
            style={{
              color: index <= activeIndex ? beta.colors.orange : beta.colors.inkMuted,
              fontSize: 9,
              fontWeight: "800",
            }}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

function getTradeProgressIndex(status: TradeStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "countered":
      return 2;
    case "accepted":
      return 3;
    case "completed":
      return 4;
    case "cancelled":
    case "declined":
    case "disputed":
      return 1;
  }
}

function ItemPhotoGallery({
  onRemovePhoto,
  onSetCover,
  photos,
  title,
}: {
  onRemovePhoto: (photoId: string) => void;
  onSetCover: (photoId: string) => void;
  photos: ItemPhoto[];
  title: string;
}) {
  const coverPhoto = photos[0];

  return (
    <View style={{ gap: beta.spacing.md }}>
      <View
        style={{
          alignItems: "center",
          aspectRatio: 0.86,
          backgroundColor: beta.colors.surfaceElevated,
          borderColor: coverPhoto ? beta.colors.orange : beta.colors.border,
          borderRadius: beta.radius.lg,
          borderWidth: 1,
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {coverPhoto ? (
          <>
            <Image
              accessibilityLabel={`${title} cover photo`}
              source={{ uri: coverPhoto.uri }}
              style={{ height: "100%", width: "100%" }}
            />
            <View
              style={{
                backgroundColor: beta.colors.orange,
                borderRadius: beta.radius.sm,
                left: beta.spacing.md,
                paddingHorizontal: beta.spacing.sm,
                paddingVertical: beta.spacing.xs,
                position: "absolute",
                top: beta.spacing.md,
              }}
            >
              <Text style={{ color: beta.colors.background, fontSize: 11, fontWeight: "900" }}>
                COVER / {itemPhotoKindLabels[coverPhoto.kind].toUpperCase()}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ alignItems: "center", gap: beta.spacing.sm, padding: beta.spacing.lg }}>
            <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
              No photos yet
            </Text>
            <Text
              style={{
                color: beta.colors.inkMuted,
                fontSize: 14,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              Add front, tag, flaw, and detail shots so collectors can judge condition quickly.
            </Text>
          </View>
        )}
      </View>

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
            {photos.map((photo, index) => (
              <View
                key={photo.id}
                style={{
                  backgroundColor: beta.colors.surface,
                  borderColor: index === 0 ? beta.colors.orange : beta.colors.border,
                  borderRadius: beta.radius.md,
                  borderWidth: 1,
                  gap: beta.spacing.sm,
                  padding: beta.spacing.sm,
                  width: 128,
                }}
              >
                <Image
                  accessibilityLabel={`${title} ${itemPhotoKindLabels[photo.kind]} photo`}
                  source={{ uri: photo.uri }}
                  style={{
                    aspectRatio: 1,
                    backgroundColor: beta.colors.surfaceWarm,
                    borderRadius: beta.radius.sm,
                    width: "100%",
                  }}
                />
                <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
                  {index === 0 ? "COVER" : itemPhotoKindLabels[photo.kind].toUpperCase()}
                </Text>
                <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
                  {index !== 0 ? (
                    <Pressable
                      accessibilityLabel={`Make ${itemPhotoKindLabels[photo.kind]} photo cover`}
                      accessibilityRole="button"
                      onPress={() => onSetCover(photo.id)}
                    >
                      <Text style={{ color: beta.colors.ink, fontSize: 12, fontWeight: "900" }}>
                        Cover
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityLabel={`Remove ${itemPhotoKindLabels[photo.kind]} photo`}
                    accessibilityRole="button"
                    onPress={() => onRemovePhoto(photo.id)}
                  >
                    <Text style={{ color: beta.colors.danger, fontSize: 12, fontWeight: "900" }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function PhotoActionGrid({ onAddPhoto }: { onAddPhoto: (kind: ItemPhoto["kind"]) => void }) {
  const photoKinds: ItemPhoto["kind"][] = ["front", "back", "tag", "flaw", "detail"];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
      {photoKinds.map((kind) => (
        <View key={kind} style={{ flexGrow: 1, minWidth: "31%" }}>
          <BetaButton
            accessibilityLabel={`Add ${itemPhotoKindLabels[kind]} photo`}
            onPress={() => onAddPhoto(kind)}
            variant={kind === "front" ? "black" : "secondary"}
          >
            {itemPhotoKindLabels[kind]}
          </BetaButton>
        </View>
      ))}
    </View>
  );
}

function ItemVideoClip({
  onAddVideo,
  onRemoveVideo,
  videoUrl,
}: {
  onAddVideo: () => void;
  onRemoveVideo: () => void;
  videoUrl?: string | undefined;
}) {
  return (
    <BetaPanel tone={videoUrl ? "black" : "white"}>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>ITEM CLIP</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
          {videoUrl ? "5 sec loop attached" : "Add a 5 sec item loop"}
        </Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
          Short silent clips help collectors see fit, fabric, print texture, and condition while
          they scroll.
        </Text>
      </View>

      {videoUrl ? (
        <View
          style={{
            aspectRatio: 1,
            backgroundColor: beta.colors.surfaceWarm,
            borderColor: beta.colors.orange,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          <BetaLoopingVideo uri={videoUrl} />
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <BetaButton
            accessibilityLabel={videoUrl ? "Replace item video clip" : "Add item video clip"}
            onPress={onAddVideo}
            variant={videoUrl ? "secondary" : "black"}
          >
            {videoUrl ? "Replace clip" : "Add clip"}
          </BetaButton>
        </View>
        {videoUrl ? (
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Remove item video clip"
              onPress={onRemoveVideo}
              variant="ghost"
            >
              Remove
            </BetaButton>
          </View>
        ) : null}
      </View>
    </BetaPanel>
  );
}

function PublishReadinessChecklist({ missing }: { missing: string[] }) {
  const checkpoints = [
    "At least one photo",
    "Title",
    "Category",
    "Size",
    "Tag",
    "Condition",
    "Trade preference",
    "Member visibility",
  ];

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>PUBLISH CHECKLIST</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
          {missing.length === 0 ? "Ready to publish" : `${missing.length} checkpoints left`}
        </Text>
      </View>
      <View style={{ gap: beta.spacing.sm }}>
        {checkpoints.map((checkpoint) => {
          const complete = !missing.includes(checkpoint);
          return (
            <View
              key={checkpoint}
              style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.sm }}
            >
              <View
                style={{
                  backgroundColor: complete ? beta.colors.orange : "transparent",
                  borderColor: complete ? beta.colors.orange : beta.colors.border,
                  borderRadius: 999,
                  borderWidth: 1,
                  height: 12,
                  width: 12,
                }}
              />
              <Text
                style={{
                  color: complete ? beta.colors.ink : beta.colors.inkMuted,
                  flex: 1,
                  fontSize: 14,
                  fontWeight: complete ? "900" : "700",
                }}
              >
                {checkpoint}
              </Text>
            </View>
          );
        })}
      </View>
    </BetaPanel>
  );
}

function getPhotoSummary(photos: ItemPhoto[]): string {
  if (photos.length === 0) {
    return "No photos attached";
  }

  const counts = photos.reduce<Record<ItemPhoto["kind"], number>>(
    (summary, photo) => ({ ...summary, [photo.kind]: summary[photo.kind] + 1 }),
    { back: 0, detail: 0, flaw: 0, front: 0, tag: 0 },
  );

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(
      ([kind, count]) => `${count} ${itemPhotoKindLabels[kind as ItemPhoto["kind"]].toLowerCase()}`,
    )
    .join(" / ");
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
    Alert.alert(
      "Photo permission needed",
      "Allow photo access so Konnesor can attach front, back, tag, flaw, and detail photos to your listing.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
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

async function pickItemVideoClip(): Promise<string | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Photo permission needed",
      "Allow photo access so Konnesor can attach short item clips to your listing.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
    return undefined;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    mediaTypes: ["videos"],
    quality: 0.72,
    videoMaxDuration: 5,
  });

  if (result.canceled || result.assets.length === 0) {
    return undefined;
  }

  const asset = result.assets[0];
  if (!asset?.uri) {
    return undefined;
  }

  if (asset.duration && asset.duration > 6500) {
    Alert.alert(
      "Clip is too long",
      "Choose a video around 5 seconds. We are keeping item clips short so the feed stays fast.",
    );
    return undefined;
  }

  return asset.uri;
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
  const [composeStep, setComposeStep] = useState<TradeComposeStep>("offer");
  const [draftNotes, setDraftNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>();
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>();
  const [source, setSource] = useState<"api" | "local">("local");
  const offerCandidates = useMemo(
    () => items.filter((item) => item.status !== "archived"),
    [items],
  );
  const offeredItem =
    offerCandidates.find((item) => item.id === selectedOfferId) ??
    offerCandidates.find((item) => item.status === "tradeable") ??
    offerCandidates[0];
  const requestedItem =
    activeItems.find((item) => item.id === selectedTargetId) ??
    activeItems.find((item) => item.isGrail) ??
    activeItems[0];
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

  useEffect(() => {
    if (!selectedOfferId && offeredItem) {
      setSelectedOfferId(offeredItem.id);
    }
  }, [offeredItem, selectedOfferId]);

  useEffect(() => {
    if (!selectedTargetId && requestedItem) {
      setSelectedTargetId(requestedItem.id);
    }
  }, [requestedItem, selectedTargetId]);

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
    setComposeStep("offer");
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
              Choose the piece you would offer, pick the want you are targeting, then review the
              trade terms before creating the proposal.
            </BetaBody>
          </View>

          <TradeComposeProgress activeStep={composeStep} onChange={setComposeStep} />

          {composeStep === "offer" ? (
            <TradeComposeSelection
              emptyMessage="Publish or create one archive item before composing a trade."
              items={offerCandidates}
              onSelect={(itemId) => setSelectedOfferId(itemId)}
              selectedId={offeredItem?.id}
              title="Choose your offer"
              type="offer"
            />
          ) : null}

          {composeStep === "target" ? (
            <TradeComposeSelection
              emptyMessage="Add at least one want before composing a trade."
              items={activeItems}
              onSelect={(itemId) => setSelectedTargetId(itemId)}
              selectedId={requestedItem?.id}
              title="Choose the target"
              type="target"
            />
          ) : null}

          {composeStep === "terms" ? (
            <BetaPanel>
              <BetaKicker>TERMS</BetaKicker>
              <BetaTextField
                label="Proposal note"
                multiline
                numberOfLines={5}
                onChangeText={setDraftNotes}
                placeholder="Explain condition, fit, what you want confirmed, and why the swap makes sense."
                style={{ minHeight: 124, textAlignVertical: "top" }}
                value={draftNotes}
              />
              <DetailPanel
                rows={[
                  ["Shipping", "Confirm both addresses after acceptance"],
                  ["Condition", "Ask for measurements, tag, flaw, and back photos"],
                  ["Safety", "Keep final terms in this trade thread"],
                ]}
                title="Terms checklist"
              />
            </BetaPanel>
          ) : null}

          {composeStep === "review" ? (
            <View style={{ gap: theme.spacing.md }}>
              <TradeObjectPanel
                emptyMessage="Choose an archive item before creating the proposal."
                item={offeredItem}
                label="Your offer"
              />
              <TradeObjectPanel
                emptyMessage="Choose a target want before creating the proposal."
                item={requestedItem}
                label="Target"
              />
              <DetailPanel
                rows={[
                  ["Proposal note", draftNotes.trim() || "Default condition confirmation note"],
                  ["Offer status", offeredItem ? statusLabels[offeredItem.status] : "Missing"],
                  [
                    "Target priority",
                    requestedItem
                      ? requestedItem.isGrail
                        ? "Grail"
                        : wishlistPriorityLabels[requestedItem.priority]
                      : "Missing",
                  ],
                ]}
                title="Review"
              />
            </View>
          ) : null}

          <TradeComposeControls
            canCreate={Boolean(offeredItem && requestedItem)}
            onCreate={createLocalProposal}
            onStepChange={setComposeStep}
            step={composeStep}
          />
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
          <BetaTitle size={31}>TRADES</BetaTitle>
          <BetaBody>Review structured swaps.</BetaBody>
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
              counterpartyItem={trade.counterpartyItem}
              key={trade.id}
              onPress={() => setRoute({ mode: "detail", tradeId: trade.id })}
              proposerItem={trade.proposerItem}
              subtitle={`${trade.proposerDisplayName} <> ${trade.counterpartyDisplayName}`}
              title={`${trade.proposerItem.title} for ${trade.counterpartyItem.title}`}
              status={trade.status}
              source="Live"
            />
          ))}
          {localTrades.map((trade) => (
            <TradeRow
              counterpartyTitle={trade.requestedTitle}
              key={trade.id}
              onPress={() => setRoute({ mode: "detail", tradeId: trade.id })}
              proposerItem={items.find((item) => item.id === trade.offeredItemId)}
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

function TradeComposeProgress({
  activeStep,
  onChange,
}: {
  activeStep: TradeComposeStep;
  onChange: (step: TradeComposeStep) => void;
}) {
  const activeIndex = tradeComposeSteps.findIndex((step) => step.id === activeStep);

  return (
    <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
      {tradeComposeSteps.map((step, index) => {
        const active = step.id === activeStep;
        const complete = index < activeIndex;
        return (
          <Pressable
            accessibilityLabel={`Open trade step ${step.label}`}
            accessibilityRole="button"
            key={step.id}
            onPress={() => onChange(step.id)}
            style={{
              backgroundColor: active ? beta.colors.orange : beta.colors.surface,
              borderColor: active || complete ? beta.colors.orange : beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              flex: 1,
              minHeight: 42,
              justifyContent: "center",
              paddingHorizontal: beta.spacing.xs,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: active ? beta.colors.background : beta.colors.ink,
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              {complete ? "OK " : ""}
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TradeComposeSelection({
  emptyMessage,
  items,
  onSelect,
  selectedId,
  title,
  type,
}: {
  emptyMessage: string;
  items: Array<TradeableItem | WishlistItem>;
  onSelect: (itemId: string) => void;
  selectedId: string | undefined;
  title: string;
  type: "offer" | "target";
}) {
  if (items.length === 0) {
    return <BetaEmptyState message={emptyMessage} title={title} />;
  }

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>{type === "offer" ? "YOUR SIDE" : "THE WANT"}</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>{title}</Text>
      </View>
      <View style={{ gap: beta.spacing.md }}>
        {items.map((item) => (
          <TradeComposeOption
            item={item}
            key={item.id}
            onPress={() => onSelect(item.id)}
            selected={item.id === selectedId}
          />
        ))}
      </View>
    </BetaPanel>
  );
}

function TradeComposeOption({
  item,
  onPress,
  selected,
}: {
  item: TradeableItem | WishlistItem;
  onPress: () => void;
  selected: boolean;
}) {
  const isWishlistItem = "isGrail" in item;
  const subtitle = [
    item.category ? categoryLabels[item.category] : undefined,
    item.size ? sizeLabels[item.size] : undefined,
    isWishlistItem
      ? item.isGrail
        ? "Grail"
        : wishlistPriorityLabels[item.priority]
      : statusLabels[item.status],
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Pressable
      accessibilityLabel={`Select ${item.title || "untitled item"}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? beta.colors.orangeSoft : beta.colors.surface,
        borderColor: selected ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        gap: beta.spacing.sm,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.md,
      })}
    >
      <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.md }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: beta.colors.surfaceWarm,
            borderRadius: beta.radius.sm,
            height: 62,
            justifyContent: "center",
            overflow: "hidden",
            width: 62,
          }}
        >
          {"photos" in item && item.photos[0] ? (
            <Image
              accessibilityLabel={`${item.title || "Item"} thumbnail`}
              source={{ uri: item.photos[0].uri }}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <Text style={{ color: beta.colors.orange, fontSize: 18, fontWeight: "900" }}>
              {selected ? "OK" : "+"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, gap: beta.spacing.xs }}>
          <Text style={{ color: beta.colors.ink, fontSize: 17, fontWeight: "900" }}>
            {item.title || "Untitled record"}
          </Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
            {subtitle || "Needs more details"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function TradeComposeControls({
  canCreate,
  onCreate,
  onStepChange,
  step,
}: {
  canCreate: boolean;
  onCreate: () => void;
  onStepChange: (step: TradeComposeStep) => void;
  step: TradeComposeStep;
}) {
  const stepIndex = tradeComposeSteps.findIndex((item) => item.id === step);
  const previousStep = tradeComposeSteps[Math.max(0, stepIndex - 1)]?.id;
  const nextStep = tradeComposeSteps[Math.min(tradeComposeSteps.length - 1, stepIndex + 1)]?.id;

  return (
    <View style={{ gap: beta.spacing.md }}>
      {step === "review" ? (
        <BetaButton
          accessibilityLabel="Create local trade proposal"
          disabled={!canCreate}
          onPress={onCreate}
          variant="black"
        >
          Create proposal
        </BetaButton>
      ) : (
        <BetaButton
          accessibilityLabel="Continue trade proposal"
          onPress={() => {
            if (nextStep) onStepChange(nextStep);
          }}
        >
          Continue
        </BetaButton>
      )}
      {stepIndex > 0 ? (
        <BetaButton
          accessibilityLabel="Back one trade proposal step"
          onPress={() => {
            if (previousStep) onStepChange(previousStep);
          }}
          variant="secondary"
        >
          Back one step
        </BetaButton>
      ) : null}
    </View>
  );
}

function TradeRow({
  counterpartyItem,
  counterpartyTitle,
  onPress,
  proposerItem,
  source,
  status,
  subtitle,
  title,
}: {
  counterpartyItem?: TradeItemSummary | TradeableItem | undefined;
  counterpartyTitle?: string | undefined;
  onPress: () => void;
  proposerItem?: TradeItemSummary | TradeableItem | undefined;
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
        gap: beta.spacing.md,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.md,
      })}
    >
      <View style={{ flexDirection: "row", gap: beta.spacing.md, justifyContent: "space-between" }}>
        <BetaKicker>{source.toUpperCase()}</BetaKicker>
        <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
          {tradeStatusLabels[status]}
        </Text>
      </View>
      <Text style={{ color: beta.colors.ink, fontSize: 17, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 18 }}>{subtitle}</Text>
      <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.md }}>
        <ItemThumb item={proposerItem} label="Offer" size={92} />
        <View
          style={{
            alignItems: "center",
            backgroundColor: beta.colors.surfaceElevated,
            borderColor: beta.colors.border,
            borderRadius: 999,
            borderWidth: 1,
            height: 34,
            justifyContent: "center",
            marginHorizontal: -2,
            width: 34,
            zIndex: 2,
          }}
        >
          <Text style={{ color: beta.colors.ink, fontSize: 17, fontWeight: "900" }}>↔</Text>
        </View>
        <ItemThumb item={counterpartyItem} label={counterpartyTitle ?? "Target"} size={92} />
      </View>
      <TradeProgressRail status={status} />
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
  const photo = "photos" in item ? item.photos[0] : undefined;
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
          overflow: "hidden",
        }}
      >
        {photo ? (
          <Image
            accessibilityLabel={`${title} trade object photo`}
            source={{ uri: photo.uri }}
            style={{ height: "100%", width: "100%" }}
          />
        ) : (
          <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
            Object image
          </Text>
        )}
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
