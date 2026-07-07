import { describe, expect, it } from "vitest";

import type { TradeGraphDataset } from "../../db/repositories/trade-graph.repository";
import { generateTradeRecommendations } from "./recommendation-engine";

const now = "2026-07-01T00:00:00.000Z";

describe("generateTradeRecommendations", () => {
  it("creates explainable mutual grail recommendations", () => {
    const dataset: TradeGraphDataset = {
      currentUser: {
        id: "user_a",
        clerkUserId: "clerk_a",
        email: "a@example.com",
        displayName: "Collector A",
        accessStatus: "active",
        roles: ["active_trader"],
        trustScore: 50,
        isElite: false,
        reputationUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      inventory: [
        {
          id: "item_a",
          ownerId: "user_a",
          ownerDisplayName: "Collector A",
          photos: [],
          title: "1996 Bulls tee",
          category: "sports",
          size: "xl",
          measurements: { unit: "in" },
          flaws: [],
          estimatedValue: { currency: "USD" },
          status: "tradeable",
          verificationStatus: "verified",
          visibility: "approved_members",
          communicationPreference: "approved_traders",
          allowsPhotoRequests: true,
          allowsMeasurementRequests: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "item_b",
          ownerId: "user_b",
          ownerDisplayName: "Collector B",
          photos: [],
          title: "Mosquitohead Soundgarden",
          category: "band",
          size: "xl",
          measurements: { unit: "in" },
          flaws: [],
          estimatedValue: { currency: "USD" },
          status: "tradeable",
          verificationStatus: "verified",
          visibility: "approved_members",
          communicationPreference: "approved_traders",
          allowsPhotoRequests: true,
          allowsMeasurementRequests: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      wishlist: [
        {
          id: "wish_a",
          ownerId: "user_a",
          ownerDisplayName: "Collector A",
          title: "Mosquitohead Soundgarden",
          category: "band",
          size: "xl",
          priority: "high",
          isGrail: true,
          matchPreference: "exact",
          visibility: "approved_members",
          isArchived: false,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "wish_b",
          ownerId: "user_b",
          ownerDisplayName: "Collector B",
          title: "Bulls",
          category: "sports",
          size: "xl",
          priority: "medium",
          isGrail: false,
          matchPreference: "similar",
          visibility: "approved_members",
          isArchived: false,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    const result = generateTradeRecommendations(dataset);

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]?.isMutual).toBe(true);
    expect(result.recommendations[0]?.hasGrailMatch).toBe(true);
    expect(result.recommendations[0]?.reasons.length).toBeGreaterThan(3);
  });
});
