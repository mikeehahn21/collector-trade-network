import { describe, expect, it } from "vitest";

import {
  accessRequestSchema,
  conversationContextSchema,
  onboardingPreferencesSchema,
  recommendationFeedbackSchema,
  tradeableItemDraftSchema,
  tradeableItemPublishSchema,
  wishlistItemDraftSchema,
  wishlistItemPublishSchema,
} from "./index";

describe("validation", () => {
  it("rejects unrestricted direct message contexts", () => {
    expect(() => conversationContextSchema.parse("direct")).toThrow();
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
    expect(() =>
      tradeableItemPublishSchema.parse({ title: "1996 Bulls tee", status: "tradeable" }),
    ).toThrow();
  });

  it("allows sparse wishlist drafts", () => {
    expect(() => wishlistItemDraftSchema.parse({ title: "" })).not.toThrow();
  });

  it("requires title and category for active wishlist wants", () => {
    expect(() =>
      wishlistItemPublishSchema.parse({ title: "Mosquitohead", priority: "high" }),
    ).toThrow();
  });

  it("accepts concise recommendation feedback", () => {
    expect(() =>
      recommendationFeedbackSchema.parse({
        rating: "not_relevant",
        reason: "wrong_size",
      }),
    ).not.toThrow();
  });
});
