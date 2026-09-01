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
import { BackArrowButton } from "./onboarding-flow";
import { pickCompScanPhoto } from "../components/shared-panels";
export function CompFinderScreen({
  item,
  onBack,
}: {
  item: TradeableItem | undefined;
  onBack: () => void;
}) {
  return (
    <BetaScreen>
      <ScrollView contentContainerStyle={{ gap: beta.spacing.lg, paddingBottom: beta.spacing.xl }}>
        <BackArrowButton accessibilityLabel="Back to home" onPress={onBack} />
        <CompFinderPanel item={item} seedLabel="Home comp finder" />
      </ScrollView>
    </BetaScreen>
  );
}

export const compSources: CompSource[] = [
  {
    id: "google",
    label: "Google",
    note: "Broad web scan",
    url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "ebaySold",
    label: "eBay sold",
    note: "Best quick comp",
    url: (query) =>
      `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1`,
  },
  {
    id: "ebayActive",
    label: "eBay active",
    note: "Current asks",
    url: (query) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
  },
  {
    id: "grailed",
    label: "Grailed",
    note: "Menswear market",
    url: (query) => `https://www.grailed.com/shop/${encodeURIComponent(query)}`,
  },
  {
    id: "depop",
    label: "Depop",
    note: "Street resale",
    url: (query) => `https://www.depop.com/search/?q=${encodeURIComponent(query)}`,
  },
  {
    id: "etsy",
    label: "Etsy",
    note: "Vintage sellers",
    url: (query) => `https://www.etsy.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "mercari",
    label: "Mercari",
    note: "Casual comps",
    url: (query) => `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`,
  },
  {
    id: "poshmark",
    label: "Poshmark",
    note: "Listing range",
    url: (query) =>
      `https://poshmark.com/search?query=${encodeURIComponent(query)}&type=listings&src=dir`,
  },
];

export function CompFinderPanel({
  compact = false,
  item,
  onApplyValue,
  seedLabel,
}: {
  compact?: boolean;
  item: TradeableItem | undefined;
  onApplyValue?: (estimatedValue: TradeableItem["estimatedValue"]) => void;
  seedLabel: string;
}) {
  const [manualClues, setManualClues] = useState("");
  const [note, setNote] = useState("");
  const [rangeMax, setRangeMax] = useState(item?.estimatedValue.max?.toString() ?? "");
  const [rangeMin, setRangeMin] = useState(item?.estimatedValue.min?.toString() ?? "");
  const [scanPhotoUri, setScanPhotoUri] = useState<string | undefined>();
  const compQuery = useMemo(() => buildCompSearchQuery(item, manualClues), [item, manualClues]);
  const queryParts = useMemo(() => getCompQueryParts(item, manualClues), [item, manualClues]);
  const readiness = useMemo(
    () => getCompReadiness(item, manualClues, scanPhotoUri),
    [item, manualClues, scanPhotoUri],
  );

  async function addScanPhoto(source: "camera" | "library") {
    const uri = await pickCompScanPhoto(source);
    if (uri) {
      setScanPhotoUri(uri);
    }
  }

  async function openSource(source: CompSource) {
    const query = compQuery.trim();
    if (!query) {
      Alert.alert(
        "Add search details",
        "Enter a brand, graphic, team, band, tag, or era before opening comps.",
      );
      return;
    }

    await Linking.openURL(source.url(query));
  }

  function applyValueRange() {
    const min = parseOptionalDollarAmount(rangeMin);
    const max = parseOptionalDollarAmount(rangeMax);
    if (min === undefined && max === undefined) {
      Alert.alert("Add a comp range", "Enter a low or high comp value before saving.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      Alert.alert("Range needs review", "The low comp value should be below the high comp value.");
      return;
    }
    if (!onApplyValue) {
      Alert.alert("Open an item first", "Save a value range from a collection item detail screen.");
      return;
    }

    onApplyValue({ currency: "USD", max, min });
    Alert.alert("Comp range saved", "The item value range was updated on this listing.");
  }

  return (
    <BetaPanel tone="black">
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>{seedLabel.toUpperCase()}</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: compact ? 22 : 24, fontWeight: "900" }}>
          Comp Finder
        </Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
          Build a smart search from the item record, then open comps across resale marketplaces.
        </Text>
      </View>

      {scanPhotoUri ? (
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: beta.spacing.md,
          }}
        >
          <Image
            accessibilityLabel="Comp scan photo"
            source={{ uri: scanPhotoUri }}
            style={{
              backgroundColor: beta.colors.surfaceWarm,
              borderColor: beta.colors.borderStrong,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              height: 76,
              width: 76,
            }}
          />
          <View style={{ flex: 1, gap: beta.spacing.xs }}>
            <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900" }}>
              Photo attached for manual review
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              MVP comps use search terms now. Full visual recognition can plug into this panel
              later.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <BetaButton
            accessibilityLabel="Take comp scan photo"
            onPress={() => void addScanPhoto("camera")}
            variant="secondary"
          >
            Camera
          </BetaButton>
        </View>
        <View style={{ flex: 1 }}>
          <BetaButton
            accessibilityLabel="Choose comp scan photo"
            onPress={() => void addScanPhoto("library")}
            variant="secondary"
          >
            Library
          </BetaButton>
        </View>
      </View>

      <BetaTextField
        autoCapitalize="words"
        label="Search clues"
        onChangeText={setManualClues}
        placeholder="Add graphic text, band, team, tag, year, color"
        value={manualClues}
      />

      {!compact ? <CompReadinessChecklist items={readiness} /> : null}

      <View
        style={{
          backgroundColor: beta.colors.background,
          borderColor: beta.colors.borderStrong,
          borderRadius: beta.radius.md,
          borderWidth: 1,
          gap: beta.spacing.sm,
          padding: beta.spacing.md,
        }}
      >
        <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
          GENERATED SEARCH
        </Text>
        <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900", lineHeight: 21 }}>
          {compQuery || "Add an item or search clues to generate comps."}
        </Text>
        {queryParts.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.xs }}>
            {queryParts.slice(0, compact ? 5 : 8).map((part) => (
              <View
                key={part}
                style={{
                  backgroundColor: beta.colors.orangeSoft,
                  borderColor: beta.colors.borderStrong,
                  borderRadius: 999,
                  borderWidth: 1,
                  paddingHorizontal: beta.spacing.sm,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: beta.colors.ink, fontSize: 11, fontWeight: "800" }}>
                  {part}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        {compSources.map((source) => (
          <Pressable
            accessibilityLabel={`Open ${source.label} comps`}
            accessibilityRole="button"
            key={source.id}
            onPress={() => void openSource(source)}
            style={({ pressed }) => ({
              backgroundColor: beta.colors.surface,
              borderColor: beta.colors.borderStrong,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              minWidth: "47%",
              opacity: pressed ? 0.82 : 1,
              padding: beta.spacing.md,
            })}
          >
            <Text
              style={{
                color: source.id === "ebaySold" ? beta.colors.orange : beta.colors.ink,
                fontSize: 15,
                fontWeight: "900",
              }}
            >
              {source.label}
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 11, marginTop: 4 }}>
              {source.note}
            </Text>
          </Pressable>
        ))}
      </View>

      {!compact ? (
        <View style={{ gap: beta.spacing.md }}>
          <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <BetaTextField
                keyboardType="numeric"
                label="Low comp"
                onChangeText={setRangeMin}
                placeholder="120"
                value={rangeMin}
              />
            </View>
            <View style={{ flex: 1 }}>
              <BetaTextField
                keyboardType="numeric"
                label="High comp"
                onChangeText={setRangeMax}
                placeholder="220"
                value={rangeMax}
              />
            </View>
          </View>
          <BetaTextField
            label="Comp note"
            multiline
            numberOfLines={3}
            onChangeText={setNote}
            placeholder="Sold listing, tag match, condition difference, missing measurements"
            style={{ minHeight: 92, textAlignVertical: "top" }}
            value={note}
          />
          <BetaButton
            accessibilityLabel="Save comp value range"
            disabled={!onApplyValue}
            onPress={applyValueRange}
          >
            Save value range
          </BetaButton>
        </View>
      ) : null}

      <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 18 }}>
        Comp Finder opens outside search results for beta. Treat values as research leads until tag,
        condition, measurements, sold-price evidence, and listing dates are verified.
      </Text>
    </BetaPanel>
  );
}

export function CompReadinessChecklist({
  items,
}: {
  items: Array<{ complete: boolean; label: string; note: string }>;
}) {
  const completeCount = items.filter((item) => item.complete).length;

  return (
    <View
      style={{
        backgroundColor: beta.colors.background,
        borderColor: beta.colors.borderStrong,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        gap: beta.spacing.sm,
        padding: beta.spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", gap: beta.spacing.sm, justifyContent: "space-between" }}>
        <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>
          Research readiness
        </Text>
        <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
          {completeCount}/{items.length}
        </Text>
      </View>
      {items.map((item) => (
        <View
          key={item.label}
          style={{ alignItems: "flex-start", flexDirection: "row", gap: beta.spacing.sm }}
        >
          <View
            style={{
              backgroundColor: item.complete ? beta.colors.orange : "transparent",
              borderColor: item.complete ? beta.colors.orange : beta.colors.borderStrong,
              borderRadius: 999,
              borderWidth: 1,
              height: 12,
              marginTop: 4,
              width: 12,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: beta.colors.ink, fontSize: 13, fontWeight: "900" }}>
              {item.label}
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
              {item.note}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function getCompQueryParts(item: TradeableItem | undefined, manualClues: string): string[] {
  const parts = [
    manualClues.trim(),
    item?.title,
    item?.era,
    item?.tag,
    item?.category ? categoryLabels[item.category] : undefined,
    item?.size ? sizeLabels[item.size] : undefined,
    item?.condition ? conditionLabels[item.condition] : undefined,
    "vintage t shirt",
  ];

  return Array.from(
    new Set(
      parts
        .filter((part): part is string => Boolean(part?.trim()))
        .map((part) => part.trim().replace(/\s+/g, " ")),
    ),
  );
}

export function buildCompSearchQuery(item: TradeableItem | undefined, manualClues: string): string {
  return getCompQueryParts(item, manualClues).join(" ");
}

export function getCompReadiness(
  item: TradeableItem | undefined,
  manualClues: string,
  scanPhotoUri: string | undefined,
): Array<{ complete: boolean; label: string; note: string }> {
  return [
    {
      complete: Boolean(item?.title.trim() || manualClues.trim()),
      label: "Search phrase",
      note: "Use exact graphic text, team, band, movie, or event words.",
    },
    {
      complete: Boolean(item?.tag || manualClues.toLowerCase().includes("tag")),
      label: "Tag or maker",
      note: "Tag matches are often the difference between weak and strong comps.",
    },
    {
      complete: Boolean(item?.era || /\b(19|20)\d{2}s?\b/.test(manualClues)),
      label: "Era clue",
      note: "Add decade or year if the graphic, tag, or copyright gives one.",
    },
    {
      complete: Boolean(item?.size || item?.measurements.chest || item?.measurements.length),
      label: "Size evidence",
      note: "Compare listed size and flat measurements before trusting price.",
    },
    {
      complete: Boolean(scanPhotoUri || item?.photos.length),
      label: "Photo reference",
      note: "Keep the item photo visible while checking sold listings.",
    },
  ];
}

export function parseOptionalDollarAmount(value: string): number | undefined {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) {
    return undefined;
  }

  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : undefined;
}

export function getPhotoSummary(photos: ItemPhoto[]): string {
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
