import { describe, expect, it } from "vitest";

import {
  accessRequestSchema,
  conversationContextSchema,
  createConversationSchema,
  onboardingPreferencesSchema,
  sendMessageSchema,
  createTradeSchema,
  recommendationFeedbackSchema,
  tradeableItemDraftSchema,
  updateTradeStatusSchema,
  tradeableItemPublishSchema,
  wishlistItemDraftSchema,
  wishlistItemPublishSchema,
} from "./index";

describe("validation", () => {
  it("rejects unrestricted direct message contexts", () => {
    expect(() => conversationContextSchema.parse("direct")).toThrow();
  });

  it("only allows users to create item or trade conversations", () => {
    expect(() =>
      createConversationSchema.parse({
        contextType: "item",
        contextId: "00000000-0000-0000-0000-000000000001",
      }),
    ).not.toThrow();

    expect(() =>
      createConversationSchema.parse({
        contextType: "system",
        contextId: "00000000-0000-0000-0000-000000000001",
      }),
    ).toThrow();
  });

  it("requires non-empty contextual messages", () => {
    expect(() => sendMessageSchema.parse({ content: "Can you send tag photos?", type: "text" })).not.toThrow();
    expect(() => sendMessageSchema.parse({ content: " ", type: "text" })).toThrow();
  });

  it("requires meaningful access applications", () => {
    expect(() =>
      accessRequestSchema.parse({
        name: "A",
        email: "not-an-email",
        reason: "short",
      }),
    ).toThrow();
  });

  it("accepts complete onboarding preferences", () => {
    expect(() =>
      onboardingPreferencesSchema.parse({
        collectorType: "seller_collector",
        wornSizes: ["xl"],
        collectedSizes: ["xl", "xxl"],
        categories: ["rap", "harley", "sports"],
        tradePreference: "all_serious_offers",
        acceptsCashAdjustments: true,
        communicationPreference: "approved_traders",
        allowsPhotoRequests: true,
        allowsMeasurementRequests: true,
        notificationsEnabled: false,
      }),
    ).not.toThrow();
  });

  it("allows sparse item drafts", () => {
    expect(() => tradeableItemDraftSchema.parse({ title: "" })).not.toThrow();
  });

  it("requires complete tradeable items before publish", () => {
    expect(() => tradeableItemPublishSchema.parse({ title: "1996 Bulls tee", status: "tradeable" })).toThrow();
  });

  it("allows sparse wishlist drafts", () => {
    expect(() => wishlistItemDraftSchema.parse({ title: "" })).not.toThrow();
  });

  it("requires title and category for active wishlist wants", () => {
    expect(() => wishlistItemPublishSchema.parse({ title: "Mosquitohead", priority: "high" })).toThrow();
  });

  it("accepts concise recommendation feedback", () => {
    expect(() =>
      recommendationFeedbackSchema.parse({
        rating: "not_relevant",
        reason: "wrong_size",
      }),
    ).not.toThrow();
  });

  it("validates trade offer inputs", () => {
    expect(() =>
      createTradeSchema.parse({
        proposerItemId: "00000000-0000-0000-0000-000000000001",
        counterpartyItemId: "00000000-0000-0000-0000-000000000002",
      }),
    ).not.toThrow();
    expect(() => updateTradeStatusSchema.parse({ status: "pending" })).toThrow();
  });
});
