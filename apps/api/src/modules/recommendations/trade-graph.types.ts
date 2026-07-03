import type { TradeableItem, UserProfile, WishlistItem } from "@ctn/types";

export type CandidateUser = Pick<UserProfile, "displayName" | "id">;

export type ItemWishlistMatch = {
  item: TradeableItem;
  wishlistItem: WishlistItem;
  owner: CandidateUser;
  requester: CandidateUser;
  isExact: boolean;
  isSimilar: boolean;
  isGrail: boolean;
  categoryMatches: boolean;
  sizeMatches: boolean;
};

export type CandidateMatchGroup = {
  currentUser: CandidateUser;
  counterparty: CandidateUser;
  theirItemsForYourWishlist: ItemWishlistMatch[];
  yourItemsForTheirWishlist: ItemWishlistMatch[];
};
