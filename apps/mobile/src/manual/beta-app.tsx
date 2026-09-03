import {
  Animated,
  AppErrorBoundary,
  BetaBody,
  BetaKicker,
  BetaPanel,
  BetaScreen,
  BetaTabBar,
  CollectionStateProvider,
  DataSyncBootstrap,
  Easing,
  MobileAuthProvider,
  OnboardingStateProvider,
  SafeAreaProvider,
  StatusBar,
  Text,
  ThemeProvider,
  UserProfileProvider,
  View,
  WishlistStateProvider,
  beta,
  createInitialBackendHealthState,
  getDiagnosticErrorDetail,
  getDiagnosticErrorMessage,
  initializeMobileSentry,
  localConversations,
  LOCAL_BLOCKED_USERS_STORAGE_KEY,
  LOCAL_FEEDBACK_STORAGE_KEY,
  LOCAL_THREADS_STORAGE_KEY,
  LOCAL_TRADES_STORAGE_KEY,
  reportBackendDiagnostic,
  runBackendHealthCheck,
  secureStorage,
  tabs,
  useCallback,
  useEffect,
  useMemo,
  useOnboardingState,
  useAuthSession,
  useRef,
  useState,
} from "./beta-app.shared";
import type {
  BackendFallbackState,
  BackendHealthState,
  BetaFeedback,
  BlockedUser,
  FallbackScope,
  LocalConversation,
  LocalMessage,
  LocalTradeProposal,
  ManualRoute,
  MessageRoute,
  ModerationTarget,
  Tab,
  TradeRoute,
  TradeableItem,
  WishlistItem,
} from "./beta-app.shared";
import { InventoryTab, WishlistTab } from "./screens/collection-wishlist-tabs";
import { HomeTab } from "./screens/home-tab";
import { FirstRunOnboardingFlow, KonnesorIntro } from "./screens/onboarding-flow";
import { MessagesTab } from "./screens/messages-tab";
import { TradesTab } from "./screens/trades-tab";
import { useKonnesorPushNotifications } from "./notifications";
export default function BetaApp() {
  initializeMobileSentry();

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
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
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function BetaShell() {
  const onboarding = useOnboardingState();
  const auth = useAuthSession();
  const [showIntro, setShowIntro] = useState(true);
  const introLift = useRef(new Animated.Value(18)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introPulse = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.82)).current;
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
  const [isLocalStateHydrated, setIsLocalStateHydrated] = useState(false);
  const [betaFeedback, setBetaFeedback] = useState<BetaFeedback[]>([]);
  const [backendFallbacks, setBackendFallbacks] = useState<
    Partial<Record<FallbackScope, BackendFallbackState>>
  >({});
  const [backendHealth, setBackendHealth] = useState<BackendHealthState>(
    createInitialBackendHealthState,
  );
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [localThreads, setLocalThreads] = useState<LocalConversation[]>(localConversations);
  const [localTrades, setLocalTrades] = useState<LocalTradeProposal[]>([]);

  const registerBackendFallback = useCallback(
    (scope: FallbackScope, operation: string, error: unknown) => {
      const fallback: BackendFallbackState = {
        checkedAt: new Date().toISOString(),
        detail: getDiagnosticErrorDetail(error),
        operation,
        reason: getDiagnosticErrorMessage(error),
        scope,
      };

      setBackendFallbacks((current) => ({ ...current, [scope]: fallback }));
      reportBackendDiagnostic("fallback", {
        apiBaseUrl: backendHealth.apiBaseUrl,
        fallback,
      });
    },
    [backendHealth.apiBaseUrl],
  );
  const clearBackendFallback = useCallback((scope: FallbackScope) => {
    setBackendFallbacks((current) => ({ ...current, [scope]: undefined }));
  }, []);

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
          duration: 680,
          easing: Easing.out(Easing.back(1.45)),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(introLift, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(introPulse, {
            duration: 260,
            easing: Easing.inOut(Easing.quad),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(introPulse, {
            duration: 260,
            easing: Easing.inOut(Easing.quad),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 },
      ),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(introOpacity, {
          duration: 360,
          easing: Easing.in(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(introLift, {
          duration: 360,
          easing: Easing.in(Easing.cubic),
          toValue: -18,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowIntro(false);
      }
    });

    return () => animation.stop();
  }, [introLift, introOpacity, introPulse, introScale]);

  useEffect(() => {
    let isMounted = true;

    async function checkBackendHealth() {
      const result = await runBackendHealthCheck();

      if (isMounted) {
        setBackendHealth(result);
      }
    }

    void checkBackendHealth();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      secureStorage.getItem(LOCAL_BLOCKED_USERS_STORAGE_KEY),
      secureStorage.getItem(LOCAL_FEEDBACK_STORAGE_KEY),
      secureStorage.getItem(LOCAL_THREADS_STORAGE_KEY),
      secureStorage.getItem(LOCAL_TRADES_STORAGE_KEY),
    ])
      .then(([storedBlockedUsers, storedFeedback, storedThreads, storedTrades]) => {
        if (!isMounted) {
          return;
        }

        try {
          if (storedBlockedUsers) {
            setBlockedUsers(JSON.parse(storedBlockedUsers) as BlockedUser[]);
          }
          if (storedFeedback) {
            setBetaFeedback(JSON.parse(storedFeedback) as BetaFeedback[]);
          }
          if (storedThreads) {
            setLocalThreads(JSON.parse(storedThreads) as LocalConversation[]);
          }
          if (storedTrades) {
            setLocalTrades(JSON.parse(storedTrades) as LocalTradeProposal[]);
          }
        } catch {
          setBetaFeedback([]);
          setLocalThreads(localConversations);
          setLocalTrades([]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBlockedUsers([]);
          setBetaFeedback([]);
          setLocalThreads(localConversations);
          setLocalTrades([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLocalStateHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLocalStateHydrated) {
      return;
    }

    void secureStorage.setItem(LOCAL_BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers, isLocalStateHydrated]);

  useEffect(() => {
    if (!isLocalStateHydrated) {
      return;
    }

    void secureStorage.setItem(LOCAL_FEEDBACK_STORAGE_KEY, JSON.stringify(betaFeedback));
  }, [betaFeedback, isLocalStateHydrated]);

  const blockedUserIds = useMemo(
    () => new Set(blockedUsers.map((user) => user.userId)),
    [blockedUsers],
  );
  const visibleLocalThreads = useMemo(
    () =>
      localThreads.filter(
        (thread) => !thread.participantId || !blockedUserIds.has(thread.participantId),
      ),
    [blockedUserIds, localThreads],
  );
  const visibleLocalTrades = useMemo(
    () =>
      localTrades.filter(
        (trade) => !trade.counterpartyId || !blockedUserIds.has(trade.counterpartyId),
      ),
    [blockedUserIds, localTrades],
  );

  const blockUserLocally = useCallback((target: ModerationTarget) => {
    if (!target.userId) {
      return;
    }

    const blockedAt = new Date().toISOString();
    setBlockedUsers((current) => [
      { blockedAt, displayName: target.displayName, userId: target.userId ?? "" },
      ...current.filter((user) => user.userId !== target.userId),
    ]);
  }, []);

  const unblockUserLocally = useCallback((userId: string) => {
    setBlockedUsers((current) => current.filter((user) => user.userId !== userId));
  }, []);

  useEffect(() => {
    if (!isLocalStateHydrated) {
      return;
    }

    void secureStorage.setItem(LOCAL_THREADS_STORAGE_KEY, JSON.stringify(localThreads));
  }, [isLocalStateHydrated, localThreads]);

  useEffect(() => {
    if (!isLocalStateHydrated) {
      return;
    }

    void secureStorage.setItem(LOCAL_TRADES_STORAGE_KEY, JSON.stringify(localTrades));
  }, [isLocalStateHydrated, localTrades]);

  function createLocalTradeThread({
    offeredItem,
    proposal,
    requestedItem,
  }: {
    offeredItem: TradeableItem;
    proposal: LocalTradeProposal;
    requestedItem: WishlistItem;
  }): string {
    const conversationId = `conv_${proposal.id}`;
    const createdAt = proposal.createdAt;
    const requestedTitle = requestedItem.title || proposal.requestedTitle;
    const offeredTitle = offeredItem.title || "your offered item";
    const thread: LocalConversation = {
      contextSubtitle: `${offeredTitle} for ${requestedTitle}`,
      contextTitle: proposal.requestedTitle,
      contextType: "trade",
      id: conversationId,
      messages: [
        {
          content:
            "Trade proposal created. Confirm condition, measurements, shipping, and final terms here.",
          createdAt,
          id: `msg_${proposal.id}_opened`,
          isMine: false,
          sender: "Konnesor",
          type: "system",
        },
        {
          content: proposal.notes,
          createdAt,
          id: `msg_${proposal.id}_terms`,
          isMine: true,
          sender: "You",
        },
      ],
      participant: proposal.counterparty,
      participantId: proposal.counterpartyId,
      unreadCount: 0,
    };

    setLocalThreads((threads) => [thread, ...threads.filter((item) => item.id !== conversationId)]);
    return conversationId;
  }

  function appendLocalTradeThreadMessage(
    conversationId: string | undefined,
    message: LocalMessage,
  ) {
    if (!conversationId) {
      return;
    }

    setLocalThreads((threads) =>
      threads.map((thread) =>
        thread.id === conversationId
          ? {
              ...thread,
              messages: [...thread.messages, message],
              unreadCount: message.isMine ? thread.unreadCount : thread.unreadCount + 1,
            }
          : thread,
      ),
    );
  }

  function openLocalConversation(conversationId: string) {
    setLocalThreads((threads) =>
      threads.map((thread) =>
        thread.id === conversationId ? { ...thread, unreadCount: 0 } : thread,
      ),
    );
    setTab("messages");
    setMessageRoute({ conversationId, mode: "detail" });
    setTradeRoute({ mode: "list", tradeId: undefined });
  }

  const openMessageFromPush = useCallback((conversationId: string) => {
    if (!conversationId) {
      return;
    }

    setTab("messages");
    setMessageRoute({ conversationId, mode: "detail" });
    setTradeRoute({ mode: "list", tradeId: undefined });
  }, []);

  const openTradeFromPush = useCallback((tradeId: string) => {
    if (!tradeId) {
      return;
    }

    setTab("trades");
    setTradeRoute({ mode: "detail", tradeId });
    setMessageRoute({ conversationId: undefined, mode: "list" });
  }, []);

  useKonnesorPushNotifications({
    auth,
    notificationsOptIn: onboarding.state.notificationsEnabled,
    onOpenMessage: openMessageFromPush,
    onOpenTrade: openTradeFromPush,
  });

  function _submitBetaFeedback(input: Omit<BetaFeedback, "createdAt" | "id">) {
    const now = new Date().toISOString();
    setBetaFeedback((current) => [
      {
        ...input,
        createdAt: now,
        id: `beta_feedback_${Date.now()}`,
      },
      ...current,
    ]);
  }

  if (showIntro) {
    return (
      <KonnesorIntro
        lift={introLift}
        opacity={introOpacity}
        pulse={introPulse}
        scale={introScale}
      />
    );
  }

  if (!onboarding.state.isHydrated) {
    return (
      <BetaScreen>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <BetaPanel tone="black">
            <BetaKicker>KONNESOR</BetaKicker>
            <Text style={{ color: beta.colors.ink, fontSize: 24, fontWeight: "900" }}>
              Loading your profile.
            </Text>
            <BetaBody>Preparing your collector setup.</BetaBody>
          </BetaPanel>
        </View>
      </BetaScreen>
    );
  }

  if (!onboarding.isOnboardingComplete) {
    return <FirstRunOnboardingFlow />;
  }

  return (
    <View style={{ backgroundColor: beta.colors.background, flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "home" ? (
          <HomeTab
            localThreads={visibleLocalThreads}
            localTrades={visibleLocalTrades}
            blockedUsers={blockedUsers}
            onOpenTradeDetail={(tradeId) => {
              setTab("trades");
              setTradeRoute({ mode: "detail", tradeId });
            }}
            onUnblockUser={unblockUserLocally}
            setTab={openTab}
          />
        ) : null}
        {tab === "inventory" ? (
          <InventoryTab route={inventoryRoute} setRoute={setInventoryRoute} />
        ) : null}
        {tab === "wishlist" ? (
          <WishlistTab route={wishlistRoute} setRoute={setWishlistRoute} />
        ) : null}
        {tab === "messages" ? (
          <MessagesTab
            backendFallback={backendFallbacks.messages}
            backendHealth={backendHealth}
            localThreads={visibleLocalThreads}
            onBlockUser={blockUserLocally}
            onBackendFallback={registerBackendFallback}
            onBackendRecovered={clearBackendFallback}
            route={messageRoute}
            setLocalThreads={setLocalThreads}
            setRoute={setMessageRoute}
          />
        ) : null}
        {tab === "trades" ? (
          <TradesTab
            appendLocalTradeThreadMessage={appendLocalTradeThreadMessage}
            backendFallback={backendFallbacks.trades}
            backendHealth={backendHealth}
            createLocalTradeThread={createLocalTradeThread}
            localTrades={visibleLocalTrades}
            onBlockUser={blockUserLocally}
            onBackendFallback={registerBackendFallback}
            onBackendRecovered={clearBackendFallback}
            openLocalConversation={openLocalConversation}
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
