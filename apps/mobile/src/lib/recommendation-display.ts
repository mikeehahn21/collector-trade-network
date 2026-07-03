import type {
  RecommendationConfidence,
  RecommendationMatchType,
  ShirtSize,
  VintageCategory,
} from "@ctn/types";

const categoryLabels: Record<VintageCategory, string> = {
  anime: "Anime",
  band: "Band",
  cartoon: "Cartoon",
  harley: "Harley",
  movie: "Movie",
  rap: "Rap",
  sports: "Sports",
  streetwear: "Streetwear",
  three_d_emblem: "3D Emblem",
  true_vintage_blanks: "True vintage blanks",
  wrestling: "Wrestling",
};

const sizeLabels: Record<ShirtSize, string> = {
  l: "L",
  m: "M",
  measurements_matter: "Measurements matter",
  one_size: "One size",
  s: "S",
  xl: "XL",
  xs: "XS",
  xxl: "XXL",
  xxxl: "XXXL",
};

const typeLabels: Record<RecommendationMatchType, string> = {
  exact: "Exact",
  grail: "Grail",
  mutual: "Mutual",
  one_way: "One-way",
  similar: "Similar",
};

export function formatRecommendationType(type: RecommendationMatchType): string {
  return typeLabels[type];
}

export function formatRecommendationConfidence(confidence: RecommendationConfidence): string {
  return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
}

export function formatRecommendationCategory(category: VintageCategory): string {
  return categoryLabels[category];
}

export function formatRecommendationSize(size: ShirtSize): string {
  return sizeLabels[size];
}
