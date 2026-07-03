import { describe, expect, it } from "vitest";

import type { TradeableItem } from "@ctn/types";

import { getPublishCheck } from "./item-validation";

const baseItem: TradeableItem = {
  id: "item_1",
  ownerId: "user_1",
  photos: [],
  title: "",
  measurements: { unit: "in" },
  flaws: [],
  estimatedValue: { currency: "USD" },
  status: "draft",
  visibility: "private",
  communicationPreference: "approved_traders",
  allowsPhotoRequests: true,
  allowsMeasurementRequests: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("getPublishCheck", () => {
  it("blocks incomplete drafts from becoming tradeable", () => {
    const result = getPublishCheck(baseItem);

    expect(result.isValid).toBe(false);
    expect(result.missing).toContain("At least one photo");
  });

  it("allows complete tradeable-ready items", () => {
    const result = getPublishCheck({
      ...baseItem,
      photos: [
        {
          id: "photo_1",
          uri: "mock://photo",
          kind: "front",
          sortOrder: 0,
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      title: "1996 Bulls tee",
      category: "sports",
      size: "xl",
      tag: "Salem",
      condition: "very_good",
      tradePreference: "all_serious_offers",
      visibility: "approved_members",
    });

    expect(result.isValid).toBe(true);
  });
});
