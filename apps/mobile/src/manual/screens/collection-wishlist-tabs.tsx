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
import { CompFinderPanel, getPhotoSummary } from "./comp-finder-screen";
import {
  AvatarBadge,
  DetailPanel,
  isLocalRecordId,
  ItemThumb,
  MissingRecord,
  pickBulkItemPhotos,
  pickItemPhoto,
  pickItemVideoClip,
  ReleaseEmptyState,
} from "../components/shared-panels";
import { BackArrowButton } from "./onboarding-flow";
import { encodeListingPhotoForAi, getPrimaryLocalListingPhoto } from "@/lib/ai-listing-image";

export const inventoryFilterOptions: Array<{ label: string; value: InventoryFilter }> = [
  { label: "All", value: "all" },
  { label: "Tradeable", value: "tradeable" },
  { label: "Drafts", value: "draft" },
  { label: "Needs photos", value: "needs_photos" },
  { label: "Publish-ready", value: "ready" },
];

export const inventorySortOptions: Array<{ label: string; value: InventorySort }> = [
  { label: "Recent", value: "recent" },
  { label: "Ready first", value: "ready" },
  { label: "Value", value: "value" },
];

export const wishlistFilterOptions: Array<{ label: string; value: WishlistFilter }> = [
  { label: "All", value: "all" },
  { label: "Grails", value: "grails" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const wishlistSortOptions: Array<{ label: string; value: WishlistSort }> = [
  { label: "Rank", value: "rank" },
  { label: "Grails first", value: "grails" },
  { label: "Recent", value: "recent" },
];

export function getInventorySearchText(item: TradeableItem): string {
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

export function sortInventoryItems(
  a: TradeableItem,
  b: TradeableItem,
  sort: InventorySort,
): number {
  if (sort === "ready") {
    return Number(getPublishCheck(b).isValid) - Number(getPublishCheck(a).isValid);
  }
  if (sort === "value") {
    return getItemValue(b) - getItemValue(a);
  }
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function getItemValue(item: TradeableItem): number {
  return item.estimatedValue.max ?? item.estimatedValue.min ?? 0;
}

export function getWishlistSearchText(item: WishlistItem): string {
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

export function sortWishlistItems(a: WishlistItem, b: WishlistItem, sort: WishlistSort): number {
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

export function getWishlistPriorityRank(priority: WishlistItem["priority"]): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

export function InventoryTab({
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

  async function addBulkPhotoDrafts() {
    const photos = await pickBulkItemPhotos();
    if (photos.length === 0) {
      return;
    }

    const createdItems = photos.map((photo, index) =>
      createItem({
        photos: [photo],
        status: "draft",
        title: `New item ${visibleItems.length + index + 1}`,
        tradePreference: "wishlist_only",
        visibility: "approved_members",
      }),
    );

    Alert.alert(
      "Bulk drafts created",
      `${createdItems.length} item draft${createdItems.length === 1 ? "" : "s"} created. Add details before publishing.`,
    );

    const firstItem = createdItems[0];
    if (firstItem) {
      setRoute({ mode: "edit", itemId: firstItem.id });
    }
  }

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <BetaTitle size={31}>COLLECTION</BetaTitle>
          <BetaBody>Build your trade rack with photos, clips, and clean item details.</BetaBody>
        </View>

        <BetaStatPanel
          stats={[
            { label: "Total", value: summary.totalItems },
            { label: "Tradeable", value: summary.tradeableItems },
            { label: "Drafts", value: summary.draftItems },
          ]}
        />

        <BetaPanel tone="black">
          <View style={{ gap: theme.spacing.xs }}>
            <BetaKicker>ADD ITEMS</BetaKicker>
            <Text style={{ color: theme.colors.ink, fontSize: 22, fontWeight: "900" }}>
              Start with the photos.
            </Text>
            <Text style={{ color: theme.colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              Create one listing or drop in a batch, then tighten the details before publishing.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <BetaButton accessibilityLabel="Add collection item" onPress={addSampleItem}>
                Add item
              </BetaButton>
            </View>
            <View style={{ flex: 1 }}>
              <BetaButton
                accessibilityLabel="Bulk add collection photos"
                onPress={() => void addBulkPhotoDrafts()}
                variant="black"
              >
                Bulk photos
              </BetaButton>
            </View>
          </View>
        </BetaPanel>

        <BetaPanel>
          <TextInput
            accessibilityLabel="Search collection"
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder=""
            placeholderTextColor={theme.colors.inkMuted}
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              color: theme.colors.ink,
              fontSize: 16,
              minHeight: 52,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            }}
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
          <Text style={{ color: theme.colors.inkMuted, fontSize: 12, fontWeight: "800" }}>
            {filteredItems.length} / {visibleItems.length} shown
          </Text>
        </BetaPanel>

        {visibleItems.length === 0 ? (
          <ReleaseEmptyState
            actionLabel="Add collection item"
            message="Add one shirt with front/tag photos, size, condition, and trade preference. This unlocks matches and trade proposals."
            onAction={addSampleItem}
            title="Build your first collection piece"
          />
        ) : filteredItems.length === 0 ? (
          <ReleaseEmptyState
            message="No collection records match this search. Clear filters or add another piece."
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

export function WishlistTab({
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
          <TextInput
            accessibilityLabel="Search wishlist"
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder=""
            placeholderTextColor={theme.colors.inkMuted}
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              color: theme.colors.ink,
              fontSize: 16,
              minHeight: 52,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            }}
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
          <ReleaseEmptyState
            actionLabel="Add want"
            message="Add the first grail or target shirt. The wishlist is how Konnesor knows what trades to surface."
            onAction={addSampleWish}
            title="Rank your first want"
          />
        ) : filteredWants.length === 0 ? (
          <ReleaseEmptyState
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

export function MockupWishlistRow({
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

export const rankButtonStyle = {
  alignItems: "center" as const,
  backgroundColor: beta.colors.surfaceElevated,
  borderColor: beta.colors.border,
  borderRadius: beta.radius.sm,
  borderWidth: 1,
  height: 34,
  justifyContent: "center" as const,
  width: 38,
};

export const rankButtonTextStyle = {
  color: beta.colors.ink,
  fontSize: 18,
  fontWeight: "900" as const,
};

export function InventoryDetail({
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

  async function addPhoto(kind: ItemPhoto["kind"], source: ImageSource) {
    const photo = await pickItemPhoto(kind, currentItem.photos.length, source);
    if (!photo) {
      return;
    }

    updateItem(currentItem.id, { photos: [...currentItem.photos, photo] });
  }

  async function addVideoClip(source: ImageSource) {
    const clipUri = await pickItemVideoClip(source);
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
        <BackArrowButton accessibilityLabel="Back to collection" onPress={onBack} />
        <ItemDetailHero item={currentItem} publishReady={publishCheck.isValid} value={value} />
        <ItemPhotoGallery
          onRemovePhoto={removePhoto}
          onSetCover={setCoverPhoto}
          photos={item.photos}
          title={item.title || "Item"}
        />
        <PhotoActionGrid onAddPhoto={(kind, source) => void addPhoto(kind, source)} />
        <ItemVideoClip
          onAddVideo={(source) => void addVideoClip(source)}
          onRemoveVideo={removeVideoClip}
          videoUrl={item.verificationVideoUrl}
        />
        <CompFinderPanel
          item={currentItem}
          onApplyValue={(estimatedValue) => updateItem(currentItem.id, { estimatedValue })}
          seedLabel="Collection item comps"
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
        <ItemUploadReadinessPanel item={item} missing={publishCheck.missing} />
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
            accessibilityLabel="Hide item"
            onPress={() => void handleArchive()}
            variant="ghost"
          >
            Hide item
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

export function ItemDetailHero({
  item,
  publishReady,
  value,
}: {
  item: TradeableItem;
  publishReady: boolean;
  value: string;
}) {
  const title = item.title || "Untitled draft";
  const primaryPhoto = item.photos[0];
  const details = [
    item.category ? categoryLabels[item.category] : "No category",
    item.size ? sizeLabels[item.size] : "No size",
    item.condition ? conditionLabels[item.condition] : "Condition needed",
  ];

  return (
    <BetaPanel tone="black">
      <View style={{ flexDirection: "row", gap: beta.spacing.md }}>
        <View
          style={{
            alignItems: "center",
            aspectRatio: 0.78,
            backgroundColor: beta.colors.surfaceWarm,
            borderColor: beta.colors.borderStrong,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            flex: 0.92,
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {primaryPhoto ? (
            <Image
              accessibilityLabel={`${title} cover photo`}
              resizeMode="cover"
              source={{ uri: primaryPhoto.uri }}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
              Add cover
            </Text>
          )}
        </View>
        <View style={{ flex: 1, gap: beta.spacing.sm, justifyContent: "space-between" }}>
          <View style={{ gap: beta.spacing.xs }}>
            <BetaKicker>{publishReady ? "READY TO TRADE" : "DRAFT CHECK"}</BetaKicker>
            <Text
              style={{ color: beta.colors.ink, fontSize: 24, fontWeight: "900", lineHeight: 28 }}
            >
              {title}
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 18 }}>
              {details.join(" / ")}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: beta.colors.orangeSoft,
              borderColor: beta.colors.orange,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              padding: beta.spacing.sm,
            }}
          >
            <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
              ESTIMATED VALUE
            </Text>
            <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{value}</Text>
          </View>
          <Text
            style={{
              color: publishReady ? beta.colors.success : beta.colors.warning,
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {publishReady ? "All publish checks pass" : "Needs more listing proof"}
          </Text>
        </View>
      </View>
    </BetaPanel>
  );
}

export function InventoryEdit({
  item,
  onBack,
}: {
  item: TradeableItem | undefined;
  onBack: () => void;
}) {
  const theme = beta;
  const api = useApiClient();
  const { updateItem, upsertItemFromServer } = useCollectionState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | undefined>();
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!item) {
    return <MissingRecord title="Item not found" onBack={onBack} />;
  }
  const currentItem = item;

  async function applyAiSuggestions() {
    setIsSuggesting(true);

    try {
      const aiImage = await encodeListingPhotoForAi(getPrimaryLocalListingPhoto(currentItem)?.uri);
      const suggestions = await api.getItemAiSuggestions(
        aiImage ? { ...currentItem, aiImage } : currentItem,
      );
      const patch: Parameters<typeof updateItem>[1] = {
        aiSuggestions: suggestions,
        title: currentItem.title || suggestions.title || currentItem.title,
      };
      const category = currentItem.category ?? suggestions.category;
      const condition = currentItem.condition ?? suggestions.condition;
      const era = currentItem.era ?? suggestions.era;
      const size = currentItem.size ?? suggestions.size;
      const tag = currentItem.tag ?? suggestions.tag;
      if (category) patch.category = category;
      if (condition) patch.condition = condition;
      if (era) patch.era = era;
      if (size) patch.size = size;
      if (tag) patch.tag = tag;
      updateItem(currentItem.id, patch);
      Alert.alert("AI suggestions ready", "Suggestions were added for review.");
    } catch (error) {
      const suggestions = getMockAiListingSuggestions(currentItem);
      updateItem(currentItem.id, { aiSuggestions: suggestions });
      setSyncMessage(
        `Live AI suggestions unavailable. Local fallback added: ${getDiagnosticErrorMessage(error)}`,
      );
    } finally {
      setIsSuggesting(false);
    }
  }

  async function addPhoto(kind: ItemPhoto["kind"], source: ImageSource) {
    const photo = await pickItemPhoto(kind, currentItem.photos.length, source);
    if (!photo) {
      return;
    }

    updateItem(currentItem.id, { photos: [...currentItem.photos, photo] });
  }

  async function addVideoClip(source: ImageSource) {
    const clipUri = await pickItemVideoClip(source);
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
        <BackArrowButton accessibilityLabel="Back to item detail" onPress={onBack} />
        <View style={{ gap: theme.spacing.sm }}>
          <BetaKicker>ITEM BUILDER</BetaKicker>
          <BetaTitle>Shape the item record.</BetaTitle>
        </View>

        <BetaButton
          accessibilityLabel="Generate AI listing suggestions"
          loading={isSuggesting}
          onPress={() => void applyAiSuggestions()}
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
        <PhotoActionGrid onAddPhoto={(kind, source) => void addPhoto(kind, source)} />
        <ItemVideoClip
          onAddVideo={(source) => void addVideoClip(source)}
          onRemoveVideo={removeVideoClip}
          videoUrl={currentItem.verificationVideoUrl}
        />
        <CompFinderPanel
          item={currentItem}
          onApplyValue={(estimatedValue) => updateItem(currentItem.id, { estimatedValue })}
          seedLabel="Builder comp search"
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

export function WishlistDetail({
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
        <BackArrowButton accessibilityLabel="Back to wishlist" onPress={onBack} />
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
            ["Hidden", item.isArchived ? "Yes" : "No"],
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
            accessibilityLabel="Hide wishlist item"
            onPress={() => void handleArchiveWant()}
            variant="secondary"
          >
            Hide want
          </BetaButton>
        </View>
      </ScrollView>
    </BetaScreen>
  );
}

export function WishlistEdit({
  item,
  onBack,
}: {
  item: WishlistItem | undefined;
  onBack: () => void;
}) {
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
        <BackArrowButton accessibilityLabel="Back to wishlist detail" onPress={onBack} />
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

export function ItemPhotoGallery({
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

export function PhotoActionGrid({
  onAddPhoto,
}: {
  onAddPhoto: (kind: ItemPhoto["kind"], source: ImageSource) => void;
}) {
  const photoKinds: ItemPhoto["kind"][] = ["front", "back", "tag", "flaw", "detail"];

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>PHOTO UPLOADS</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
          Add proof shots
        </Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
          Use Camera for a new shot or Library for an existing image. If iOS blocks access, open
          Settings and allow Photos or Camera for Konnesor.
        </Text>
      </View>
      <View style={{ gap: beta.spacing.sm }}>
        {photoKinds.map((kind) => (
          <View
            key={kind}
            style={{
              backgroundColor: beta.colors.background,
              borderColor: beta.colors.borderStrong,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              gap: beta.spacing.sm,
              padding: beta.spacing.sm,
            }}
          >
            <Text style={{ color: beta.colors.ink, fontSize: 14, fontWeight: "900" }}>
              {itemPhotoKindLabels[kind]}
            </Text>
            <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <BetaButton
                  accessibilityLabel={`Take ${itemPhotoKindLabels[kind]} photo`}
                  onPress={() => onAddPhoto(kind, "camera")}
                  variant={kind === "front" ? "black" : "secondary"}
                >
                  Camera
                </BetaButton>
              </View>
              <View style={{ flex: 1 }}>
                <BetaButton
                  accessibilityLabel={`Choose ${itemPhotoKindLabels[kind]} photo`}
                  onPress={() => onAddPhoto(kind, "library")}
                  variant="secondary"
                >
                  Library
                </BetaButton>
              </View>
            </View>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

export function ItemVideoClip({
  onAddVideo,
  onRemoveVideo,
  videoUrl,
}: {
  onAddVideo: (source: ImageSource) => void;
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <BetaButton
            accessibilityLabel={
              videoUrl ? "Record replacement item video clip" : "Record item video clip"
            }
            onPress={() => onAddVideo("camera")}
            variant="black"
          >
            Record 5 sec
          </BetaButton>
        </View>
        <View style={{ flex: 1 }}>
          <BetaButton
            accessibilityLabel={
              videoUrl
                ? "Choose replacement item video clip"
                : "Choose item video clip from library"
            }
            onPress={() => onAddVideo("library")}
            variant={videoUrl ? "secondary" : "black"}
          >
            Choose clip
          </BetaButton>
        </View>
        {videoUrl ? (
          <View style={{ width: "100%" }}>
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

export function PublishReadinessChecklist({ missing }: { missing: string[] }) {
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

export function ItemUploadReadinessPanel({
  item,
  missing,
}: {
  item: TradeableItem;
  missing: string[];
}) {
  const hasKind = (kind: ItemPhoto["kind"]) => item.photos.some((photo) => photo.kind === kind);
  const requirements = [
    {
      complete: hasKind("front"),
      label: "Front photo",
      note: "Clear full front image.",
    },
    {
      complete: hasKind("back"),
      label: "Back photo",
      note: "Show print, blank, or back condition.",
    },
    {
      complete: hasKind("tag"),
      label: "Tag photo",
      note: "Brand, size, and era proof.",
    },
    {
      complete: hasKind("flaw") || item.flaws.length === 0,
      label: "Flaws disclosed",
      note: item.flaws.length === 0 ? "No flaws listed." : "Add flaw photos for listed issues.",
    },
    {
      complete: Boolean(item.measurements.chest && item.measurements.length),
      label: "Measurements",
      note: "Chest and length are enough for beta testing.",
    },
    {
      complete: Boolean(item.verificationVideoUrl),
      label: "5 sec loop",
      note: "Optional now, important for premium listings.",
    },
  ];

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>UPLOAD QUALITY</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
          {missing.length === 0 ? "Listing proof looks strong." : "Proof checklist for testers"}
        </Text>
        <BetaBody>This is the flow sellers should understand before Konnesor leaves beta.</BetaBody>
      </View>
      <View style={{ gap: beta.spacing.sm }}>
        {requirements.map((requirement) => (
          <View
            key={requirement.label}
            style={{
              borderColor: requirement.complete ? beta.colors.orange : beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              gap: 4,
              padding: beta.spacing.sm,
            }}
          >
            <Text
              style={{
                color: requirement.complete ? beta.colors.ink : beta.colors.inkMuted,
                fontSize: 14,
                fontWeight: "900",
              }}
            >
              {requirement.complete ? "OK " : "TODO "}
              {requirement.label}
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {requirement.note}
            </Text>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}
