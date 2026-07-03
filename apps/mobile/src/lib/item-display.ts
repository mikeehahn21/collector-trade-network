import type {
  CommunicationPreference,
  ItemCondition,
  ItemStatus,
  ItemVisibility,
  ShirtSize,
  TradeOfferPreference,
  VintageCategory,
} from "@ctn/types";

export const categoryLabels: Record<VintageCategory, string> = {
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

export const sizeLabels: Record<ShirtSize, string> = {
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

export const statusLabels: Record<ItemStatus, string> = {
  archived: "Archived",
  draft: "Draft",
  pending_trade: "Pending trade",
  reserved: "Reserved",
  tradeable: "Tradeable",
  traded: "Traded",
};

export const conditionLabels: Record<ItemCondition, string> = {
  deadstock: "Deadstock",
  excellent: "Excellent",
  fair: "Fair",
  good: "Good",
  project: "Project",
  very_good: "Very good",
};

export const visibilityLabels: Record<ItemVisibility, string> = {
  approved_members: "Approved members",
  private: "Private",
  verified_members: "Verified members",
};

export const tradePreferenceLabels: Record<TradeOfferPreference, string> = {
  all_serious_offers: "All serious offers",
  restricted_categories: "Restricted categories",
  wishlist_only: "Wishlist-only",
};

export const communicationPreferenceLabels: Record<CommunicationPreference, string> = {
  approved_traders: "Approved traders",
  completed_trade_users: "Completed traders",
  matching_signal_users: "Strong matches only",
  verified_only: "Verified only",
};
