/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/consistent-type-imports */
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
import { BackArrowButton } from "../screens/onboarding-flow";
export function OfflineModeBanner({
  detail,
  kind,
  visible,
}: {
  detail?: string | undefined;
  kind: "message" | "trade";
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  const noun = kind === "message" ? "message" : "trade";

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: beta.colors.orange,
        borderColor: beta.colors.orangePressed,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        gap: beta.spacing.xs,
        padding: beta.spacing.md,
      }}
    >
      <Text style={{ color: beta.colors.background, fontSize: 14, fontWeight: "900" }}>
        Offline mode
      </Text>
      <Text style={{ color: beta.colors.background, fontSize: 13, lineHeight: 18 }}>
        This {noun} will not reach anyone until the live API is back online.
      </Text>
      {detail ? (
        <Text style={{ color: beta.colors.background, fontSize: 11, fontWeight: "800" }}>
          Reason: {detail}
        </Text>
      ) : null}
    </View>
  );
}

export function shouldShowOfflineBanner(
  backendHealth: BackendHealthState,
  source: "api" | "local",
  fallback: BackendFallbackState | undefined,
  isLoading: boolean,
): boolean {
  return Boolean(
    !isLoading && (backendHealth.status === "offline" || source === "local" || fallback),
  );
}

export function getOfflineBannerReason(
  backendHealth: BackendHealthState,
  fallback: BackendFallbackState | undefined,
): string | undefined {
  if (fallback) {
    return `${fallback.operation}: ${fallback.reason}`;
  }
  if (backendHealth.status === "offline") {
    return backendHealth.reason ?? "Live API health check failed.";
  }
  return undefined;
}

export function BetaFeedbackPanel({
  feedbackItems,
  onSubmit,
}: {
  feedbackItems: BetaFeedback[];
  onSubmit: (input: Omit<BetaFeedback, "createdAt" | "id">) => void;
}) {
  const [blocker, setBlocker] = useState("");
  const [note, setNote] = useState("");
  const [role, setRole] = useState<BetaFeedback["role"]>("collector");
  const [screenshotNote, setScreenshotNote] = useState("");
  const [sentiment, setSentiment] = useState<BetaFeedback["sentiment"]>("love");
  const [worked, setWorked] = useState("");
  const latest = feedbackItems[0];

  function submit() {
    if (!note.trim() && !worked.trim() && !blocker.trim()) {
      Alert.alert("Add feedback", "Write at least one tester note before saving it.");
      return;
    }

    onSubmit({
      blocker: blocker.trim() || undefined,
      note: note.trim() || "Tester checkpoint saved.",
      role,
      screenshotNote: screenshotNote.trim() || undefined,
      sentiment,
      worked: worked.trim() || undefined,
    });
    setBlocker("");
    setNote("");
    setScreenshotNote("");
    setWorked("");
  }

  return (
    <BetaPanel>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>SELLER FEEDBACK</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
          Capture reactions while testers use it.
        </Text>
        <BetaBody>
          Save short notes from sellers, collectors, and beta testers so we know what to polish
          next.
        </BetaBody>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        {(["collector", "seller", "tester"] as BetaFeedback["role"][]).map((item) => (
          <BetaChip
            key={item}
            label={item === "collector" ? "Collector" : item === "seller" ? "Seller" : "Tester"}
            onPress={() => setRole(item)}
            selected={role === item}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        {(["love", "confusing", "blocked"] as BetaFeedback["sentiment"][]).map((item) => (
          <BetaChip
            key={item}
            label={item === "love" ? "Loved it" : item === "confusing" ? "Confusing" : "Blocked"}
            onPress={() => setSentiment(item)}
            selected={sentiment === item}
          />
        ))}
      </View>
      <BetaTextField
        label="What worked?"
        multiline
        numberOfLines={3}
        onChangeText={setWorked}
        placeholder="Example: photo upload felt clear, comps made sense, trade card looked good."
        style={{ minHeight: 76, textAlignVertical: "top" }}
        value={worked}
      />
      <BetaTextField
        label="What broke or confused them?"
        multiline
        numberOfLines={3}
        onChangeText={setBlocker}
        placeholder="Example: upload permission, wording, missing button, slow screen, unclear next step."
        style={{ minHeight: 76, textAlignVertical: "top" }}
        value={blocker}
      />
      <BetaTextField
        label="Release note"
        multiline
        numberOfLines={4}
        onChangeText={setNote}
        placeholder="What should we change before the next TestFlight build?"
        style={{ minHeight: 94, textAlignVertical: "top" }}
        value={note}
      />
      <BetaTextField
        label="Screenshot or screen"
        onChangeText={setScreenshotNote}
        placeholder="Example: Collection detail, Trade compose, Home match card"
        value={screenshotNote}
      />
      <BetaButton accessibilityLabel="Save beta feedback" onPress={submit} variant="black">
        Save feedback
      </BetaButton>
      {latest ? (
        <View style={{ gap: beta.spacing.xs }}>
          <Text style={{ color: beta.colors.ink, fontSize: 13, fontWeight: "900" }}>
            Latest: {latest.role} / {latest.sentiment}
          </Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
            {latest.note}
          </Text>
          {latest.blocker ? (
            <Text style={{ color: beta.colors.warning, fontSize: 12, lineHeight: 17 }}>
              Blocker: {latest.blocker}
            </Text>
          ) : null}
        </View>
      ) : null}
    </BetaPanel>
  );
}

export function ReleaseEmptyState({
  actionLabel,
  message,
  onAction,
  title,
}: {
  actionLabel?: string | undefined;
  message: string;
  onAction?: (() => void) | undefined;
  title: string;
}) {
  return (
    <BetaPanel>
      <View style={{ alignItems: "flex-start", flexDirection: "row", gap: beta.spacing.md }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: beta.colors.orangeSoft,
            borderColor: beta.colors.orange,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          <Text style={{ color: beta.colors.orange, fontSize: 22, fontWeight: "900" }}>K</Text>
        </View>
        <View style={{ flex: 1, gap: beta.spacing.xs }}>
          <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
            {message}
          </Text>
        </View>
      </View>
      {actionLabel && onAction ? (
        <BetaButton accessibilityLabel={actionLabel} onPress={onAction} variant="secondary">
          {actionLabel}
        </BetaButton>
      ) : null}
    </BetaPanel>
  );
}

export function TradeSafetyChecklist({ status }: { status: TradeStatus }) {
  const rows = [
    {
      done: status !== "pending",
      label: "Both item sides reviewed",
      note: "Compare front, back, tag, flaw/detail photos, and comp notes before acceptance.",
    },
    {
      done: ["accepted", "completed"].includes(status),
      label: "Measurements confirmed",
      note: "Chest, length, and any fit-critical measurements should be in the message thread.",
    },
    {
      done: ["accepted", "completed"].includes(status),
      label: "Shipping terms locked",
      note: "No one ships until address, carrier, tracking, and final trade terms are written down.",
    },
    {
      done: status === "completed",
      label: "Receipt confirmed",
      note: "Complete only after both collectors confirm the items arrived as described.",
    },
  ];

  return (
    <BetaPanel>
      <BetaKicker>TRADE SAFETY REVIEW</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 21, fontWeight: "900" }}>
        Protect the swap before it leaves either closet.
      </Text>
      <View style={{ gap: beta.spacing.sm }}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={{
              alignItems: "flex-start",
              backgroundColor: row.done ? beta.colors.orangeSoft : beta.colors.surfaceElevated,
              borderColor: row.done ? beta.colors.orange : beta.colors.border,
              borderRadius: beta.radius.md,
              borderWidth: 1,
              flexDirection: "row",
              gap: beta.spacing.sm,
              padding: beta.spacing.md,
            }}
          >
            <Text
              style={{
                color: row.done ? beta.colors.orange : beta.colors.inkMuted,
                fontSize: 14,
                fontWeight: "900",
              }}
            >
              {row.done ? "OK" : "TODO"}
            </Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: beta.colors.ink, fontSize: 14, fontWeight: "900" }}>
                {row.label}
              </Text>
              <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                {row.note}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

export function TrustSafetyPanel({ compact = false }: { compact?: boolean }) {
  const rows = [
    "Keep final trade terms inside the Konnesor thread.",
    "Require front, back, tag, flaw, and measurement proof before shipping.",
    "Use tracking for both sides and pause if terms change.",
  ];

  return (
    <BetaPanel tone={compact ? "white" : "black"}>
      <View style={{ gap: beta.spacing.xs }}>
        <BetaKicker>TRUST LAYER</BetaKicker>
        <Text style={{ color: beta.colors.ink, fontSize: compact ? 18 : 22, fontWeight: "900" }}>
          Trade safety checkpoints
        </Text>
      </View>
      <View style={{ gap: beta.spacing.sm }}>
        {rows.map((row) => (
          <View
            key={row}
            style={{ alignItems: "flex-start", flexDirection: "row", gap: beta.spacing.sm }}
          >
            <Text style={{ color: beta.colors.orange, fontSize: 14, fontWeight: "900" }}>OK</Text>
            <Text style={{ color: beta.colors.inkMuted, flex: 1, fontSize: 13, lineHeight: 19 }}>
              {row}
            </Text>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

export function MiniActionButton({ label, onPress }: { label: string; onPress: () => void }) {
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

export function MvpChecklistPanel({
  checklist,
  title,
}: {
  checklist: MvpChecklistItem[];
  title: string;
}) {
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

export function buildMvpChecklist({
  auth,
  collectionSummary,
  localSentMessageCount,
  localTradeCount,
  photoReadyCount,
  publishReadyCount,
  recommendationCount,
  wishlistSummary,
}: {
  auth: ReturnType<typeof useAuthSession>;
  collectionSummary: CollectionSummary;
  localSentMessageCount: number;
  localTradeCount: number;
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
      description: `${collectionSummary.totalItems} collection records, ${collectionSummary.tradeableItems} tradeable.`,
      done: collectionSummary.totalItems > 0,
      label: "Collection/listings",
    },
    {
      description: `${photoReadyCount} collection records have at least two photos attached.`,
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
      description:
        localTradeCount > 0
          ? `${localTradeCount} local beta trade proposal${localTradeCount === 1 ? "" : "s"} created.`
          : "Create one structured proposal from the Trades tab.",
      done: localTradeCount > 0,
      label: "Trade proposal flow",
    },
    {
      description:
        localSentMessageCount > 0
          ? `${localSentMessageCount} local beta message${localSentMessageCount === 1 ? "" : "s"} sent.`
          : "Send one message in a local or trade-linked thread.",
      done: localSentMessageCount > 0,
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

export function CollectorProfilePanel({
  auth,
  blockedUsers,
  checklist,
  collectionSummary,
  onBack,
  onOpenTab,
  onUnblockUser,
  photoReadyCount,
  profile,
  publishReadyCount,
  wishlistSummary,
}: {
  auth: ReturnType<typeof useAuthSession>;
  blockedUsers: BlockedUser[];
  checklist: MvpChecklistItem[];
  collectionSummary: CollectionSummary;
  onBack: () => void;
  onOpenTab: (tab: Tab) => void;
  onUnblockUser: (userId: string) => void;
  photoReadyCount: number;
  profile: UserProfile | undefined;
  publishReadyCount: number;
  wishlistSummary: WishlistSummary;
}) {
  const onboarding = useOnboardingState();
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
  const collectorRank =
    readinessScore >= 90
      ? "Elite Trader"
      : readinessScore >= 65
        ? "Verified Builder"
        : "Rising Collector";

  return (
    <BetaScreen>
      <ScrollView contentContainerStyle={{ gap: beta.spacing.lg, paddingBottom: beta.spacing.xl }}>
        <BackArrowButton accessibilityLabel="Back to home" onPress={onBack} />

        <BetaPanel tone="black">
          <View
            style={{
              backgroundColor: beta.colors.background,
              borderColor: beta.colors.orange,
              borderRadius: beta.radius.lg,
              borderWidth: 1,
              gap: beta.spacing.md,
              overflow: "hidden",
              padding: beta.spacing.md,
            }}
          >
            <View
              style={{
                backgroundColor: beta.colors.orange,
                height: 5,
                left: 0,
                position: "absolute",
                right: 0,
                top: 0,
              }}
            />

            <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.md }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: beta.colors.surface,
                  borderColor: beta.colors.orange,
                  borderRadius: beta.radius.lg,
                  borderWidth: 1,
                  height: 86,
                  justifyContent: "center",
                  width: 86,
                }}
              >
                <Image
                  accessibilityLabel="Konnesor symbol"
                  resizeMode="contain"
                  source={konnesorSymbol}
                  style={{ height: 70, width: 70 }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <BetaKicker>COLLECTOR CARD</BetaKicker>
                <Text style={{ color: beta.colors.ink, fontSize: 29, fontWeight: "900" }}>
                  {collectorName}
                </Text>
                <Text style={{ color: beta.colors.orange, fontSize: 14, fontWeight: "900" }}>
                  {collectorRank}
                </Text>
                <Text style={{ color: beta.colors.inkMuted, fontSize: 12 }}>{email}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
              {[
                ["Score", `${readinessScore}%`],
                ["Pieces", collectionSummary.totalItems],
                ["Wants", wishlistSummary.activeItems],
              ].map(([label, value]) => (
                <View
                  key={label}
                  style={{
                    backgroundColor: beta.colors.surfaceElevated,
                    borderColor: beta.colors.borderStrong,
                    borderRadius: beta.radius.md,
                    borderWidth: 1,
                    flex: 1,
                    padding: beta.spacing.sm,
                  }}
                >
                  <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
                    {value}
                  </Text>
                  <Text style={{ color: beta.colors.orange, fontSize: 10, fontWeight: "900" }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
              {["Vintage Tee Hunter", "Photo Proof", "Trade Ready"].map((badge) => (
                <View
                  key={badge}
                  style={{
                    backgroundColor: beta.colors.orangeSoft,
                    borderColor: beta.colors.orange,
                    borderRadius: 999,
                    borderWidth: 1,
                    paddingHorizontal: beta.spacing.md,
                    paddingVertical: beta.spacing.xs,
                  }}
                >
                  <Text style={{ color: beta.colors.ink, fontSize: 11, fontWeight: "900" }}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </BetaPanel>

        <BetaStatPanel
          stats={[
            { label: "Collection", value: collectionSummary.totalItems },
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

        <BlockedUsersPanel blockedUsers={blockedUsers} onUnblockUser={onUnblockUser} />

        <LegalLinksPanel />

        <DeleteAccountPanel auth={auth} onDeleted={onboarding.reset} />

        <BetaPanel>
          <BetaKicker>NEXT BEST ACTIONS</BetaKicker>
          <ProfileActionRow
            detail={`${collectionSummary.tradeableItems} tradeable pieces, ${collectionSummary.draftItems} drafts`}
            label="Review collection"
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

export function ProfileActionRow({
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

export function LegalConsentLine() {
  return (
    <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
      By continuing, you agree to our <LegalTextLink label="Terms of Service" type="terms" /> and{" "}
      <LegalTextLink label="Privacy Policy" type="privacy" />.
    </Text>
  );
}

export function LegalTextLink({ label, type }: { label: string; type: "privacy" | "terms" }) {
  const { privacyPolicyUrl, termsOfServiceUrl } = getMobileEnv();
  const url = type === "privacy" ? privacyPolicyUrl : termsOfServiceUrl;

  return (
    <Text
      accessibilityRole="link"
      onPress={() => void WebBrowser.openBrowserAsync(url)}
      style={{ color: beta.colors.orange, fontWeight: "900" }}
    >
      {label}
    </Text>
  );
}

export function LegalLinksPanel() {
  const { privacyPolicyUrl, termsOfServiceUrl } = getMobileEnv();

  return (
    <BetaPanel>
      <BetaKicker>LEGAL</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
        Privacy and terms
      </Text>
      <LegalLinkRow label="Privacy Policy" url={privacyPolicyUrl} />
      <LegalLinkRow label="Terms of Service" url={termsOfServiceUrl} />
    </BetaPanel>
  );
}

export function LegalLinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${label}`}
      accessibilityRole="link"
      onPress={() => void WebBrowser.openBrowserAsync(url)}
      style={({ pressed }) => ({
        alignItems: "center",
        borderTopColor: beta.colors.border,
        borderTopWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        opacity: pressed ? 0.78 : 1,
        paddingTop: beta.spacing.md,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: beta.colors.orange, fontSize: 20, fontWeight: "900" }}>›</Text>
    </Pressable>
  );
}

export function DeleteAccountPanel({
  auth,
  onDeleted,
}: {
  auth: ReturnType<typeof useAuthSession>;
  onDeleted: () => void;
}) {
  const api = useApiClient();
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = confirmation.trim().toUpperCase() === "DELETE";

  async function deleteAccount() {
    if (!canDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setMessage(undefined);

    try {
      await api.deleteMe();
      await auth.logout();
      onDeleted();
      setConfirmation("");
    } catch (error) {
      setMessage(
        auth.clerkEnabled
          ? `Delete failed: ${getDiagnosticErrorMessage(error)}`
          : "Live account deletion needs an API-backed session. Local beta data was cleared on this device.",
      );

      if (!auth.clerkEnabled) {
        await auth.logout();
        onDeleted();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <BetaPanel>
      <BetaKicker>ACCOUNT DELETION</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
        Delete account
      </Text>
      <BetaBody>
        Permanently removes your profile and personal data. Trade history is kept only in
        de-identified form so other collectors' records do not break.
      </BetaBody>
      <BetaTextField
        autoCapitalize="characters"
        label='Type "DELETE" to confirm'
        onChangeText={setConfirmation}
        placeholder="DELETE"
        value={confirmation}
      />
      <BetaButton
        accessibilityLabel="Delete Konnesor account"
        disabled={!canDelete}
        loading={isDeleting}
        onPress={() => void deleteAccount()}
        variant="ghost"
      >
        Delete Account
      </BetaButton>
      {message ? (
        <Text style={{ color: beta.colors.orange, fontSize: 13, lineHeight: 18 }}>{message}</Text>
      ) : null}
    </BetaPanel>
  );
}

export function BlockedUsersPanel({
  blockedUsers,
  onUnblockUser,
}: {
  blockedUsers: BlockedUser[];
  onUnblockUser: (userId: string) => void;
}) {
  const api = useApiClient();
  const [message, setMessage] = useState<string | undefined>();

  async function unblockUser(user: BlockedUser) {
    onUnblockUser(user.userId);
    setMessage(`${user.displayName} can message and trade with you again.`);

    if (!isUuid(user.userId)) {
      return;
    }

    try {
      await api.unblockUser(user.userId);
    } catch (error) {
      console.log("[Konnesor moderation] unblock fallback", {
        error: getDiagnosticErrorMessage(error),
        userId: user.userId,
      });
      setMessage("Unblocked locally. Live sync will retry when the API is available.");
    }
  }

  return (
    <BetaPanel>
      <BetaKicker>BLOCKED USERS</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 22, fontWeight: "900" }}>
        Message controls
      </Text>
      <BetaBody>
        Blocked collectors are hidden from local messages and trades on this device. Live blocks
        sync when the API is reachable.
      </BetaBody>
      {blockedUsers.length === 0 ? (
        <Text style={{ color: beta.colors.inkMuted, fontSize: 14 }}>No blocked users.</Text>
      ) : (
        blockedUsers.map((user) => (
          <View
            key={user.userId}
            style={{
              alignItems: "center",
              borderTopColor: beta.colors.border,
              borderTopWidth: 1,
              flexDirection: "row",
              gap: beta.spacing.md,
              paddingTop: beta.spacing.md,
            }}
          >
            <AvatarBadge label={user.displayName} tone="person" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: beta.colors.ink, fontSize: 15, fontWeight: "900" }}>
                {user.displayName}
              </Text>
              <Text style={{ color: beta.colors.inkMuted, fontSize: 12 }}>
                Blocked {new Date(user.blockedAt).toLocaleDateString()}
              </Text>
            </View>
            <BetaButton
              accessibilityLabel={`Unblock ${user.displayName}`}
              onPress={() => void unblockUser(user)}
              variant="secondary"
            >
              Unblock
            </BetaButton>
          </View>
        ))
      )}
      {message ? <Text style={{ color: beta.colors.orange, fontSize: 13 }}>{message}</Text> : null}
    </BetaPanel>
  );
}

export function ModerationActionsPanel({
  onBlock,
  onReport,
  target,
}: {
  onBlock: (target: ModerationTarget) => Promise<void> | void;
  onReport: (
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) => Promise<void> | void;
  target: ModerationTarget;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState<ReportReason>("inappropriate_content");
  const [status, setStatus] = useState<string | undefined>();
  const [isWorking, setIsWorking] = useState(false);

  async function submitReport() {
    setIsWorking(true);
    setStatus(undefined);
    try {
      await onReport(target, reason, note.trim() || undefined);
      setStatus("Report submitted.");
      setNote("");
    } catch (error) {
      setStatus(getDiagnosticErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  async function blockUser() {
    setIsWorking(true);
    setStatus(undefined);
    try {
      await onBlock(target);
      setStatus(`${target.displayName} blocked.`);
    } catch (error) {
      setStatus(getDiagnosticErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <BetaPanel>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => ({
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <View style={{ flex: 1, gap: beta.spacing.xs }}>
          <BetaKicker>SAFETY</BetaKicker>
          <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
            Report or block {target.displayName}
          </Text>
        </View>
        <Text style={{ color: beta.colors.orange, fontSize: 24, fontWeight: "900" }}>
          {isOpen ? "−" : "+"}
        </Text>
      </Pressable>

      {isOpen ? (
        <View style={{ gap: beta.spacing.md }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
            {reportReasonOptions.map((option) => (
              <BetaChip
                key={option.value}
                label={option.label}
                onPress={() => setReason(option.value)}
                selected={reason === option.value}
              />
            ))}
          </View>
          <BetaTextField
            label="Optional note"
            multiline
            numberOfLines={3}
            onChangeText={setNote}
            placeholder="Add details for the moderation team."
            style={{ minHeight: 82, textAlignVertical: "top" }}
            value={note}
          />
          <View style={{ gap: beta.spacing.sm }}>
            <BetaButton
              accessibilityLabel={`Report ${target.displayName}`}
              loading={isWorking}
              onPress={() => void submitReport()}
              variant="secondary"
            >
              Submit report
            </BetaButton>
            <BetaButton
              accessibilityLabel={`Block ${target.displayName}`}
              loading={isWorking}
              onPress={() => void blockUser()}
              variant="ghost"
            >
              Block user
            </BetaButton>
          </View>
          {status ? (
            <Text style={{ color: beta.colors.orange, fontSize: 13, lineHeight: 18 }}>
              {status}
            </Text>
          ) : null}
        </View>
      ) : null}
    </BetaPanel>
  );
}

export function DetailPanel({ rows, title }: { rows: [string, string][]; title: string }) {
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

export function ItemThumb({
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

export function AvatarBadge({
  label,
  tone = "person",
}: {
  label: string;
  tone?: "brand" | "person";
}) {
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

export function TradeProgressRail({ status }: { status: TradeStatus }) {
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

export function getTradeProgressIndex(status: TradeStatus): number {
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

export function MissingRecord({ onBack, title }: { onBack: () => void; title: string }) {
  const theme = beta;

  return (
    <BetaScreen>
      <View style={{ gap: theme.spacing.md }}>
        <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
        <BetaTitle size={24}>{title}</BetaTitle>
      </View>
    </BetaScreen>
  );
}

export function isLocalRecordId(id: string): boolean {
  return id.startsWith("item_") || id.startsWith("wish_") || id.startsWith("local_");
}

export async function pickItemPhoto(
  kind: ItemPhoto["kind"],
  sortOrder: number,
  source: ImageSource,
): Promise<ItemPhoto | undefined> {
  const uri = await pickImageUri({
    aspect: [4, 5],
    permissionCopy:
      source === "camera"
        ? "Allow camera access so Konnesor can take front, back, tag, flaw, and detail photos."
        : "Allow photo access so Konnesor can attach front, back, tag, flaw, and detail photos to your listing.",
    source,
  });

  if (!uri) {
    return undefined;
  }

  if (!isUsableLocalAssetUri(uri)) {
    Alert.alert(
      "Photo could not be used",
      "The image picker returned a file Konnesor could not read. Try the other upload option or choose a different photo.",
    );
    return undefined;
  }

  return {
    createdAt: new Date().toISOString(),
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    sortOrder,
    uri,
  };
}

export async function pickBulkItemPhotos(): Promise<ItemPhoto[]> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo permission needed",
        permission.canAskAgain
          ? "Allow photo access so Konnesor can create draft listings from multiple item photos."
          : "Allow photo access so Konnesor can create draft listings. Open iPhone Settings, choose Konnesor, then allow Photos access.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      orderedSelection: true,
      quality: 0.86,
      selectionLimit: 12,
    });

    if (result.canceled || result.assets.length === 0) {
      return [];
    }

    const now = Date.now();
    return result.assets
      .map((asset, index): ItemPhoto | undefined => {
        if (!asset.uri || !isUsableLocalAssetUri(asset.uri)) {
          return undefined;
        }

        return {
          createdAt: new Date().toISOString(),
          id: `photo_${now}_${index}_${Math.random().toString(36).slice(2, 8)}`,
          kind: "front",
          sortOrder: 0,
          uri: asset.uri,
        };
      })
      .filter((photo): photo is ItemPhoto => Boolean(photo));
  } catch (error) {
    Alert.alert(
      "Bulk upload unavailable",
      error instanceof Error ? error.message : "Konnesor could not open the photo library.",
    );
    return [];
  }
}

export async function pickCompScanPhoto(source: "camera" | "library"): Promise<string | undefined> {
  return pickImageUri({
    aspect: [4, 5],
    permissionCopy:
      source === "camera"
        ? "Allow camera access so Konnesor can scan item photos for comp research."
        : "Allow photo access so Konnesor can use item photos for comp research.",
    source,
  });
}

export async function pickItemVideoClip(source: ImageSource): Promise<string | undefined> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    const permissionCopy =
      source === "camera"
        ? "Allow camera access so Konnesor can record 5 second item clips."
        : "Allow photo access so Konnesor can attach short item clips to your listing.";
    Alert.alert(
      source === "camera" ? "Camera permission needed" : "Photo permission needed",
      permission.canAskAgain
        ? permissionCopy
        : `${permissionCopy} Open iPhone Settings, choose Konnesor, then allow access.`,
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
    return undefined;
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          mediaTypes: ["videos"],
          quality: 0.72,
          videoMaxDuration: 5,
        })
      : await ImagePicker.launchImageLibraryAsync({
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

async function pickImageUri({
  aspect,
  permissionCopy,
  source,
}: {
  aspect: [number, number];
  permissionCopy: string;
  source: ImageSource;
}): Promise<string | undefined> {
  try {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        source === "camera" ? "Camera permission needed" : "Photo permission needed",
        permission.canAskAgain
          ? permissionCopy
          : `${permissionCopy} Open iPhone Settings, choose Konnesor, then allow access.`,
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
      return undefined;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.82,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.82,
          });

    if (result.canceled) {
      return undefined;
    }

    const uri = result.assets[0]?.uri;
    if (!uri || !isUsableLocalAssetUri(uri)) {
      Alert.alert(
        "Photo did not attach",
        "Konnesor did not receive a usable image from iOS. Try again, or use the other upload option.",
      );
      return undefined;
    }

    return uri;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image picker could not open.";
    Alert.alert(
      source === "camera" ? "Camera upload failed" : "Photo upload failed",
      `${message}\n\nTry the other upload option, then check iPhone Settings > Konnesor if it still fails.`,
    );
    return undefined;
  }
}

export function isUsableLocalAssetUri(uri: string): boolean {
  return uri.startsWith("file:") || uri.startsWith("content:") || uri.startsWith("asset:");
}
