import type { TradeableItem } from "@ctn/types";

export type PublishCheck = {
  isValid: boolean;
  missing: string[];
};

export function getPublishCheck(item: TradeableItem): PublishCheck {
  const missing: string[] = [];

  if (item.photos.length === 0) {
    missing.push("At least one photo");
  }

  if (item.title.trim().length < 3) {
    missing.push("Title");
  }

  if (!item.category) {
    missing.push("Category");
  }

  if (!item.size) {
    missing.push("Size");
  }

  if (!item.tag?.trim()) {
    missing.push("Tag");
  }

  if (!item.condition) {
    missing.push("Condition");
  }

  if (!item.tradePreference) {
    missing.push("Trade preference");
  }

  if (item.visibility === "private") {
    missing.push("Member visibility");
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
