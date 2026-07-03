import type {
  ApiHealth,
  PublicTradeableItem,
  RecommendationFeedback,
  RecommendationFeedbackMetrics,
  RecommendationSummary,
  TradeableItem,
  TradeRecommendation,
  UserProfile,
  WishlistItem,
} from "@ctn/types";

import {
  accessRequestSchema,
  healthResponseSchema,
  inviteCodeSchema,
  tradeableItemDraftSchema,
  tradeableItemPublishSchema,
  recommendationFeedbackSchema,
  wishlistItemDraftSchema,
  wishlistItemPublishSchema,
} from "@ctn/validation";

export const apiRoutes = {
  health: "/health",
  accessRequests: "/v1/access-requests",
  inviteCode: "/v1/access/invite-code",
  items: "/v1/items",
  itemById: "/v1/items/:itemId",
  publicItemById: "/v1/public/items/:itemId",
  itemAiSuggestions: "/v1/items/ai-suggestions",
  wishlistItems: "/v1/wishlist-items",
  wishlistItemById: "/v1/wishlist-items/:wishlistItemId",
  me: "/v1/me",
  recommendations: "/v1/recommendations",
  recommendationById: "/v1/recommendations/:recommendationId",
  recommendationFeedback: "/v1/recommendations/:recommendationId/feedback",
  recommendationFeedbackMetrics: "/v1/admin/recommendation-feedback/metrics",
} as const;

export const healthContract = {
  method: "GET",
  path: apiRoutes.health,
  response: healthResponseSchema,
} as const;

export type HealthResponse = ApiHealth;

export const accessRequestContract = {
  method: "POST",
  path: apiRoutes.accessRequests,
  body: accessRequestSchema,
} as const;

export type AccessRequestResponse = {
  status: "received";
  message: string;
};

export const inviteCodeContract = {
  method: "POST",
  path: apiRoutes.inviteCode,
  body: inviteCodeSchema,
} as const;

export type InviteCodeResponse = {
  status: "accepted";
  accessStatus: "invited";
};

export const itemDraftContract = {
  method: "POST",
  path: apiRoutes.items,
  body: tradeableItemDraftSchema,
} as const;

export const itemPublishContract = {
  method: "POST",
  path: `${apiRoutes.items}/publish`,
  body: tradeableItemPublishSchema,
} as const;

export const itemAiSuggestionContract = {
  method: "POST",
  path: apiRoutes.itemAiSuggestions,
  body: tradeableItemDraftSchema.pick({ photos: true, title: true, category: true, size: true }),
} as const;

export const recommendationFeedbackContract = {
  method: "POST",
  path: apiRoutes.recommendationFeedback,
  body: recommendationFeedbackSchema,
} as const;

export const wishlistItemDraftContract = {
  method: "POST",
  path: apiRoutes.wishlistItems,
  body: wishlistItemDraftSchema,
} as const;

export const wishlistItemPublishContract = {
  method: "POST",
  path: `${apiRoutes.wishlistItems}/publish`,
  body: wishlistItemPublishSchema,
} as const;

export type MeResponse = {
  user: UserProfile;
};

export type ItemsResponse = {
  items: TradeableItem[];
};

export type ItemResponse = {
  item: TradeableItem;
};

export type PublicItemResponse = {
  item: PublicTradeableItem;
};

export type WishlistItemsResponse = {
  wishlistItems: WishlistItem[];
};

export type WishlistItemResponse = {
  wishlistItem: WishlistItem;
};

export type RecommendationsResponse = {
  recommendations: TradeRecommendation[];
  summary: RecommendationSummary;
};

export type RecommendationResponse = {
  recommendation: TradeRecommendation;
};

export type RecommendationFeedbackResponse = {
  feedback: RecommendationFeedback;
};

export type RecommendationFeedbackMetricsResponse = {
  metrics: RecommendationFeedbackMetrics;
};
