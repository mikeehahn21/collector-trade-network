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
import { DetailPanel, LegalConsentLine } from "../components/shared-panels";
export const conceptSlides = [
  {
    body: "Konnesor lets you trade items directly with other collectors. No cash required.",
    title: "Trade instead of buy or sell",
  },
  {
    body: "Browse someone's items, propose a trade with something of yours, and chat through the details before agreeing.",
    title: "Propose, chat, agree",
  },
  {
    body: "Add photos and details of what you're willing to trade so others can find and propose to you.",
    title: "List your own stuff",
  },
  {
    body: "Both sides confirm when a trade is complete. Your trade history builds a reputation other collectors can see.",
    title: "Built on trust",
  },
];

export type OnboardingSetupStep =
  | "collectorType"
  | "wornSizes"
  | "collectedSizes"
  | "categories"
  | "tradePreference"
  | "communicationPreference"
  | "notifications";

export const onboardingSetupSteps: Array<{ id: OnboardingSetupStep; label: string }> = [
  { id: "collectorType", label: "Role" },
  { id: "wornSizes", label: "Wear" },
  { id: "collectedSizes", label: "Collect" },
  { id: "categories", label: "Categories" },
  { id: "tradePreference", label: "Trades" },
  { id: "communicationPreference", label: "Messages" },
  { id: "notifications", label: "Alerts" },
];

export function FirstRunOnboardingFlow() {
  const onboarding = useOnboardingState();
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(width, 430) - 32;
  const slideRef = useRef<ScrollView>(null);
  const [phase, setPhase] = useState<"concept" | "setup">("concept");
  const [slideIndex, setSlideIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = onboardingSetupSteps[stepIndex]?.id ?? "collectorType";

  function goToSetup() {
    setPhase("setup");
    setStepIndex(0);
  }

  function goToNextSlide() {
    const nextIndex = slideIndex + 1;
    if (nextIndex >= conceptSlides.length) {
      goToSetup();
      return;
    }

    setSlideIndex(nextIndex);
    slideRef.current?.scrollTo({ animated: true, x: nextIndex * slideWidth, y: 0 });
  }

  function handleSlideMomentum(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setSlideIndex(Math.max(0, Math.min(conceptSlides.length - 1, nextIndex)));
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      return;
    }

    setPhase("concept");
    setSlideIndex(conceptSlides.length - 1);
    requestAnimationFrame(() => {
      slideRef.current?.scrollTo({
        animated: false,
        x: (conceptSlides.length - 1) * slideWidth,
        y: 0,
      });
    });
  }

  function goForward() {
    if (stepIndex >= onboardingSetupSteps.length - 1) {
      onboarding.completeOnboarding();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  const canContinue = isOnboardingStepReady(activeStep, onboarding.state);

  if (phase === "concept") {
    return (
      <BetaScreen>
        <View style={{ flex: 1, gap: beta.spacing.lg }}>
          <View style={{ alignItems: "flex-end" }}>
            <Pressable
              accessibilityLabel="Skip concept walkthrough"
              accessibilityRole="button"
              onPress={goToSetup}
              style={({ pressed }) => ({
                opacity: pressed ? 0.72 : 1,
                paddingHorizontal: beta.spacing.sm,
                paddingVertical: beta.spacing.xs,
              })}
            >
              <Text style={{ color: beta.colors.inkMuted, fontSize: 14, fontWeight: "900" }}>
                Skip
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            onMomentumScrollEnd={handleSlideMomentum}
            pagingEnabled
            ref={slideRef}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            {conceptSlides.map((slide, index) => (
              <View
                key={slide.title}
                style={{ paddingRight: index === 3 ? 0 : 12, width: slideWidth }}
              >
                <BetaPanel tone="black">
                  <View
                    style={{
                      alignItems: "center",
                      aspectRatio: 1.45,
                      backgroundColor: beta.colors.surfaceWarm,
                      borderColor: beta.colors.borderStrong,
                      borderRadius: beta.radius.lg,
                      borderWidth: 1,
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: beta.colors.orangeSoft,
                        borderColor: beta.colors.orange,
                        borderRadius: 999,
                        borderWidth: 1,
                        height: 112,
                        opacity: 0.92,
                        position: "absolute",
                        transform: [{ rotate: "-18deg" }],
                        width: 260,
                      }}
                    />
                    <Text
                      style={{
                        color: beta.colors.orange,
                        fontSize: 52,
                        fontWeight: "900",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <BetaKicker>KONNESOR BASICS</BetaKicker>
                  <Text
                    style={{
                      color: beta.colors.ink,
                      fontSize: 32,
                      fontWeight: "900",
                      lineHeight: 36,
                    }}
                  >
                    {slide.title}
                  </Text>
                  <BetaBody>{slide.body}</BetaBody>
                </BetaPanel>
              </View>
            ))}
          </ScrollView>

          <OnboardingProgressDots count={conceptSlides.length} index={slideIndex} />

          <View style={{ marginTop: "auto" }}>
            <BetaButton accessibilityLabel="Continue onboarding" onPress={goToNextSlide}>
              {slideIndex === conceptSlides.length - 1 ? "Set up profile" : "Next"}
            </BetaButton>
            <LegalConsentLine />
          </View>
        </View>
      </BetaScreen>
    );
  }

  return (
    <BetaScreen>
      <ScrollView contentContainerStyle={{ gap: beta.spacing.lg, paddingBottom: beta.spacing.xl }}>
        <View style={{ gap: beta.spacing.sm }}>
          <BetaKicker>
            PROFILE SETUP {stepIndex + 1}/{onboardingSetupSteps.length}
          </BetaKicker>
          <OnboardingProgressBar index={stepIndex} total={onboardingSetupSteps.length} />
        </View>

        {activeStep === "collectorType" ? <CollectorTypeStep /> : null}
        {activeStep === "wornSizes" ? <SizesStep mode="worn" /> : null}
        {activeStep === "collectedSizes" ? <SizesStep mode="collected" /> : null}
        {activeStep === "categories" ? <CategoriesStep /> : null}
        {activeStep === "tradePreference" ? <TradePreferenceStep /> : null}
        {activeStep === "communicationPreference" ? <CommunicationPreferenceStep /> : null}
        {activeStep === "notifications" ? <NotificationsStep /> : null}

        <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Back one onboarding step"
              onPress={goBack}
              variant="secondary"
            >
              Back
            </BetaButton>
          </View>
          <View style={{ flex: 1 }}>
            <BetaButton
              accessibilityLabel="Continue profile setup"
              disabled={!canContinue}
              onPress={goForward}
            >
              {stepIndex === onboardingSetupSteps.length - 1 ? "Finish" : "Next"}
            </BetaButton>
          </View>
        </View>
        <LegalConsentLine />
      </ScrollView>
    </BetaScreen>
  );
}

export function CollectorTypeStep() {
  const { setCollectorType, state } = useOnboardingState();

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader
        body="Choose the closest fit. This helps Konnesor shape recommendations and trade language."
        title="What kind of collector are you?"
      />
      {collectorTypeOptions.map((option) => (
        <BetaChoice
          description={option.description}
          key={option.value}
          label={option.label}
          onPress={() => setCollectorType(option.value)}
          selected={state.collectorType === option.value}
        />
      ))}
    </BetaPanel>
  );
}

export function SizesStep({ mode }: { mode: "collected" | "worn" }) {
  const { setSizes, state } = useOnboardingState();
  const selected = mode === "worn" ? state.wornSizes : state.collectedSizes;
  const title = mode === "worn" ? "What sizes do you wear?" : "What sizes do you collect?";
  const body =
    mode === "worn"
      ? "Pick the sizes you personally wear most often."
      : "Pick the sizes you actively collect or would trade for.";

  function toggleSize(size: ShirtSize) {
    const nextSelected = toggleArrayValue(selected, size);
    if (mode === "worn") {
      setSizes(nextSelected, state.collectedSizes);
      return;
    }

    setSizes(state.wornSizes, nextSelected);
  }

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader body={body} title={title} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        {sizeOptions.map((size) => (
          <OnboardingPill
            key={size}
            label={sizeLabels[size]}
            onPress={() => toggleSize(size)}
            selected={selected.includes(size)}
          />
        ))}
      </View>
    </BetaPanel>
  );
}

export function CategoriesStep() {
  const { setCategories, state } = useOnboardingState();

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader
        body="Choose every lane you want Konnesor to use when matching trades."
        title="What do you collect?"
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: beta.spacing.sm }}>
        {categoryOptions.map((category) => (
          <OnboardingPill
            key={category}
            label={categoryLabels[category]}
            onPress={() => setCategories(toggleArrayValue(state.categories, category))}
            selected={state.categories.includes(category)}
          />
        ))}
      </View>
    </BetaPanel>
  );
}

export function TradePreferenceStep() {
  const { setTradePreferences, state } = useOnboardingState();
  const tradePreference = state.tradePreference ?? "all_serious_offers";

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader
        body="Set the default trade posture for your collection."
        title="How should people offer?"
      />
      {tradeOfferPreferenceOptions.map((option) => (
        <BetaChoice
          description={option.description}
          key={option.value}
          label={option.label}
          onPress={() => setTradePreferences(option.value, state.acceptsCashAdjustments)}
          selected={tradePreference === option.value}
        />
      ))}
      <OnboardingSwitchRow
        label="Allow cash adjustments"
        onValueChange={(value) => setTradePreferences(tradePreference, value)}
        value={state.acceptsCashAdjustments}
      />
    </BetaPanel>
  );
}

export function CommunicationPreferenceStep() {
  const { setCommunicationPreferences, state } = useOnboardingState();
  const communicationPreference = state.communicationPreference ?? "approved_traders";

  function updatePreference(value: CommunicationPreference) {
    setCommunicationPreferences(value, state.allowsPhotoRequests, state.allowsMeasurementRequests);
  }

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader
        body="Choose who can start trade and item conversations with you."
        title="Who can message you?"
      />
      {communicationPreferenceOptions.map((option) => (
        <BetaChoice
          description={option.description}
          key={option.value}
          label={option.label}
          onPress={() => updatePreference(option.value)}
          selected={communicationPreference === option.value}
        />
      ))}
      <OnboardingSwitchRow
        label="Allow photo requests"
        onValueChange={(value) =>
          setCommunicationPreferences(
            communicationPreference,
            value,
            state.allowsMeasurementRequests,
          )
        }
        value={state.allowsPhotoRequests}
      />
      <OnboardingSwitchRow
        label="Allow measurement requests"
        onValueChange={(value) =>
          setCommunicationPreferences(communicationPreference, state.allowsPhotoRequests, value)
        }
        value={state.allowsMeasurementRequests}
      />
    </BetaPanel>
  );
}

export function NotificationsStep() {
  const { setNotifications, state } = useOnboardingState();

  return (
    <BetaPanel tone="black">
      <OnboardingStepHeader
        body="You can change this later. For beta, this only saves your preference."
        title="Trade notifications?"
      />
      <OnboardingSwitchRow
        label="Notify me about matches, trade updates, and messages"
        onValueChange={setNotifications}
        value={state.notificationsEnabled}
      />
      <DetailPanel
        rows={[
          ["Profile", state.collectorType ? getCollectorTypeLabel(state.collectorType) : "Missing"],
          ["Wear", state.wornSizes.map((size) => sizeLabels[size]).join(", ")],
          ["Collect", state.collectedSizes.map((size) => sizeLabels[size]).join(", ")],
          ["Categories", state.categories.map((category) => categoryLabels[category]).join(", ")],
        ]}
        title="Profile preview"
      />
    </BetaPanel>
  );
}

export function OnboardingStepHeader({ body, title }: { body: string; title: string }) {
  return (
    <View style={{ gap: beta.spacing.xs }}>
      <BetaKicker>COLLECTOR PROFILE</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 28, fontWeight: "900", lineHeight: 32 }}>
        {title}
      </Text>
      <BetaBody>{body}</BetaBody>
    </View>
  );
}

export function OnboardingSwitchRow({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: beta.spacing.md,
        justifyContent: "space-between",
        padding: beta.spacing.md,
      }}
    >
      <Text style={{ color: beta.colors.ink, flex: 1, fontSize: 15, fontWeight: "900" }}>
        {label}
      </Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={value ? beta.colors.background : beta.colors.inkMuted}
        trackColor={{ false: beta.colors.borderStrong, true: beta.colors.orange }}
        value={value}
      />
    </View>
  );
}

export function OnboardingPill({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Toggle ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? beta.colors.orange : beta.colors.surface,
        borderColor: selected ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        minHeight: 44,
        minWidth: 72,
        opacity: pressed ? 0.84 : 1,
        paddingHorizontal: beta.spacing.md,
        paddingVertical: beta.spacing.sm,
      })}
    >
      <Text
        style={{
          color: selected ? beta.colors.background : beta.colors.ink,
          fontSize: 14,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function OnboardingProgressDots({ count, index }: { count: number; index: number }) {
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: beta.spacing.sm,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: count }, (_, dotIndex) => (
        <View
          key={dotIndex}
          style={{
            backgroundColor: dotIndex === index ? beta.colors.orange : beta.colors.borderStrong,
            borderRadius: 999,
            height: 8,
            width: dotIndex === index ? 24 : 8,
          }}
        />
      ))}
    </View>
  );
}

export function OnboardingProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <View
      style={{
        backgroundColor: beta.colors.surface,
        borderRadius: 999,
        height: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          backgroundColor: beta.colors.orange,
          height: "100%",
          width: `${Math.round(((index + 1) / total) * 100)}%`,
        }}
      />
    </View>
  );
}

export function isOnboardingStepReady(
  step: OnboardingSetupStep,
  state: { [key: string]: unknown },
) {
  if (step === "collectorType") return Boolean(state.collectorType);
  if (step === "wornSizes") return Array.isArray(state.wornSizes) && state.wornSizes.length > 0;
  if (step === "collectedSizes") {
    return Array.isArray(state.collectedSizes) && state.collectedSizes.length > 0;
  }
  if (step === "categories") return Array.isArray(state.categories) && state.categories.length > 0;
  if (step === "tradePreference") return Boolean(state.tradePreference);
  if (step === "communicationPreference") return Boolean(state.communicationPreference);
  return true;
}

export function toggleArrayValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function getCollectorTypeLabel(value: CollectorType): string {
  return collectorTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function KonnesorIntro({
  lift,
  opacity,
  pulse,
  scale,
}: {
  lift: Animated.Value;
  opacity: Animated.Value;
  pulse: Animated.Value;
  scale: Animated.Value;
}) {
  const washScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.18],
  });
  const washOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.42],
  });

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
          backgroundColor: beta.colors.orange,
          borderRadius: 999,
          height: 520,
          opacity: washOpacity,
          position: "absolute",
          transform: [{ scale: washScale }],
          width: 520,
        }}
      />
      <Animated.View
        style={{
          alignItems: "center",
          opacity,
          transform: [{ translateY: lift }, { scale }],
          width: "100%",
        }}
      >
        <Image
          accessibilityLabel="Konnesor intro logo"
          resizeMode="contain"
          source={konnesorWordmark}
          style={{ height: 96, width: "100%" }}
        />
      </Animated.View>
    </View>
  );
}

export function BackArrowButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.border,
        borderRadius: 999,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        opacity: pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
        width: 42,
      })}
    >
      <Text style={{ color: beta.colors.ink, fontSize: 28, fontWeight: "900", lineHeight: 30 }}>
        ‹
      </Text>
    </Pressable>
  );
}
