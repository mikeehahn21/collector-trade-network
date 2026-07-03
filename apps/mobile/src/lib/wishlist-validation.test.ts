import { describe, expect, it } from "vitest";

import type { WishlistItem } from "@ctn/types";

import { getWishlistPublishCheck } from "./wishlist-validation";

const baseWish: WishlistItem = {
  id: "wish_1",
  ownerId: "user_1",
  title: "",
  priority: "medium",
  isGrail: false,
  matchPreference: "similar",
  visibility: "approved_members",
  isArchived: false,
  sortOrder: 0,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("getWishlistPublishCheck", () => {
  it("requires title and category", () => {
    const result = getWishlistPublishCheck(baseWish);

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual(["Title", "Category"]);
  });

  it("allows a complete demand signal", () => {
    const result = getWishlistPublishCheck({
      ...baseWish,
      title: "Mosquitohead Soundgarden",
      category: "band",
    });

    expect(result.isValid).toBe(true);
  });
});
