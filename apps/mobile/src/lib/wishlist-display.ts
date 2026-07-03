import type {
  WishlistMatchPreference,
  WishlistPriority,
  WishlistVisibility,
} from "@ctn/types";

export const wishlistPriorityLabels: Record<WishlistPriority, string> = {
  high: "High",
  low: "Low",
  medium: "Medium",
};

export const wishlistMatchPreferenceLabels: Record<WishlistMatchPreference, string> = {
  exact: "Exact match",
  similar: "Similar accepted",
};

export const wishlistVisibilityLabels: Record<WishlistVisibility, string> = {
  approved_members: "Approved members",
  private: "Private",
  verified_members: "Verified members",
};
