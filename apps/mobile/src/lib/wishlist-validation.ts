import type { WishlistItem } from "@ctn/types";

export type WishlistPublishCheck = {
  isValid: boolean;
  missing: string[];
};

export function getWishlistPublishCheck(item: WishlistItem): WishlistPublishCheck {
  const missing: string[] = [];

  if (item.title.trim().length < 3) {
    missing.push("Title");
  }

  if (!item.category) {
    missing.push("Category");
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
