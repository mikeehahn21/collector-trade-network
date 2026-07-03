import type {
  ConversationMessageResponse,
  ConversationMessagesResponse,
  ConversationResponse,
  ConversationsResponse,
  ItemResponse,
  ItemVerificationStatusResponse,
  ItemVerificationVideoRequest,
  ItemsResponse,
  MeResponse,
  PublicItemResponse,
  RecommendationFeedbackResponse,
  RecommendationResponse,
  RecommendationsResponse,
  TradeResponse,
  TradesResponse,
  WishlistItemResponse,
  WishlistItemsResponse,
} from "@ctn/api-contracts";
import { apiRoutes } from "@ctn/api-contracts";
import type {
  CreateTradeInput,
  CounterTradeInput,
  DisputeTradeInput,
  SendMessageInput,
  ShipTradeInput,
  RecommendationFeedbackRating,
  TradeStatus,
  TradeableItem,
  UserProfile,
  WishlistItem,
} from "@ctn/types";

import { getMobileEnv } from "@/config/env";

export type AuthHeaderProvider = () => Promise<{
  bearerToken?: string | undefined;
  clerkUserId?: string | undefined;
  email?: string | undefined;
} | undefined>;

export type ApiClient = {
  getMe: () => Promise<MeResponse>;
  upsertMe: (
    profile: Pick<
      UserProfile,
      "bio" | "displayName" | "email" | "locationRegion" | "socialHandle"
    >,
  ) => Promise<MeResponse>;
  listItems: () => Promise<ItemsResponse>;
  createItem: (item: Partial<TradeableItem>) => Promise<ItemResponse>;
  publishItem: (item: Partial<TradeableItem>) => Promise<ItemResponse>;
  updateItem: (itemId: string, item: Partial<TradeableItem>) => Promise<ItemResponse>;
  deleteItem: (itemId: string) => Promise<void>;
  uploadItemVerificationVideo: (
    itemId: string,
    input: ItemVerificationVideoRequest,
  ) => Promise<ItemVerificationStatusResponse>;
  getItemVerificationStatus: (itemId: string) => Promise<ItemVerificationStatusResponse>;
  getPublicItem: (itemId: string) => Promise<PublicItemResponse>;
  listWishlistItems: () => Promise<WishlistItemsResponse>;
  createWishlistItem: (item: Partial<WishlistItem>) => Promise<WishlistItemResponse>;
  publishWishlistItem: (item: Partial<WishlistItem>) => Promise<WishlistItemResponse>;
  updateWishlistItem: (
    wishlistItemId: string,
    item: Partial<WishlistItem>,
  ) => Promise<WishlistItemResponse>;
  deleteWishlistItem: (wishlistItemId: string) => Promise<void>;
  listRecommendations: () => Promise<RecommendationsResponse>;
  getRecommendation: (recommendationId: string) => Promise<RecommendationResponse>;
  submitRecommendationFeedback: (
    recommendationId: string,
    input: {
      rating: RecommendationFeedbackRating;
      targetItemId?: string | undefined;
    },
  ) => Promise<RecommendationFeedbackResponse>;
  createTrade: (input: CreateTradeInput) => Promise<TradeResponse>;
  listTrades: () => Promise<TradesResponse>;
  getTrade: (tradeId: string) => Promise<TradeResponse>;
  updateTradeStatus: (
    tradeId: string,
    status: Extract<TradeStatus, "accepted" | "declined" | "cancelled">,
  ) => Promise<TradeResponse>;
  counterTrade: (
    tradeId: string,
    input: CounterTradeInput,
  ) => Promise<TradeResponse>;
  shipTrade: (tradeId: string, input: ShipTradeInput) => Promise<TradeResponse>;
  receiveTrade: (tradeId: string) => Promise<TradeResponse>;
  completeTrade: (tradeId: string) => Promise<TradeResponse>;
  disputeTrade: (tradeId: string, input: DisputeTradeInput) => Promise<TradeResponse>;
  createConversation: (input: {
    contextType: "item" | "trade";
    contextId: string;
  }) => Promise<ConversationResponse>;
  listConversations: () => Promise<ConversationsResponse>;
  getConversation: (conversationId: string) => Promise<ConversationResponse>;
  listMessages: (
    conversationId: string,
    before?: string | undefined,
  ) => Promise<ConversationMessagesResponse>;
  sendMessage: (
    conversationId: string,
    input: SendMessageInput,
  ) => Promise<ConversationMessageResponse>;
  markMessageRead: (messageId: string) => Promise<void>;
  markConversationTyping: (conversationId: string) => Promise<void>;
};

export function createApiClient(getAuthHeaders: AuthHeaderProvider): ApiClient {
  const { apiBaseUrl } = getMobileEnv();

  async function request<TResponse>(
    path: string,
    options: RequestInit = {},
  ): Promise<TResponse> {
    const auth = await getAuthHeaders();
    const response = await fetchWithRetry(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(auth?.bearerToken ? { authorization: `Bearer ${auth.bearerToken}` } : {}),
        ...(auth?.clerkUserId ? { "x-clerk-user-id": auth.clerkUserId } : {}),
        ...(auth?.email ? { "x-user-email": auth.email } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  return {
    getMe: () => request<MeResponse>(apiRoutes.me),
    upsertMe: (profile) =>
      request<MeResponse>(apiRoutes.me, { method: "PUT", body: JSON.stringify(profile) }),
    listItems: () => request<ItemsResponse>(apiRoutes.items),
    createItem: (item) =>
      request<ItemResponse>(apiRoutes.items, { method: "POST", body: JSON.stringify(item) }),
    publishItem: (item) =>
      request<ItemResponse>(`${apiRoutes.items}/publish`, {
        method: "POST",
        body: JSON.stringify(item),
      }),
    updateItem: (itemId, item) =>
      request<ItemResponse>(`/v1/items/${itemId}`, { method: "PUT", body: JSON.stringify(item) }),
    deleteItem: (itemId) => request<void>(`/v1/items/${itemId}`, { method: "DELETE" }),
    uploadItemVerificationVideo: (itemId, input) =>
      request<ItemVerificationStatusResponse>(`/v1/items/${itemId}/verification-video`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getItemVerificationStatus: (itemId) =>
      request<ItemVerificationStatusResponse>(`/v1/items/${itemId}/verification-status`),
    getPublicItem: (itemId) => request<PublicItemResponse>(`/v1/public/items/${itemId}`),
    listWishlistItems: () => request<WishlistItemsResponse>(apiRoutes.wishlistItems),
    createWishlistItem: (item) =>
      request<WishlistItemResponse>(apiRoutes.wishlistItems, {
        method: "POST",
        body: JSON.stringify(item),
      }),
    publishWishlistItem: (item) =>
      request<WishlistItemResponse>(`${apiRoutes.wishlistItems}/publish`, {
        method: "POST",
        body: JSON.stringify(item),
      }),
    updateWishlistItem: (wishlistItemId, item) =>
      request<WishlistItemResponse>(`/v1/wishlist-items/${wishlistItemId}`, {
        method: "PUT",
        body: JSON.stringify(item),
      }),
    deleteWishlistItem: (wishlistItemId) =>
      request<void>(`/v1/wishlist-items/${wishlistItemId}`, { method: "DELETE" }),
    listRecommendations: () => request<RecommendationsResponse>(apiRoutes.recommendations),
    getRecommendation: (recommendationId) =>
      request<RecommendationResponse>(`/v1/recommendations/${recommendationId}`),
    submitRecommendationFeedback: (recommendationId, input) =>
      request<RecommendationFeedbackResponse>(`/v1/recommendations/${recommendationId}/feedback`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    createTrade: (input) =>
      request<TradeResponse>(apiRoutes.trades, { method: "POST", body: JSON.stringify(input) }),
    listTrades: () => request<TradesResponse>(apiRoutes.trades),
    getTrade: (tradeId) => request<TradeResponse>(`/v1/trades/${tradeId}`),
    updateTradeStatus: (tradeId, status) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    counterTrade: (tradeId, input) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/counter`, {
        method: "POST",
        body: JSON.stringify({
          proposerItemId: input.proposerItemId,
          counterpartyItemId: input.counterpartyItemId,
          counterpartyNotes: input.counterpartyNotes,
        }),
      }),
    shipTrade: (tradeId, input) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/ship`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    receiveTrade: (tradeId) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/receive`, {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    completeTrade: (tradeId) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    disputeTrade: (tradeId, input) =>
      request<TradeResponse>(`/v1/trades/${tradeId}/dispute`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    createConversation: (input) =>
      request<ConversationResponse>(apiRoutes.conversations, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listConversations: () => request<ConversationsResponse>(apiRoutes.conversations),
    getConversation: (conversationId) =>
      request<ConversationResponse>(`/v1/conversations/${conversationId}`),
    listMessages: (conversationId, before) =>
      request<ConversationMessagesResponse>(
        `/v1/conversations/${conversationId}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`,
      ),
    sendMessage: (conversationId, input) =>
      request<ConversationMessageResponse>(`/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    markMessageRead: (messageId) =>
      request<void>(`/v1/messages/${messageId}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    markConversationTyping: (conversationId) =>
      request<void>(apiRoutes.conversationTyping, {
        method: "POST",
        body: JSON.stringify({ conversationId }),
      }),
  };
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  const maxAttempts = options.method && options.method !== "GET" ? 2 : 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, options);

      if (response.status < 500 || attempt === maxAttempts) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}
