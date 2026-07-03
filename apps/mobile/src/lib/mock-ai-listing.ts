import type { AiListingSuggestions, TradeableItem } from "@ctn/types";

export function getMockAiListingSuggestions(item: TradeableItem): AiListingSuggestions {
  const now = new Date().toISOString();
  const titleSignal = item.title.trim().toLowerCase();

  return {
    title: item.title.trim() || "Vintage graphic tee",
    category: item.category ?? (titleSignal.includes("harley") ? "harley" : "band"),
    size: item.size ?? "xl",
    era: item.era ?? "90s",
    condition: item.condition ?? "very_good",
    tag: item.tag ?? "Single stitch tag",
    estimatedValue:
      item.estimatedValue.min || item.estimatedValue.max
        ? item.estimatedValue
        : { min: 120, max: 220, currency: "USD" },
    confidence: item.photos.length > 1 ? "medium" : "low",
    generatedAt: now,
  };
}
