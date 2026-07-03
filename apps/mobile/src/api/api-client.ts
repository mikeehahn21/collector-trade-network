import type {
  ItemResponse,
  ItemsResponse,
  MeResponse,
  RecommendationResponse,
  RecommendationsResponse,
  WishlistItemResponse,
  WishlistItemsResponse,
} from "@ctn/api-contracts";
import { apiRoutes } from "@ctn/api-contracts";
import type { TradeableItem, UserProfile, WishlistItem } from "@ctn/types";

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
