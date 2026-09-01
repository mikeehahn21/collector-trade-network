import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Sentry from "@sentry/react-native";
import * as WebBrowser from "expo-web-browser";
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
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
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
import { apiRoutes } from "@ctn/api-contracts";
import type {
  CollectionSummary,
  Conversation,
  ConversationMessage,
  CollectorType,
  CommunicationPreference,
  BlockedUser,
  ItemPhoto,
  PublicTradeableItem,
  ReportReason,
  TradeItemSummary,
  RecommendationSummary,
  ShirtSize,
  Trade,
  TradeOfferPreference,
  TradeRecommendation,
  TradeStatus,
  TradeableItem,
  UserProfile,
  VintageCategory,
  WishlistItem,
  WishlistSummary,
} from "@ctn/types";

import {
  categoryLabels,
  communicationPreferenceLabels,
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
import { AppErrorBoundary } from "@/components/error-boundary";
import { CollectionStateProvider, useCollectionState } from "@/state/collection-state";
import { OnboardingStateProvider, useOnboardingState } from "@/state/onboarding-state";
import { useRecommendations } from "@/state/recommendation-state";
import { UserProfileProvider, useUserProfile } from "@/state/user-profile-state";
import { WishlistStateProvider, useWishlistState } from "@/state/wishlist-state";
import { secureStorage } from "@/storage/secure-storage";
import { DataSyncBootstrap } from "@/sync/data-sync-bootstrap";
import { ThemeProvider } from "@/theme/theme-provider";
import { getMobileEnv } from "@/config/env";
import konnesorSymbol from "../../assets/brand/konnesor-symbol.png";
import konnesorWordmark from "../../assets/brand/konnesor-wordmark.png";

export type Tab = "home" | "inventory" | "wishlist" | "messages" | "trades";
export type ManualRoute = { mode: "list" | "detail" | "edit"; itemId: string | undefined };
export type MessageRoute = { conversationId: string | undefined; mode: "list" | "detail" };
export type TradeRoute = { mode: "list" | "detail" | "compose"; tradeId: string | undefined };
export type LocalMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  sender: string;
  type?: "text" | "system";
};
export type LocalConversation = {
  contextSubtitle: string;
  contextTitle: string;
  contextType: Conversation["contextType"];
  id: string;
  messages: LocalMessage[];
  participant: string;
  participantId?: string | undefined;
  unreadCount: number;
};
export type LocalTradeProposal = {
  conversationId?: string | undefined;
  counterpartyCompletedConfirmedAt?: string | undefined;
  counterpartyId?: string | undefined;
  id: string;
  offeredItemId: string | undefined;
  proposerCompletedConfirmedAt?: string | undefined;
  requestedTitle: string;
  requestedSubtitle: string;
  status: TradeStatus;
  counterparty: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
export type TradeComposeStep = "offer" | "target" | "terms" | "review";
export type TradeProgressStep = "Proposed" | "Review" | "Counter" | "Ship" | "Complete";
export type InventoryFilter = "all" | "tradeable" | "draft" | "needs_photos" | "ready";
export type InventorySort = "recent" | "ready" | "value";
export type WishlistFilter = "all" | "grails" | "high" | "medium" | "low";
export type WishlistSort = "rank" | "grails" | "recent";
export type BackendHealthStatus = "checking" | "online" | "offline";
export type BackendHealthState = {
  apiBaseUrl: string;
  checkedAt?: string | undefined;
  database?: string | undefined;
  durationMs?: number | undefined;
  httpStatus?: number | undefined;
  reason?: string | undefined;
  service?: string | undefined;
  status: BackendHealthStatus;
};
export type FallbackScope = "messages" | "trades";
export type BackendFallbackState = {
  checkedAt: string;
  detail?: string | undefined;
  operation: string;
  reason: string;
  scope: FallbackScope;
};
export type ModerationTarget = {
  displayName: string;
  userId: string | undefined;
};
export type ImageSource = "camera" | "library";
export type CompSourceId =
  "google" | "ebaySold" | "ebayActive" | "grailed" | "depop" | "etsy" | "mercari" | "poshmark";
export type CompSource = {
  id: CompSourceId;
  label: string;
  note: string;
  url: (query: string) => string;
};
export type BetaFeedback = {
  blocker?: string | undefined;
  id: string;
  note: string;
  role: "collector" | "seller" | "tester";
  screenshotNote?: string | undefined;
  sentiment: "love" | "confusing" | "blocked";
  worked?: string | undefined;
  createdAt: string;
};
export type MvpChecklistItem = {
  description: string;
  done: boolean;
  label: string;
};

export const tabs: Array<{ icon: string; id: Tab; label: string }> = [
  { icon: "⌂", id: "home", label: "Home" },
  { icon: "▤", id: "inventory", label: "Collection" },
  { icon: "★", id: "wishlist", label: "Wishlist" },
  { icon: "○", id: "messages", label: "Messages" },
  { icon: "≋", id: "trades", label: "Trades" },
];

export const itemPhotoKindLabels: Record<ItemPhoto["kind"], string> = {
  back: "Back",
  detail: "Detail",
  flaw: "Flaw",
  front: "Front",
  tag: "Tag",
};

export const tradeComposeSteps: Array<{ id: TradeComposeStep; label: string }> = [
  { id: "offer", label: "Offer" },
  { id: "target", label: "Target" },
  { id: "terms", label: "Terms" },
  { id: "review", label: "Review" },
];

export const tradeProgressSteps: TradeProgressStep[] = [
  "Proposed",
  "Review",
  "Counter",
  "Ship",
  "Complete",
];

export const collectorTypeOptions: Array<{
  description: string;
  label: string;
  value: CollectorType;
}> = [
  {
    description: "Mostly hunting, collecting, and trading for personal grails.",
    label: "Collector",
    value: "collector",
  },
  {
    description: "Listing inventory regularly and open to serious trade offers.",
    label: "Seller",
    value: "seller",
  },
  {
    description: "Buying, selling, wearing, and trading from the same closet.",
    label: "Seller + collector",
    value: "seller_collector",
  },
  {
    description: "Learning the vintage world and building a first collection.",
    label: "New to vintage",
    value: "new_to_vintage",
  },
];

export const sizeOptions: ShirtSize[] = [
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xxxl",
  "one_size",
  "measurements_matter",
];

export const categoryOptions: VintageCategory[] = [
  "band",
  "rap",
  "harley",
  "sports",
  "wrestling",
  "movie",
  "anime",
  "cartoon",
  "three_d_emblem",
  "streetwear",
  "true_vintage_blanks",
];

export const tradeOfferPreferenceOptions: Array<{
  description: string;
  label: string;
  value: TradeOfferPreference;
}> = [
  {
    description: "Let matching collectors make offers if the swap is serious.",
    label: tradePreferenceLabels.all_serious_offers,
    value: "all_serious_offers",
  },
  {
    description: "Only show offers that line up with your wishlist.",
    label: tradePreferenceLabels.wishlist_only,
    value: "wishlist_only",
  },
  {
    description: "Keep offers focused on the categories you collect.",
    label: tradePreferenceLabels.restricted_categories,
    value: "restricted_categories",
  },
];

export const communicationPreferenceOptions: Array<{
  description: string;
  label: string;
  value: CommunicationPreference;
}> = [
  {
    description: "People with approved trade signals can message about your items.",
    label: communicationPreferenceLabels.approved_traders,
    value: "approved_traders",
  },
  {
    description: "Only verified collectors can start item or trade conversations.",
    label: communicationPreferenceLabels.verified_only,
    value: "verified_only",
  },
  {
    description: "Limit conversations to people with completed trade history.",
    label: communicationPreferenceLabels.completed_trade_users,
    value: "completed_trade_users",
  },
  {
    description: "Only strong item or wishlist matches can reach out.",
    label: communicationPreferenceLabels.matching_signal_users,
    value: "matching_signal_users",
  },
];

export const localConversations: LocalConversation[] = [
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
    participantId: "local_user_jordan_m",
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
    participantId: "local_user_avery_r",
    unreadCount: 0,
  },
];

export const LOCAL_THREADS_STORAGE_KEY = "konnesor_beta_local_threads";
export const LOCAL_TRADES_STORAGE_KEY = "konnesor_beta_local_trades";
export const LOCAL_FEEDBACK_STORAGE_KEY = "konnesor_beta_feedback";
export const LOCAL_BLOCKED_USERS_STORAGE_KEY = "konnesor_beta_blocked_users";
export const API_HEALTH_TIMEOUT_MS = 5000;
export let hasInitializedMobileSentry = false;

export const reportReasonOptions: Array<{ label: string; value: ReportReason }> = [
  { label: "Inappropriate content", value: "inappropriate_content" },
  { label: "Scam/fraud", value: "scam_fraud" },
  { label: "Harassment", value: "harassment" },
  { label: "Other", value: "other" },
];

export function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export function createInitialBackendHealthState(): BackendHealthState {
  return { apiBaseUrl: getMobileEnv().apiBaseUrl, status: "checking" };
}

export type BackendHealthResponse = {
  database?: string | undefined;
  service?: string | undefined;
  status?: string | undefined;
};

export function initializeMobileSentry() {
  if (hasInitializedMobileSentry) {
    return true;
  }

  const { sentryDsn } = getMobileEnv();
  if (!sentryDsn) {
    return false;
  }

  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0,
  });
  hasInitializedMobileSentry = true;
  return true;
}

export async function runBackendHealthCheck(): Promise<BackendHealthState> {
  const { apiBaseUrl } = getMobileEnv();
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const url = `${apiBaseUrl}${apiRoutes.health}`;

  try {
    const response = await withTimeout(fetch(url), API_HEALTH_TIMEOUT_MS);
    const durationMs = Date.now() - startedAt;
    let body: BackendHealthResponse = {};

    try {
      body = (await response.json()) as BackendHealthResponse;
    } catch (parseError) {
      reportBackendDiagnostic(
        "health.parse_failure",
        {
          apiBaseUrl,
          checkedAt,
          durationMs,
          httpStatus: response.status,
          reason: getDiagnosticErrorMessage(parseError),
        },
        parseError,
      );
    }

    if (!response.ok) {
      const result: BackendHealthState = {
        apiBaseUrl,
        checkedAt,
        database: body.database,
        durationMs,
        httpStatus: response.status,
        reason: `Health check returned HTTP ${response.status}`,
        service: body.service,
        status: "offline",
      };
      reportBackendDiagnostic("health.failure", result);
      return result;
    }

    const result: BackendHealthState = {
      apiBaseUrl,
      checkedAt,
      database: body.database,
      durationMs,
      httpStatus: response.status,
      service: body.service,
      status: "online",
    };
    reportBackendDiagnostic("health.success", result);
    return result;
  } catch (error) {
    const result: BackendHealthState = {
      apiBaseUrl,
      checkedAt,
      durationMs: Date.now() - startedAt,
      reason: getDiagnosticErrorMessage(error),
      status: "offline",
    };
    reportBackendDiagnostic("health.failure", result, error);
    return result;
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function reportBackendDiagnostic(
  event: string,
  payload: Record<string, unknown>,
  error?: unknown,
) {
  const message = `[Konnesor API] ${event}`;
  console.log(message, payload);

  if (!initializeMobileSentry()) {
    return;
  }

  const tags = { area: "backend-connectivity", event };
  if (error) {
    Sentry.captureException(error, { extra: payload, tags });
    return;
  }

  Sentry.captureMessage(message, { extra: payload, level: "info", tags });
}

export function getDiagnosticErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown backend error";
}

export function getDiagnosticErrorDetail(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack ?? error.name;
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error);
  }
  return undefined;
}

export function _createDemoPhoto(kind: ItemPhoto["kind"], sortOrder: number): ItemPhoto {
  return {
    createdAt: new Date().toISOString(),
    id: `demo_photo_${kind}_${Date.now()}_${sortOrder}`,
    kind,
    sortOrder,
    uri: Image.resolveAssetSource(konnesorSymbol).uri,
  };
}
export {
  Alert,
  Animated,
  AppErrorBoundary,
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
  CollectionStateProvider,
  DataSyncBootstrap,
  Easing,
  Image,
  ImagePicker,
  ITEM_CONDITIONS,
  ITEM_ERAS,
  Linking,
  MobileAuthProvider,
  OnboardingStateProvider,
  Pressable,
  SHIRT_SIZES,
  Sentry,
  SafeAreaProvider,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  ThemeProvider,
  UserProfileProvider,
  VINTAGE_CATEGORIES,
  View,
  WISHLIST_MATCH_PREFERENCES,
  WISHLIST_PRIORITIES,
  WISHLIST_VISIBILITY_OPTIONS,
  WebBrowser,
  WishlistStateProvider,
  apiRoutes,
  beta,
  categoryLabels,
  communicationPreferenceLabels,
  conditionLabels,
  getMobileEnv,
  getMockAiListingSuggestions,
  getPublishCheck,
  konnesorSymbol,
  konnesorWordmark,
  secureStorage,
  sizeLabels,
  statusLabels,
  tradePreferenceLabels,
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
};

export type {
  BlockedUser,
  CollectionSummary,
  CollectorType,
  CommunicationPreference,
  Conversation,
  ConversationMessage,
  ItemPhoto,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PublicTradeableItem,
  RecommendationSummary,
  ReportReason,
  ShirtSize,
  Trade,
  TradeItemSummary,
  TradeOfferPreference,
  TradeRecommendation,
  TradeStatus,
  TradeableItem,
  UserProfile,
  VintageCategory,
  WishlistItem,
  WishlistSummary,
};
