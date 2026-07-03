import { describe, expect, it } from "vitest";

import { apiRoutes } from "./index";

describe("api contracts", () => {
  it("defines health route", () => {
    expect(apiRoutes.health).toBe("/health");
  });

  it("defines Sprint 1 access routes", () => {
    expect(apiRoutes.accessRequests).toBe("/v1/access-requests");
    expect(apiRoutes.inviteCode).toBe("/v1/access/invite-code");
  });

  it("defines Sprint 2 item routes", () => {
    expect(apiRoutes.items).toBe("/v1/items");
    expect(apiRoutes.itemAiSuggestions).toBe("/v1/items/ai-suggestions");
  });

  it("defines Sprint 3 wishlist routes", () => {
    expect(apiRoutes.wishlistItems).toBe("/v1/wishlist-items");
  });

  it("defines Sprint 6 recommendation routes", () => {
    expect(apiRoutes.recommendations).toBe("/v1/recommendations");
  });

  it("defines Sprint 7 item inspection and feedback routes", () => {
    expect(apiRoutes.publicItemById).toBe("/v1/public/items/:itemId");
    expect(apiRoutes.recommendationFeedback).toBe("/v1/recommendations/:recommendationId/feedback");
    expect(apiRoutes.recommendationFeedbackMetrics).toBe(
      "/v1/admin/recommendation-feedback/metrics",
    );
  });

  it("defines Sprint 11 item verification routes", () => {
    expect(apiRoutes.itemVerificationVideo).toBe("/v1/items/:itemId/verification-video");
    expect(apiRoutes.itemVerificationStatus).toBe("/v1/items/:itemId/verification-status");
    expect(apiRoutes.aiReviewWebhook).toBe("/v1/webhooks/ai-review");
  });

  it("defines Sprint 8 trade routes", () => {
    expect(apiRoutes.trades).toBe("/v1/trades");
    expect(apiRoutes.tradeById).toBe("/v1/trades/:tradeId");
    expect(apiRoutes.tradeStatus).toBe("/v1/trades/:tradeId/status");
    expect(apiRoutes.tradeCounter).toBe("/v1/trades/:tradeId/counter");
  });

  it("defines Sprint 10 trade execution routes", () => {
    expect(apiRoutes.tradeShip).toBe("/v1/trades/:tradeId/ship");
    expect(apiRoutes.tradeReceive).toBe("/v1/trades/:tradeId/receive");
    expect(apiRoutes.tradeComplete).toBe("/v1/trades/:tradeId/complete");
    expect(apiRoutes.tradeDispute).toBe("/v1/trades/:tradeId/dispute");
  });

  it("defines Sprint 9 contextual conversation routes", () => {
    expect(apiRoutes.conversations).toBe("/v1/conversations");
    expect(apiRoutes.conversationMessages).toBe("/v1/conversations/:conversationId/messages");
    expect(apiRoutes.messageRead).toBe("/v1/messages/:messageId/read");
    expect(apiRoutes.conversationTyping).toBe("/v1/conversations/typing");
  });
});
