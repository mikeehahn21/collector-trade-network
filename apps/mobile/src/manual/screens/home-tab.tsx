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
  BlockedUsersPanel,
  buildMvpChecklist,
  CollectorProfilePanel,
} from "../components/shared-panels";
import { CompFinderScreen } from "./comp-finder-screen";
import { toDisplayConversation } from "./messages-tab";

export function HomeTab({
  blockedUsers,
  localThreads,
  localTrades,
  onOpenTradeDetail,
  onUnblockUser,
  setTab,
}: {
  blockedUsers: BlockedUser[];
  localThreads: LocalConversation[];
  localTrades: LocalTradeProposal[];
  onOpenTradeDetail: (tradeId: string) => void;
  onUnblockUser: (userId: string) => void;
  setTab: (tab: Tab) => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const apiRef = useRef(api);
  const auth = useAuthSession();
  const { items, summary: collectionSummary } = useCollectionState();
  const { summary: wishlistSummary } = useWishlistState();
  const { profile } = useUserProfile();
  const [showProfile, setShowProfile] = useState(false);
  const [showCompFinder, setShowCompFinder] = useState(false);
  const [fallbackItems, setFallbackItems] = useState<PublicTradeableItem[]>([]);
  const [homeConversations, setHomeConversations] = useState<Conversation[]>([]);
  const [homeTrades, setHomeTrades] = useState<Trade[]>([]);
  const [publicItemsById, setPublicItemsById] = useState<Record<string, PublicTradeableItem>>({});
  const [tradeCreateId, setTradeCreateId] = useState<string | undefined>();
  const {
    error: recommendationError,
    isLoading: recommendationsLoading,
    recommendations,
    refresh: refreshRecommendations,
    summary: recommendationSummary,
  } = useRecommendations();
  const tradeableItems = useMemo(
    () => items.filter((item) => item.status === "tradeable"),
    [items],
  );
  const profileLabel = profile?.displayName?.split(" ")[0] ?? "Profile";
  const publishReadyCount = useMemo(
    () => items.filter((item) => getPublishCheck(item).isValid).length,
    [items],
  );
  const photoReadyCount = useMemo(
    () => items.filter((item) => item.photos.length >= 2).length,
    [items],
  );
  const localSentMessageCount = useMemo(
    () =>
      localThreads.reduce(
        (count, thread) => count + thread.messages.filter((message) => message.isMine).length,
        0,
      ),
    [localThreads],
  );
  const mvpChecklist = useMemo(
    () =>
      buildMvpChecklist({
        auth,
        collectionSummary,
        localSentMessageCount,
        localTradeCount: localTrades.length,
        photoReadyCount,
        publishReadyCount,
        recommendationCount: recommendationSummary.total,
        wishlistSummary,
      }),
    [
      auth,
      collectionSummary,
      localSentMessageCount,
      localTrades.length,
      photoReadyCount,
      publishReadyCount,
      recommendationSummary.total,
      wishlistSummary,
    ],
  );
  const needsProfileInputs =
    collectionSummary.tradeableItems === 0 || wishlistSummary.activeItems === 0;
  const unreadConversation = useMemo(() => {
    const apiUnread = homeConversations.find((conversation) => conversation.unreadCount > 0);
    if (apiUnread) {
      return toDisplayConversation(apiUnread, profile?.id);
    }

    return localThreads.find((thread) => thread.unreadCount > 0);
  }, [homeConversations, localThreads, profile?.id]);
  const actionTrades = useMemo(
    () => homeTrades.filter(isTradeNeedingViewerAction).slice(0, 3),
    [homeTrades],
  );
  const localActionTrades = useMemo(
    () =>
      localTrades
        .filter((trade) => ["accepted", "countered", "pending"].includes(trade.status))
        .slice(0, 3),
    [localTrades],
  );
  const feedEntries = useMemo(
    () =>
      buildHomeFeedEntries({
        fallbackItems,
        publicItemsById,
        recommendations,
      }),
    [fallbackItems, publicItemsById, recommendations],
  );

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    const candidateIds = recommendations
      .map((recommendation) => recommendation.theirMatchingItems[0]?.id)
      .filter((itemId): itemId is string => Boolean(itemId));
    const uniqueIds = [...new Set(candidateIds)].filter((itemId) => !publicItemsById[itemId]);

    if (uniqueIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      uniqueIds.map(async (itemId) => {
        try {
          const response = await apiRef.current.getPublicItem(itemId);
          return response.item;
        } catch {
          return undefined;
        }
      }),
    ).then((publicItems) => {
      if (cancelled) {
        return;
      }

      setPublicItemsById((current) => {
        const next = { ...current };
        publicItems.forEach((item) => {
          if (item) {
            next[item.id] = item;
          }
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [publicItemsById, recommendations]);

  useEffect(() => {
    if (!auth.isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadHomeData() {
      try {
        const [tradesResponse, conversationsResponse, publicItemsResponse] = await Promise.all([
          apiRef.current.listTrades(),
          apiRef.current.listConversations(),
          apiRef.current.listPublicItems(),
        ]);

        if (cancelled) {
          return;
        }

        setHomeTrades(tradesResponse.trades);
        setHomeConversations(conversationsResponse.conversations);
        setFallbackItems(publicItemsResponse.items);
      } catch (error) {
        console.log("[Konnesor Home] Live home data unavailable", error);
      }
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [auth.isSignedIn]);

  if (showProfile) {
    return (
      <CollectorProfilePanel
        auth={auth}
        collectionSummary={collectionSummary}
        blockedUsers={blockedUsers}
        onBack={() => setShowProfile(false)}
        onOpenTab={(nextTab) => {
          setShowProfile(false);
          setTab(nextTab);
        }}
        onUnblockUser={onUnblockUser}
        photoReadyCount={photoReadyCount}
        profile={profile}
        publishReadyCount={publishReadyCount}
        wishlistSummary={wishlistSummary}
        checklist={mvpChecklist}
      />
    );
  }

  if (showCompFinder) {
    return <CompFinderScreen item={tradeableItems[0]} onBack={() => setShowCompFinder(false)} />;
  }

  async function createTradeFromFeed(entry: HomeFeedEntry) {
    const counterpartyItemId = entry.counterpartyItem?.id;
    const proposerItemId = entry.recommendation?.yourMatchingItems[0]?.id ?? tradeableItems[0]?.id;

    if (!counterpartyItemId) {
      Alert.alert(
        "Trade unavailable",
        "This item is missing the details needed to propose a trade.",
      );
      return;
    }

    if (!proposerItemId) {
      Alert.alert(
        "Add a tradeable item first",
        "Add something to your Collection before proposing.",
      );
      return;
    }

    setTradeCreateId(entry.id);
    try {
      const response = await apiRef.current.createTrade({
        counterpartyItemId,
        proposerItemId,
        proposerNotes: entry.recommendation
          ? `Proposed from ${entry.recommendation.hasGrailMatch ? "grail" : entry.recommendation.isMutual ? "mutual" : "recommended"} Home match.`
          : "Proposed from Home browse.",
      });
      onOpenTradeDetail(response.trade.id);
    } catch (error) {
      console.log("[Konnesor Home] Trade creation failed", error);
      Alert.alert("Trade not sent", "Konnesor could not create this trade yet. Try again shortly.");
    } finally {
      setTradeCreateId(undefined);
    }
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
            style={{ height: 34, width: 170 }}
          />
          <Pressable
            accessibilityLabel="Open collector profile"
            accessibilityRole="button"
            onPress={() => setShowProfile(true)}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              flexDirection: "row",
              gap: theme.spacing.xs,
              justifyContent: "center",
              opacity: pressed ? 0.82 : 1,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 6,
            })}
          >
            <Image
              accessibilityLabel="Konnesor symbol"
              resizeMode="contain"
              source={konnesorSymbol}
              style={{ height: 24, width: 24 }}
            />
            <Text style={{ color: theme.colors.ink, fontSize: 12, fontWeight: "900" }}>
              {profileLabel}
            </Text>
          </Pressable>
        </View>

        {actionTrades.length > 0 || localActionTrades.length > 0 ? (
          <NeedsActionTrades
            localTrades={localActionTrades}
            onOpenTrade={onOpenTradeDetail}
            trades={actionTrades}
          />
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 4 }}>
              <BetaKicker>MATCH FEED</BetaKicker>
              <Text style={{ color: theme.colors.ink, fontSize: 25, fontWeight: "900" }}>
                Trade picks
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Refresh match feed"
              accessibilityRole="button"
              onPress={() => void refreshRecommendations()}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: 999,
                borderWidth: 1,
                opacity: pressed ? 0.78 : 1,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              })}
            >
              <Text style={{ color: theme.colors.ink, fontSize: 12, fontWeight: "900" }}>
                Refresh
              </Text>
            </Pressable>
          </View>

          {recommendationsLoading ? (
            <BetaEmptyState message="Ranking live collector inventory." title="Loading matches" />
          ) : feedEntries.length > 0 ? (
            feedEntries.map((entry, index) => (
              <HomeFeedCard
                entry={entry}
                isCreating={tradeCreateId === entry.id}
                isTop={index === 0}
                key={entry.id}
                onPress={() => void createTradeFromFeed(entry)}
              />
            ))
          ) : (
            <BetaEmptyState
              message={
                recommendationError ??
                "Add collection pieces and wishlist targets to unlock live match cards."
              }
              title="No matches yet"
            />
          )}
        </View>

        <CompFinderShortcut onPress={() => setShowCompFinder(true)} />

        {unreadConversation ? (
          <UnreadMessagePreview
            conversation={unreadConversation}
            onPress={() => setTab("messages")}
          />
        ) : null}

        {needsProfileInputs ? (
          <ProfileCompletionNudge
            collectionCount={collectionSummary.tradeableItems}
            onOpenCollection={() => setTab("inventory")}
            onOpenWishlist={() => setTab("wishlist")}
            wishlistCount={wishlistSummary.activeItems}
          />
        ) : null}
      </ScrollView>
    </BetaScreen>
  );
}

export type HomeFeedEntry = {
  counterpartyItem?: PublicTradeableItem | undefined;
  counterpartyItemSummary?: TradeRecommendation["theirMatchingItems"][number] | undefined;
  id: string;
  kind: "recommendation" | "browse";
  recommendation?: TradeRecommendation | undefined;
};

export function buildHomeFeedEntries({
  fallbackItems,
  publicItemsById,
  recommendations,
}: {
  fallbackItems: PublicTradeableItem[];
  publicItemsById: Record<string, PublicTradeableItem>;
  recommendations: TradeRecommendation[];
}): HomeFeedEntry[] {
  const recommendationEntries = recommendations.map((recommendation) => {
    const counterpartyItemSummary = recommendation.theirMatchingItems[0];
    return {
      counterpartyItem: counterpartyItemSummary
        ? publicItemsById[counterpartyItemSummary.id]
        : undefined,
      counterpartyItemSummary,
      id: recommendation.id,
      kind: "recommendation" as const,
      recommendation,
    };
  });
  const recommendedItemIds = new Set(
    recommendationEntries
      .map((entry) => entry.counterpartyItemSummary?.id)
      .filter((itemId): itemId is string => Boolean(itemId)),
  );
  const fallbackEntries =
    recommendationEntries.length >= 5
      ? []
      : fallbackItems
          .filter((item) => !recommendedItemIds.has(item.id))
          .slice(0, 5 - recommendationEntries.length)
          .map((item) => ({
            counterpartyItem: item,
            id: `browse_${item.id}`,
            kind: "browse" as const,
          }));

  return [...recommendationEntries, ...fallbackEntries];
}

export function HomeFeedCard({
  entry,
  isCreating,
  isTop,
  onPress,
}: {
  entry: HomeFeedEntry;
  isCreating: boolean;
  isTop: boolean;
  onPress: () => void;
}) {
  const recommendation = entry.recommendation;
  const item = entry.counterpartyItem;
  const itemSummary = entry.counterpartyItemSummary;
  const title = item?.title ?? itemSummary?.title ?? "Tradeable piece";
  const ownerName =
    item?.owner.displayName ??
    itemSummary?.ownerDisplayName ??
    recommendation?.counterpartyDisplayName ??
    "Collector";
  const wantedTitle =
    recommendation?.yourMatchingItems[0]?.title ??
    recommendation?.theirMatchingWishlist[0]?.title ??
    "one of your tradeable pieces";
  const badge = recommendation?.hasGrailMatch
    ? "GRAIL"
    : recommendation?.isMutual
      ? "MUTUAL"
      : recommendation
        ? "MATCH"
        : "YOU MIGHT LIKE THIS";
  const category = item?.category ?? itemSummary?.category;
  const size = item?.size ?? itemSummary?.size;
  const photo = item?.photos[0];

  return (
    <Pressable
      accessibilityLabel={`Propose trade for ${title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: recommendation ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.md,
        opacity: pressed || isCreating ? 0.78 : 1,
        overflow: "hidden",
        padding: beta.spacing.md,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View
        style={{
          alignItems: "center",
          flexDirection: isTop ? "column" : "row",
          gap: beta.spacing.md,
        }}
      >
        <View
          style={{
            aspectRatio: isTop ? 1.08 : 0.9,
            backgroundColor: beta.colors.surfaceWarm,
            borderColor: beta.colors.border,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            justifyContent: "center",
            overflow: "hidden",
            width: isTop ? "100%" : 112,
          }}
        >
          {photo ? (
            <Image
              accessibilityLabel={`${title} photo`}
              resizeMode="cover"
              source={{ uri: photo.uri }}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <Text
              style={{
                color: beta.colors.inkMuted,
                fontSize: 14,
                fontWeight: "900",
                padding: beta.spacing.md,
                textAlign: "center",
              }}
            >
              {title}
            </Text>
          )}
          <View
            style={{
              backgroundColor: recommendation ? beta.colors.orange : beta.colors.surfaceElevated,
              borderRadius: 999,
              left: beta.spacing.sm,
              paddingHorizontal: beta.spacing.sm,
              paddingVertical: 5,
              position: "absolute",
              top: beta.spacing.sm,
            }}
          >
            <Text
              style={{
                color: recommendation ? beta.colors.background : beta.colors.inkMuted,
                fontSize: 10,
                fontWeight: "900",
              }}
            >
              {badge}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, gap: beta.spacing.sm, width: isTop ? "100%" : undefined }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: beta.colors.ink, fontSize: isTop ? 23 : 18, fontWeight: "900" }}>
              {title}
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "800" }}>
              {ownerName}
              {category ? ` / ${categoryLabels[category]}` : ""}
              {size ? ` / ${sizeLabels[size]}` : ""}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: beta.colors.surfaceElevated,
              borderColor: beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              gap: 4,
              padding: beta.spacing.sm,
            }}
          >
            <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
              THEY WANT
            </Text>
            <Text style={{ color: beta.colors.ink, fontSize: 14, fontWeight: "900" }}>
              {wantedTitle}
            </Text>
          </View>

          {recommendation ? (
            <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {recommendation.reasons[0]?.label ?? "Strong collector fit"} / score{" "}
              {recommendation.score}
            </Text>
          ) : null}

          <View
            style={{
              alignItems: "center",
              backgroundColor: beta.colors.orange,
              borderRadius: beta.radius.md,
              minHeight: 42,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: beta.colors.background, fontSize: 14, fontWeight: "900" }}>
              {isCreating ? "Sending..." : "Propose trade"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function NeedsActionTrades({
  localTrades,
  onOpenTrade,
  trades,
}: {
  localTrades: LocalTradeProposal[];
  onOpenTrade: (tradeId: string) => void;
  trades: Trade[];
}) {
  return (
    <BetaPanel tone="peach">
      <View style={{ gap: beta.spacing.xs }}>
        <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
          NEEDS YOUR ACTION
        </Text>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
          Keep trades moving
        </Text>
      </View>

      {trades.map((trade) => (
        <HomeTradeActionRow key={trade.id} onPress={() => onOpenTrade(trade.id)} trade={trade} />
      ))}
      {trades.length === 0
        ? localTrades.map((trade) => (
            <HomeLocalTradeActionRow
              key={trade.id}
              onPress={() => onOpenTrade(trade.id)}
              trade={trade}
            />
          ))
        : null}
    </BetaPanel>
  );
}

export function HomeTradeActionRow({ onPress, trade }: { onPress: () => void; trade: Trade }) {
  return (
    <Pressable
      accessibilityLabel={`Open trade with ${getTradeCounterpartyName(trade)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.orange,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        gap: beta.spacing.xs,
        opacity: pressed ? 0.82 : 1,
        padding: beta.spacing.md,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900" }}>
        {getTradeCounterpartyName(trade)}
      </Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 18 }}>
        {getTradeActionText(trade)}
      </Text>
    </Pressable>
  );
}

export function HomeLocalTradeActionRow({
  onPress,
  trade,
}: {
  onPress: () => void;
  trade: LocalTradeProposal;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open local trade with ${trade.counterparty}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.orange,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        gap: beta.spacing.xs,
        opacity: pressed ? 0.82 : 1,
        padding: beta.spacing.md,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900" }}>
        {trade.counterparty}
      </Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 18 }}>
        {trade.status === "pending"
          ? "Review the proposal."
          : trade.status === "countered"
            ? "Review the counter."
            : "Confirm the trade when both sides are satisfied."}
      </Text>
    </Pressable>
  );
}

export function CompFinderShortcut({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Open Comp Finder"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: beta.colors.surfaceElevated,
        borderColor: beta.colors.borderStrong,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        opacity: pressed ? 0.84 : 1,
        padding: beta.spacing.md,
      })}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
          COMP FINDER
        </Text>
        <Text style={{ color: beta.colors.ink, fontSize: 17, fontWeight: "900" }}>
          Check market comps
        </Text>
      </View>
      <Text style={{ color: beta.colors.orange, fontSize: 24, fontWeight: "900" }}>›</Text>
    </Pressable>
  );
}

export function UnreadMessagePreview({
  conversation,
  onPress,
}: {
  conversation: LocalConversation;
  onPress: () => void;
}) {
  const lastMessage = conversation.messages.at(-1);

  return (
    <Pressable
      accessibilityLabel={`Open unread message from ${conversation.participant}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.orange,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.xs,
        opacity: pressed ? 0.84 : 1,
        padding: beta.spacing.md,
      })}
    >
      <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
        UNREAD MESSAGE
      </Text>
      <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>
        {conversation.participant}
      </Text>
      <Text numberOfLines={1} style={{ color: beta.colors.inkMuted, fontSize: 13 }}>
        {lastMessage?.content ?? conversation.contextTitle}
      </Text>
    </Pressable>
  );
}

export function ProfileCompletionNudge({
  collectionCount,
  onOpenCollection,
  onOpenWishlist,
  wishlistCount: _wishlistCount,
}: {
  collectionCount: number;
  onOpenCollection: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
}) {
  const needsCollection = collectionCount === 0;

  return (
    <BetaPanel>
      <Text style={{ color: beta.colors.ink, fontSize: 18, fontWeight: "900" }}>
        {needsCollection
          ? "Add a tradeable piece to start matching."
          : "Add what you're hunting for to start seeing matches."}
      </Text>
      <BetaButton
        accessibilityLabel={needsCollection ? "Open Collection" : "Open Wishlist"}
        onPress={needsCollection ? onOpenCollection : onOpenWishlist}
      >
        {needsCollection ? "Open Collection" : "Open Wishlist"}
      </BetaButton>
    </BetaPanel>
  );
}

export function isTradeNeedingViewerAction(trade: Trade): boolean {
  const viewerConfirmed =
    trade.viewerRole === "proposer"
      ? Boolean(trade.proposerCompletedConfirmedAt)
      : Boolean(trade.counterpartyCompletedConfirmedAt);

  return (
    (trade.status === "pending" && trade.viewerRole === "counterparty") ||
    (trade.status === "countered" && trade.viewerRole === "proposer") ||
    (trade.status === "accepted" && !viewerConfirmed)
  );
}

export function getTradeCounterpartyName(trade: Trade): string {
  return trade.viewerRole === "proposer"
    ? trade.counterpartyDisplayName
    : trade.proposerDisplayName;
}

export function getTradeActionText(trade: Trade): string {
  if (trade.status === "pending" && trade.viewerRole === "counterparty") {
    return `${trade.proposerDisplayName} sent a proposal. Review it now.`;
  }

  if (trade.status === "countered" && trade.viewerRole === "proposer") {
    return `${trade.counterpartyDisplayName} countered your proposal.`;
  }

  if (trade.status === "accepted") {
    const otherConfirmed =
      trade.viewerRole === "proposer"
        ? Boolean(trade.counterpartyCompletedConfirmedAt)
        : Boolean(trade.proposerCompletedConfirmedAt);

    return otherConfirmed
      ? "The other collector confirmed completion. Confirm your side."
      : "Confirm completion once you have received and approved the item.";
  }

  return tradeStatusLabels[trade.status];
}
