import type {
  ApiHealth,
  AiReviewWebhookInput,
  BlockedUser,
  Conversation,
  ConversationMessage,
  ItemVerificationVideoInput,
  PublicTradeableItem,
  RecommendationFeedback,
  RecommendationFeedbackMetrics,
  RecommendationSummary,
  Trade,
  TradeSummary,
  TradeableItem,
  TradeRecommendation,
  UserReport,
  UserProfile,
  WishlistItem,
} from "@ctn/types";

import {
  accessRequestSchema,
  aiReviewWebhookSchema,
  blockUserSchema,
  createConversationSchema,
  healthResponseSchema,
  aiListingImageInputSchema,
  inviteCodeSchema,
  itemVerificationVideoSchema,
  markMessageReadSchema,
  tradeableItemDraftSchema,
  tradeableItemPublishSchema,
  recommendationFeedbackSchema,
  reportUserSchema,
  sendMessageSchema,
  conversationTypingSchema,
  counterTradeSchema,
  createTradeSchema,
  disputeTradeSchema,
  shipTradeSchema,
  tradeCompletionSchema,
  updateTradeStatusSchema,
  wishlistItemDraftSchema,
  wishlistItemPublishSchema,
} from "@ctn/validation";

export const apiRoutes = {
  health: "/health",
  accessRequests: "/v1/access-requests",
  inviteCode: "/v1/access/invite-code",
  waitlistStatus: "/v1/access/waitlist",
  systemConfig: "/v1/admin/system-config",
  items: "/v1/items",
  itemById: "/v1/items/:itemId",
  publicItems: "/v1/public/items",
  publicItemById: "/v1/public/items/:itemId",
  itemAiSuggestions: "/v1/items/ai-suggestions",
  itemVerificationVideo: "/v1/items/:itemId/verification-video",
  itemVerificationStatus: "/v1/items/:itemId/verification-status",
  aiReviewWebhook: "/v1/webhooks/ai-review",
  wishlistItems: "/v1/wishlist-items",
  wishlistItemById: "/v1/wishlist-items/:wishlistItemId",
  me: "/v1/me",
  deleteMe: "/v1/me",
  recommendations: "/v1/recommendations",
  recommendationById: "/v1/recommendations/:recommendationId",
  recommendationFeedback: "/v1/recommendations/:recommendationId/feedback",
  recommendationFeedbackMetrics: "/v1/admin/recommendation-feedback/metrics",
  reputationMetrics: "/v1/admin/reputation/metrics",
  reputationRecalculate: "/v1/admin/reputation/recalculate",
  trades: "/v1/trades",
  tradeById: "/v1/trades/:tradeId",
  tradeStatus: "/v1/trades/:tradeId/status",
  tradeCounter: "/v1/trades/:tradeId/counter",
  tradeShip: "/v1/trades/:tradeId/ship",
  tradeReceive: "/v1/trades/:tradeId/receive",
  tradeComplete: "/v1/trades/:tradeId/complete",
  tradeDispute: "/v1/trades/:tradeId/dispute",
  conversations: "/v1/conversations",
  conversationMessages: "/v1/conversations/:conversationId/messages",
  messageRead: "/v1/messages/:messageId/read",
  conversationTyping: "/v1/conversations/typing",
  reports: "/v1/reports",
  blockedUsers: "/v1/blocked-users",
  blockedUserById: "/v1/blocked-users/:blockedUserId",
} as const;

export const healthContract = {
  method: "GET",
  path: apiRoutes.health,
  response: healthResponseSchema,
} as const;

export type HealthResponse = ApiHealth & {
  database?: string;
};

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

export const waitlistStatusContract = {
  method: "GET",
  path: apiRoutes.waitlistStatus,
} as const;

export type WaitlistStatusResponse = {
  position: number;
  totalWaitlisted: number;
  estimatedWaitDays?: number | undefined;
};

export const systemConfigContract = {
  method: "GET",
  path: apiRoutes.systemConfig,
} as const;

export type SystemConfigResponse = {
  config: {
    accessMode: "invite_only" | "application" | "waitlist" | "public";
    dailyInviteLimit: number;
  };
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
  body: tradeableItemDraftSchema
    .pick({ photos: true, title: true, category: true, size: true })
    .extend({ aiImage: aiListingImageInputSchema.optional() }),
} as const;

export const itemVerificationVideoContract = {
  method: "POST",
  path: apiRoutes.itemVerificationVideo,
  body: itemVerificationVideoSchema,
} as const;

export const aiReviewWebhookContract = {
  method: "POST",
  path: apiRoutes.aiReviewWebhook,
  body: aiReviewWebhookSchema,
} as const;

export const recommendationFeedbackContract = {
  method: "POST",
  path: apiRoutes.recommendationFeedback,
  body: recommendationFeedbackSchema,
} as const;

export const createTradeContract = {
  method: "POST",
  path: apiRoutes.trades,
  body: createTradeSchema,
} as const;

export const updateTradeStatusContract = {
  method: "PATCH",
  path: apiRoutes.tradeStatus,
  body: updateTradeStatusSchema,
} as const;

export const counterTradeContract = {
  method: "POST",
  path: apiRoutes.tradeCounter,
  body: counterTradeSchema,
} as const;

export const shipTradeContract = {
  method: "PATCH",
  path: apiRoutes.tradeShip,
  body: shipTradeSchema,
} as const;

export const receiveTradeContract = {
  method: "PATCH",
  path: apiRoutes.tradeReceive,
} as const;

export const completeTradeContract = {
  method: "PATCH",
  path: apiRoutes.tradeComplete,
  body: tradeCompletionSchema,
} as const;

export const disputeTradeContract = {
  method: "POST",
  path: apiRoutes.tradeDispute,
  body: disputeTradeSchema,
} as const;

export const createConversationContract = {
  method: "POST",
  path: apiRoutes.conversations,
  body: createConversationSchema,
} as const;

export const sendMessageContract = {
  method: "POST",
  path: apiRoutes.conversationMessages,
  body: sendMessageSchema,
} as const;

export const markMessageReadContract = {
  method: "PATCH",
  path: apiRoutes.messageRead,
  body: markMessageReadSchema,
} as const;

export const conversationTypingContract = {
  method: "POST",
  path: apiRoutes.conversationTyping,
  body: conversationTypingSchema,
} as const;

export const reportUserContract = {
  method: "POST",
  path: apiRoutes.reports,
  body: reportUserSchema,
} as const;

export const blockUserContract = {
  method: "POST",
  path: apiRoutes.blockedUsers,
  body: blockUserSchema,
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

export type DeleteAccountResponse = {
  status: "deleted";
};

export type ItemsResponse = {
  items: TradeableItem[];
};

export type ItemResponse = {
  item: TradeableItem;
};

export type ItemVerificationVideoRequest = ItemVerificationVideoInput;

export type ItemVerificationStatusResponse = {
  item: Pick<
    TradeableItem,
    | "aiMetadata"
    | "id"
    | "verificationFailedReason"
    | "verificationStatus"
    | "verificationVideoUrl"
    | "verifiedAt"
  >;
};

export type AiReviewWebhookRequest = AiReviewWebhookInput;

export type PublicItemResponse = {
  item: PublicTradeableItem;
};

export type PublicItemsResponse = {
  items: PublicTradeableItem[];
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

export type TradesResponse = {
  trades: Trade[];
  summary: TradeSummary;
};

export type TradeResponse = {
  trade: Trade;
};

export type ReportUserResponse = {
  report: UserReport;
};

export type BlockUserResponse = {
  blockedUser: BlockedUser;
};

export type BlockedUsersResponse = {
  blockedUsers: BlockedUser[];
};

export type ConversationsResponse = {
  conversations: Conversation[];
};

export type ConversationResponse = {
  conversation: Conversation;
};

export type ConversationMessagesResponse = {
  messages: ConversationMessage[];
  nextBefore?: string | undefined;
};

export type ConversationMessageResponse = {
  message: ConversationMessage;
};

import type { ReputationMetrics } from "@ctn/types";

export const reputationMetricsContract = {
  method: "GET",
  path: apiRoutes.reputationMetrics,
} as const;

export const reputationRecalculateContract = {
  method: "POST",
  path: apiRoutes.reputationRecalculate,
} as const;

export type ReputationMetricsResponse = {
  metrics: ReputationMetrics;
};

export type ReputationRecalculateResponse = {
  status: "queued";
};
