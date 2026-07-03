import type {
  RecommendationConfidence,
  RecommendationMatchType,
  RecommendationReason,
  ShirtSize,
  TradeRecommendation,
  VintageCategory,
} from "@ctn/types";

import type { CandidateMatchGroup, ItemWishlistMatch } from "./trade-graph.types";

export function scoreCandidateGroup(group: CandidateMatchGroup): TradeRecommendation {
  const reasons: RecommendationReason[] = [];
  const allMatches = [...group.theirItemsForYourWishlist, ...group.yourItemsForTheirWishlist];
  const isMutual =
    group.theirItemsForYourWishlist.length > 0 && group.yourItemsForTheirWishlist.length > 0;
  const hasGrailMatch = allMatches.some((match) => match.isGrail);
  const hasExactMatch = allMatches.some((match) => match.isExact);
  const hasSimilarMatch = allMatches.some((match) => match.isSimilar);
  const sharedCategories = unique(
    allMatches.map((match) => match.item.category).filter(Boolean) as VintageCategory[],
  );
  const compatibleSizes = unique(
    allMatches
      .filter((match) => match.sizeMatches && match.item.size)
      .map((match) => match.item.size) as ShirtSize[],
  );

  if (group.theirItemsForYourWishlist.length > 0) {
    reasons.push({
      code: "their_item_matches_your_wishlist",
      label: "They have something you want",
      detail: `${group.counterparty.displayName} has inventory matching your wishlist.`,
      points: 20,
    });
  }

  if (group.yourItemsForTheirWishlist.length > 0) {
    reasons.push({
      code: "your_item_matches_their_wishlist",
      label: "You have something they want",
      detail: `Your inventory matches ${group.counterparty.displayName}'s wishlist.`,
      points: 20,
    });
  }

  if (isMutual) {
    reasons.push({
      code: "mutual_demand",
      label: "Mutual demand",
      detail: "Both collectors have supply that overlaps with the other person's demand.",
      points: 30,
    });
  }

  if (hasGrailMatch) {
    reasons.push({
      code: "grail_match",
      label: "Grail signal",
      detail: "At least one matched wishlist item is marked as a Grail.",
      points: 25,
    });
  }

  if (hasExactMatch) {
    reasons.push({
      code: "exact_match",
      label: "Exact match",
      detail: "At least one item matches an exact-match wishlist entry.",
      points: 20,
    });
  }

  if (hasSimilarMatch) {
    reasons.push({
      code: "similar_match",
      label: "Similar accepted",
      detail: "At least one wishlist entry accepts similar items in the same category.",
      points: 8,
    });
  }

  if (sharedCategories.length > 0) {
    reasons.push({
      code: "category_overlap",
      label: "Category overlap",
      detail: `Shared category signal: ${sharedCategories.join(", ")}.`,
      points: Math.min(sharedCategories.length * 5, 15),
    });
  }

  if (compatibleSizes.length > 0) {
    reasons.push({
      code: "size_compatible",
      label: "Size compatible",
      detail: `Compatible size signal: ${compatibleSizes.join(", ")}.`,
      points: Math.min(compatibleSizes.length * 6, 18),
    });
  }

  reasons.push({
    code: "active_tradeable_inventory",
    label: "Active tradeable inventory",
    detail: "Only active tradeable inventory is used in this recommendation.",
    points: 10,
  });

  reasons.push({
    code: "profile_quality",
    label: "Approved collector",
    detail: "Only active approved users are included in Trade Graph v1.",
    points: 5,
  });

  const score = Math.min(
    reasons.reduce((sum, reason) => sum + reason.points, 0),
    100,
  );
  const matchTypes = buildMatchTypes({ hasExactMatch, hasGrailMatch, hasSimilarMatch, isMutual });

  return {
    id: buildRecommendationId(group),
    collectorId: group.currentUser.id,
    counterpartyId: group.counterparty.id,
    counterpartyDisplayName: group.counterparty.displayName,
    matchTypes,
    confidence: confidenceFromScore(score),
    score,
    reasons,
    yourMatchingItems: group.yourItemsForTheirWishlist.map((match) =>
      itemSummary(match, group.currentUser.displayName),
    ),
    theirMatchingItems: group.theirItemsForYourWishlist.map((match) =>
      itemSummary(match, group.counterparty.displayName),
    ),
    yourMatchingWishlist: group.theirItemsForYourWishlist.map((match) =>
      wishlistSummary(match, group.currentUser.displayName),
    ),
    theirMatchingWishlist: group.yourItemsForTheirWishlist.map((match) =>
      wishlistSummary(match, group.counterparty.displayName),
    ),
    sharedCategories,
    compatibleSizes,
    hasGrailMatch,
    hasExactMatch,
    isMutual,
    createdAt: new Date().toISOString(),
  };
}

function buildMatchTypes(input: {
  hasExactMatch: boolean;
  hasGrailMatch: boolean;
  hasSimilarMatch: boolean;
  isMutual: boolean;
}): RecommendationMatchType[] {
  const types: RecommendationMatchType[] = [input.isMutual ? "mutual" : "one_way"];

  if (input.hasGrailMatch) {
    types.push("grail");
  }
  if (input.hasExactMatch) {
    types.push("exact");
  }
  if (input.hasSimilarMatch) {
    types.push("similar");
  }

  return types;
}

function confidenceFromScore(score: number): RecommendationConfidence {
  if (score >= 75) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

function itemSummary(match: ItemWishlistMatch, ownerDisplayName: string) {
  return {
    id: match.item.id,
    ownerId: match.item.ownerId,
    ownerDisplayName,
    title: match.item.title,
    category: match.item.category,
    size: match.item.size,
    status: match.item.status,
  };
}

function wishlistSummary(match: ItemWishlistMatch, ownerDisplayName: string) {
  return {
    id: match.wishlistItem.id,
    ownerId: match.wishlistItem.ownerId,
    ownerDisplayName,
    title: match.wishlistItem.title,
    category: match.wishlistItem.category,
    size: match.wishlistItem.size,
    isGrail: match.wishlistItem.isGrail,
    matchPreference: match.wishlistItem.matchPreference,
    priority: match.wishlistItem.priority,
  };
}

function buildRecommendationId(group: CandidateMatchGroup): string {
  return `rec_${group.currentUser.id}_${group.counterparty.id}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
