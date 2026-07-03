import type { RecommendationSummary, TradeRecommendation } from "@ctn/types";

import type { TradeGraphDataset } from "../../db/repositories/trade-graph.repository";
import { generateCandidateMatches } from "./match-generation";
import { scoreCandidateGroup } from "./scoring";

export function generateTradeRecommendations(dataset: TradeGraphDataset): {
  recommendations: TradeRecommendation[];
  summary: RecommendationSummary;
} {
  const candidates = generateCandidateMatches(dataset);
  const recommendations = candidates
    .map(scoreCandidateGroup)
    .sort((a, b) => b.score - a.score || Number(b.hasGrailMatch) - Number(a.hasGrailMatch))
    .slice(0, 25);

  return {
    recommendations,
    summary: {
      total: recommendations.length,
      grailMatches: recommendations.filter((recommendation) => recommendation.hasGrailMatch).length,
      mutualMatches: recommendations.filter((recommendation) => recommendation.isMutual).length,
      newMatches: recommendations.length,
    },
  };
}
