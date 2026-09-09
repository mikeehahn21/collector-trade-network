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
  DetailPanel,
  getOfflineBannerReason,
  ItemThumb,
  MissingRecord,
  ModerationActionsPanel,
  OfflineModeBanner,
  ReleaseEmptyState,
  shouldShowOfflineBanner,
  TradeProgressRail,
  TradeSafetyChecklist,
  TrustSafetyPanel,
} from "../components/shared-panels";

export function TradesTab({
  appendLocalTradeThreadMessage,
  backendFallback,
  backendHealth,
  createLocalTradeThread,
  localTrades,
  onBlockUser,
  onBackendFallback,
  onBackendRecovered,
  openLocalConversation,
  route,
  setLocalTrades,
  setRoute,
}: {
  appendLocalTradeThreadMessage: (
    conversationId: string | undefined,
    message: LocalMessage,
  ) => void;
  backendFallback?: BackendFallbackState | undefined;
  backendHealth: BackendHealthState;
  createLocalTradeThread: (input: {
    offeredItem: TradeableItem;
    proposal: LocalTradeProposal;
    requestedItem: WishlistItem;
  }) => string;
  localTrades: LocalTradeProposal[];
  onBlockUser: (target: ModerationTarget) => void;
  onBackendFallback: (scope: FallbackScope, operation: string, error: unknown) => void;
  onBackendRecovered: (scope: FallbackScope) => void;
  openLocalConversation: (conversationId: string) => void;
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
      onBackendRecovered("trades");
    } catch (loadError) {
      setError("Live trades are unavailable. Local proposal workflow is active.");
      setSource("local");
      onBackendFallback("trades", "load trades", loadError);
    } finally {
      setIsLoading(false);
    }
  }, [onBackendFallback, onBackendRecovered]);

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
        "Add one collection item and one want before composing a proposal.",
      );
      return;
    }

    const now = new Date().toISOString();
    const proposalBase: LocalTradeProposal = {
      counterparty: requestedItem.isGrail ? "Grail match collector" : "Matching collector",
      counterpartyId: `local_user_${requestedItem.id}`,
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
    const conversationId = createLocalTradeThread({
      offeredItem,
      proposal: proposalBase,
      requestedItem,
    });
    const proposal: LocalTradeProposal = { ...proposalBase, conversationId };

    setLocalTrades((current) => [proposal, ...current]);
    setDraftNotes("");
    setComposeStep("offer");
    setRoute({ mode: "detail", tradeId: proposal.id });
  }

  function updateLocalTradeStatus(tradeId: string, status: TradeStatus) {
    const trade = localTrades.find((item) => item.id === tradeId);
    const now = new Date().toISOString();
    setLocalTrades((current) =>
      current.map((trade) => (trade.id === tradeId ? { ...trade, status, updatedAt: now } : trade)),
    );
    appendLocalTradeThreadMessage(trade?.conversationId, {
      content: getTradeStatusUpdateMessage(status),
      createdAt: now,
      id: `local_msg_${tradeId}_${status}_${Date.now()}`,
      isMine: false,
      sender: "Konnesor",
      type: "system",
    });
  }

  function confirmLocalTradeCompletion(tradeId: string, side: "counterparty" | "proposer") {
    const trade = localTrades.find((item) => item.id === tradeId);
    const now = new Date().toISOString();
    let nextStatus: TradeStatus = trade?.status ?? "accepted";

    setLocalTrades((current) =>
      current.map((item) => {
        if (item.id !== tradeId) {
          return item;
        }

        const proposerCompletedConfirmedAt =
          side === "proposer"
            ? (item.proposerCompletedConfirmedAt ?? now)
            : item.proposerCompletedConfirmedAt;
        const counterpartyCompletedConfirmedAt =
          side === "counterparty"
            ? (item.counterpartyCompletedConfirmedAt ?? now)
            : item.counterpartyCompletedConfirmedAt;
        nextStatus =
          proposerCompletedConfirmedAt && counterpartyCompletedConfirmedAt
            ? "completed"
            : item.status;

        return {
          ...item,
          counterpartyCompletedConfirmedAt,
          proposerCompletedConfirmedAt,
          status: nextStatus,
          updatedAt: now,
        };
      }),
    );

    appendLocalTradeThreadMessage(trade?.conversationId, {
      content:
        nextStatus === "completed"
          ? "Both collectors confirmed completion. Trade completed."
          : side === "proposer"
            ? "You confirmed completion. Waiting on the other collector."
            : "The other collector confirmed completion. Waiting on you.",
      createdAt: now,
      id: `local_msg_${tradeId}_confirm_${side}_${Date.now()}`,
      isMine: false,
      sender: "Konnesor",
      type: "system",
    });
  }

  async function reportTradeUser(
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) {
    if (!isUuid(target.userId)) {
      console.log("[Konnesor moderation] local trade report", { reason, target, note });
      setError("Report saved locally for this beta trade.");
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
      onBackendFallback("trades", `report user ${target.userId}`, reportError);
      throw reportError;
    }
  }

  async function blockTradeUser(target: ModerationTarget) {
    if (!target.userId) {
      setError("This beta trade does not have a user id to block.");
      return;
    }

    onBlockUser(target);

    if (isUuid(target.userId)) {
      try {
        await apiRef.current.blockUser({ blockedUserId: target.userId });
      } catch (blockError) {
        setError("Blocked locally. Live block will need to sync when the API is reachable.");
        onBackendFallback("trades", `block user ${target.userId}`, blockError);
      }
    } else {
      setError("Blocked locally for this beta trade.");
    }

    setRoute({ mode: "list", tradeId: undefined });
  }

  async function confirmLiveTradeCompletion(tradeId: string) {
    try {
      const response = await apiRef.current.completeTrade(tradeId);
      setLiveTrades((current) =>
        current.map((item) => (item.id === tradeId ? response.trade : item)),
      );
      setError(
        response.trade.status === "completed"
          ? "Trade completed by both collectors."
          : "Completion confirmed. Waiting on the other collector.",
      );
    } catch (completionError) {
      setError("Completion confirmation could not reach the live API.");
      onBackendFallback("trades", `confirm completion ${tradeId}`, completionError);
    }
  }

  if (route.mode === "compose") {
    return (
      <BetaScreen>
        <ScrollView
          contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
        >
          <BackArrowButton
            accessibilityLabel="Back to trades"
            onPress={() => setRoute({ mode: "list", tradeId: undefined })}
          />

          <OfflineModeBanner
            detail={getOfflineBannerReason(backendHealth, backendFallback)}
            kind="trade"
            visible={shouldShowOfflineBanner(backendHealth, source, backendFallback, isLoading)}
          />

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
              emptyMessage="Publish or create one collection item before composing a trade."
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
            <View style={{ gap: theme.spacing.md }}>
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
              <TrustSafetyPanel compact />
            </View>
          ) : null}

          {composeStep === "review" ? (
            <View style={{ gap: theme.spacing.md }}>
              <TradeObjectPanel
                emptyMessage="Choose a collection item before creating the proposal."
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
          onBlockUser={blockTradeUser}
          onBack={() => setRoute({ mode: "list", tradeId: undefined })}
          onConfirmCompletion={() => void confirmLiveTradeCompletion(selectedLiveTrade.id)}
          onReportUser={reportTradeUser}
          trade={selectedLiveTrade}
        />
      );
    }

    if (selectedLocalTrade) {
      return (
        <LocalTradeDetail
          getItem={(itemId) => items.find((item) => item.id === itemId)}
          onBack={() => setRoute({ mode: "list", tradeId: undefined })}
          onOpenConversation={
            selectedLocalTrade.conversationId
              ? () => openLocalConversation(selectedLocalTrade.conversationId ?? "")
              : undefined
          }
          offlineReason={getOfflineBannerReason(backendHealth, backendFallback)}
          onBlockUser={blockTradeUser}
          onConfirmCompletion={(side) => confirmLocalTradeCompletion(selectedLocalTrade.id, side)}
          onReportUser={reportTradeUser}
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

        <OfflineModeBanner
          detail={getOfflineBannerReason(backendHealth, backendFallback)}
          kind="trade"
          visible={shouldShowOfflineBanner(backendHealth, source, backendFallback, isLoading)}
        />

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
          <ReleaseEmptyState
            actionLabel="Compose trade"
            message="Add one collection item and one wishlist target, then compose a proposal to test the full swap flow."
            onAction={() => setRoute({ mode: "compose", tradeId: undefined })}
            title="No trade proposals yet"
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

export function TradeComposeProgress({
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

export function TradeComposeSelection({
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

export function TradeComposeOption({
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

export function TradeComposeControls({
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

export function TradeRow({
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

export function TradeNextActionPanel({ status }: { status: TradeStatus }) {
  const copy: Record<TradeStatus, { title: string; detail: string }> = {
    accepted: {
      detail:
        "Confirm final condition proof, shipping timing, and tracking before either side sends.",
      title: "Acceptance needs shipping proof.",
    },
    cancelled: {
      detail:
        "Keep the thread for reference and create a new proposal if the match still makes sense.",
      title: "Proposal cancelled.",
    },
    completed: {
      detail:
        "Capture feedback, confirm both sides received their items, and mark any issues immediately.",
      title: "Complete the post-trade loop.",
    },
    countered: {
      detail:
        "Use the message thread to adjust item terms, add cash notes if needed, or pick a new target.",
      title: "Counter terms are open.",
    },
    declined: {
      detail: "No action needed. Use the collection and wishlist screens to find the next match.",
      title: "Offer declined.",
    },
    disputed: {
      detail:
        "Pause shipping, keep all proof in the thread, and document the reason before moving forward.",
      title: "Dispute needs review.",
    },
    pending: {
      detail:
        "Open the thread, confirm measurements/photos, then move the proposal to accepted or countered.",
      title: "Waiting on review.",
    },
  };
  const current = copy[status] ?? copy.pending;

  return (
    <BetaPanel>
      <BetaKicker>NEXT ACTION</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
        {current.title}
      </Text>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
        {current.detail}
      </Text>
    </BetaPanel>
  );
}

export function TradeDetail({
  onBack,
  onBlockUser,
  onConfirmCompletion,
  onReportUser,
  trade,
}: {
  onBack: () => void;
  onBlockUser: (target: ModerationTarget) => Promise<void> | void;
  onConfirmCompletion: () => void;
  onReportUser: (
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) => Promise<void> | void;
  trade: Trade;
}) {
  const theme = beta;
  const otherCollector =
    trade.viewerRole === "proposer"
      ? {
          displayName: trade.counterpartyDisplayName,
          userId: trade.counterpartyId,
        }
      : {
          displayName: trade.proposerDisplayName,
          userId: trade.proposerId,
        };

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BackArrowButton accessibilityLabel="Back to trades" onPress={onBack} />
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
        <TradeNextActionPanel status={trade.status} />
        <TradeCompletionPanel onConfirm={onConfirmCompletion} trade={trade} />
        <CollectorReputationPanel displayName={otherCollector.displayName} />
        <ModerationActionsPanel
          onBlock={onBlockUser}
          onReport={onReportUser}
          target={otherCollector}
        />
        <TradeSafetyChecklist status={trade.status} />
        <TrustSafetyPanel compact />
      </ScrollView>
    </BetaScreen>
  );
}

export function LocalTradeDetail({
  getItem,
  onBack,
  onBlockUser,
  onConfirmCompletion,
  onOpenConversation,
  onReportUser,
  offlineReason,
  onUpdateStatus,
  trade,
}: {
  getItem: (itemId: string | undefined) => TradeableItem | undefined;
  onBack: () => void;
  onBlockUser: (target: ModerationTarget) => Promise<void> | void;
  onConfirmCompletion: (side: "counterparty" | "proposer") => void;
  onOpenConversation?: (() => void) | undefined;
  onReportUser: (
    target: ModerationTarget,
    reason: ReportReason,
    note: string | undefined,
  ) => Promise<void> | void;
  offlineReason?: string | undefined;
  onUpdateStatus: (status: TradeStatus) => void;
  trade: LocalTradeProposal;
}) {
  const theme = beta;
  const offeredItem = getItem(trade.offeredItemId);
  const target = { displayName: trade.counterparty, userId: trade.counterpartyId };

  return (
    <BetaScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <BackArrowButton accessibilityLabel="Back to trades" onPress={onBack} />
        <OfflineModeBanner detail={offlineReason} kind="trade" visible />
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
          emptyMessage="The offered collection item is no longer available."
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
            ["Thread", trade.conversationId ? "Linked to messages" : "Not linked"],
            ["Next step", getTradeNextStep(trade.status)],
          ]}
          title="Proposal checkpoint"
        />
        <TradeNextActionPanel status={trade.status} />
        <LocalTradeCompletionPanel onConfirm={onConfirmCompletion} trade={trade} />
        <CollectorReputationPanel displayName={trade.counterparty} localTrade={trade} />
        <ModerationActionsPanel onBlock={onBlockUser} onReport={onReportUser} target={target} />
        <TradeSafetyChecklist status={trade.status} />
        <TrustSafetyPanel compact />
        <View style={{ gap: theme.spacing.md }}>
          {onOpenConversation ? (
            <BetaButton
              accessibilityLabel="Open trade message thread"
              onPress={onOpenConversation}
              variant="black"
            >
              Open trade thread
            </BetaButton>
          ) : null}
          <BetaButton
            accessibilityLabel="Mark proposal accepted"
            disabled={trade.status === "accepted"}
            onPress={() => onUpdateStatus("accepted")}
            variant="secondary"
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
            disabled={trade.status !== "accepted" || Boolean(trade.proposerCompletedConfirmedAt)}
            onPress={() => onConfirmCompletion("proposer")}
            variant="secondary"
          >
            Confirm your side
          </BetaButton>
          <BetaButton
            accessibilityLabel="Simulate counterparty completion"
            disabled={
              trade.status !== "accepted" || Boolean(trade.counterpartyCompletedConfirmedAt)
            }
            onPress={() => onConfirmCompletion("counterparty")}
            variant="secondary"
          >
            Simulate other side
          </BetaButton>
          <BetaButton
            accessibilityLabel="Mark proposal declined"
            disabled={trade.status === "declined"}
            onPress={() => onUpdateStatus("declined")}
            variant="ghost"
          >
            Mark declined
          </BetaButton>
          <BetaButton
            accessibilityLabel="Flag proposal dispute"
            disabled={trade.status === "disputed"}
            onPress={() => onUpdateStatus("disputed")}
            variant="ghost"
          >
            Flag dispute
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

export function TradeCompletionPanel({
  onConfirm,
  trade,
}: {
  onConfirm: () => void;
  trade: Trade;
}) {
  const viewerConfirmed =
    trade.viewerRole === "proposer"
      ? Boolean(trade.proposerCompletedConfirmedAt)
      : Boolean(trade.counterpartyCompletedConfirmedAt);
  const otherConfirmed =
    trade.viewerRole === "proposer"
      ? Boolean(trade.counterpartyCompletedConfirmedAt)
      : Boolean(trade.proposerCompletedConfirmedAt);
  const otherName =
    trade.viewerRole === "proposer" ? trade.counterpartyDisplayName : trade.proposerDisplayName;

  return (
    <BetaPanel>
      <BetaKicker>TWO-SIDED COMPLETION</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
        {trade.status === "completed"
          ? "Both collectors confirmed."
          : viewerConfirmed
            ? `Waiting on ${otherName}.`
            : "Confirm only after you are satisfied."}
      </Text>
      <BetaBody>
        Trades move to completed only after both sides confirm receipt and condition.
      </BetaBody>
      <DetailPanel
        rows={[
          ["You", viewerConfirmed ? "Confirmed" : "Not confirmed"],
          [otherName, otherConfirmed ? "Confirmed" : "Waiting"],
        ]}
        title="Completion state"
      />
      <BetaButton
        accessibilityLabel="Confirm trade completion"
        disabled={trade.status !== "accepted" || viewerConfirmed}
        onPress={onConfirm}
        variant="black"
      >
        Confirm completion
      </BetaButton>
    </BetaPanel>
  );
}

export function LocalTradeCompletionPanel({
  onConfirm,
  trade,
}: {
  onConfirm: (side: "counterparty" | "proposer") => void;
  trade: LocalTradeProposal;
}) {
  const myConfirmed = Boolean(trade.proposerCompletedConfirmedAt);
  const otherConfirmed = Boolean(trade.counterpartyCompletedConfirmedAt);

  return (
    <BetaPanel>
      <BetaKicker>TWO-SIDED COMPLETION</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>
        {trade.status === "completed"
          ? "Both collectors confirmed."
          : myConfirmed
            ? `Waiting on ${trade.counterparty}.`
            : "Confirm only after you are satisfied."}
      </Text>
      <BetaBody>
        Local beta trades now model the same two-confirmation requirement used by live trades.
      </BetaBody>
      <DetailPanel
        rows={[
          ["You", myConfirmed ? "Confirmed" : "Not confirmed"],
          [trade.counterparty, otherConfirmed ? "Confirmed" : "Waiting"],
        ]}
        title="Completion state"
      />
      <View style={{ gap: beta.spacing.sm }}>
        <BetaButton
          accessibilityLabel="Confirm local trade completion"
          disabled={trade.status !== "accepted" || myConfirmed}
          onPress={() => onConfirm("proposer")}
          variant="black"
        >
          Confirm completion
        </BetaButton>
        <BetaButton
          accessibilityLabel="Simulate other collector confirmation"
          disabled={trade.status !== "accepted" || otherConfirmed}
          onPress={() => onConfirm("counterparty")}
          variant="secondary"
        >
          Simulate other side
        </BetaButton>
      </View>
    </BetaPanel>
  );
}

export function CollectorReputationPanel({
  displayName,
  localTrade,
}: {
  displayName: string;
  localTrade?: LocalTradeProposal | undefined;
}) {
  const completed = localTrade?.status === "completed" ? 1 : 0;
  const tradeCount = localTrade ? 1 : 4;
  const completionRate = localTrade ? (completed ? 100 : 0) : 94;

  return (
    <BetaPanel>
      <BetaKicker>COLLECTOR REPUTATION</BetaKicker>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{displayName}</Text>
      <BetaStatPanel
        stats={[
          { label: "Trades", value: tradeCount },
          { label: "Complete", value: `${completionRate}%` },
          { label: "Status", value: completionRate >= 90 ? "Strong" : "New" },
        ]}
      />
      <BetaBody>
        Reputation appears before a proposal so collectors can judge trade history before moving
        forward.
      </BetaBody>
    </BetaPanel>
  );
}

export function TradeObjectPanel({
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

export function getLocalTradeSummary(trades: LocalTradeProposal[]): {
  active: number;
  history: number;
} {
  return trades.reduce(
    (summary, trade) =>
      ["completed", "declined", "cancelled", "disputed"].includes(trade.status)
        ? { ...summary, history: summary.history + 1 }
        : { ...summary, active: summary.active + 1 },
    { active: 0, history: 0 },
  );
}

export function getTradeNextStep(status: TradeStatus): string {
  switch (status) {
    case "pending":
      return "Confirm condition details in messages before accepting.";
    case "accepted":
      return "Collect shipping details and tracking from both sides.";
    case "countered":
      return "Review the counter offer and adjust the item side.";
    case "completed":
      return "Save the completed trade and update collector reputation.";
    case "cancelled":
    case "declined":
      return "No action needed unless the collectors reopen terms.";
    case "disputed":
      return "Hold completion until support reviews the issue.";
  }
}

export function getTradeStatusUpdateMessage(status: TradeStatus): string {
  switch (status) {
    case "pending":
      return "Trade moved back to pending. Confirm condition and terms before acceptance.";
    case "accepted":
      return "Trade accepted. Next step: collect shipping details and tracking from both sides.";
    case "countered":
      return "Counter requested. Review the terms and adjust the proposal before moving forward.";
    case "completed":
      return "Trade marked complete. Save the outcome and update collector reputation.";
    case "cancelled":
      return "Trade cancelled. No action is needed unless both collectors reopen the deal.";
    case "declined":
      return "Trade declined. Keep the thread for reference if a new proposal is created.";
    case "disputed":
      return "Trade disputed. Pause completion until the issue is reviewed.";
  }
}
