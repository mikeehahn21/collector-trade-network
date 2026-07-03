import type { TradeableItem, UserProfile, WishlistItem } from "@ctn/types";

import type { CandidateMatchGroup, CandidateUser, ItemWishlistMatch } from "./trade-graph.types";

export function generateCandidateMatches(params: {
  currentUser: UserProfile;
  inventory: TradeableItem[];
  wishlist: WishlistItem[];
}): CandidateMatchGroup[] {
  const currentUser: CandidateUser = {
    id: params.currentUser.id,
    displayName: params.currentUser.displayName,
  };
  const usersById = buildUsers(params.inventory, params.wishlist, currentUser);
  const myWishlist = params.wishlist.filter((wish) => wish.ownerId === currentUser.id);
  const myInventory = params.inventory.filter((item) => item.ownerId === currentUser.id);
  const otherInventory = params.inventory.filter((item) => item.ownerId !== currentUser.id);
  const otherWishlist = params.wishlist.filter((wish) => wish.ownerId !== currentUser.id);
  const groups = new Map<string, CandidateMatchGroup>();

  for (const item of otherInventory) {
    for (const wish of myWishlist) {
      const match = matchItemToWishlist(item, wish, usersById);
      if (!match) {
        continue;
      }

      const group = getOrCreateGroup(groups, currentUser, usersById.get(item.ownerId));
      group.theirItemsForYourWishlist.push(match);
    }
  }

  for (const item of myInventory) {
    for (const wish of otherWishlist) {
      const match = matchItemToWishlist(item, wish, usersById);
      if (!match) {
        continue;
      }

      const group = getOrCreateGroup(groups, currentUser, usersById.get(wish.ownerId));
      group.yourItemsForTheirWishlist.push(match);
    }
  }

  return [...groups.values()].filter(
    (group) =>
      group.theirItemsForYourWishlist.length > 0 || group.yourItemsForTheirWishlist.length > 0,
  );
}

function matchItemToWishlist(
  item: TradeableItem,
  wish: WishlistItem,
  usersById: Map<string, CandidateUser>,
): ItemWishlistMatch | undefined {
  if (!item.category || !wish.category || item.category !== wish.category) {
    return undefined;
  }

  const sizeMatches = Boolean(item.size && wish.size && item.size === wish.size);
  const titleMatches = normalize(item.title).includes(normalize(wish.title)) ||
    normalize(wish.title).includes(normalize(item.title));
  const isExact = wish.matchPreference === "exact" && titleMatches && (!wish.size || sizeMatches);
  const isSimilar = wish.matchPreference === "similar";

  if (wish.matchPreference === "exact" && !isExact) {
    return undefined;
  }

  return {
    item,
    wishlistItem: wish,
    owner: usersById.get(item.ownerId) ?? { id: item.ownerId, displayName: "Collector" },
    requester: usersById.get(wish.ownerId) ?? { id: wish.ownerId, displayName: "Collector" },
    isExact,
    isSimilar,
    isGrail: wish.isGrail,
    categoryMatches: true,
    sizeMatches,
  };
}

function buildUsers(
  inventory: TradeableItem[],
  wishlist: WishlistItem[],
  currentUser: CandidateUser,
): Map<string, CandidateUser> {
  const users = new Map<string, CandidateUser>([[currentUser.id, currentUser]]);

  for (const item of inventory) {
    if (!users.has(item.ownerId)) {
      users.set(item.ownerId, {
        id: item.ownerId,
        displayName: getOwnerDisplayName(item),
      });
    }
  }

  for (const wish of wishlist) {
    if (!users.has(wish.ownerId)) {
      users.set(wish.ownerId, {
        id: wish.ownerId,
        displayName: getOwnerDisplayName(wish),
      });
    }
  }

  return users;
}

function getOrCreateGroup(
  groups: Map<string, CandidateMatchGroup>,
  currentUser: CandidateUser,
  counterparty?: CandidateUser,
): CandidateMatchGroup {
  const fallback = counterparty ?? { id: "unknown", displayName: "Collector" };
  const existing = groups.get(fallback.id);

  if (existing) {
    return existing;
  }

  const group: CandidateMatchGroup = {
    currentUser,
    counterparty: fallback,
    theirItemsForYourWishlist: [],
    yourItemsForTheirWishlist: [],
  };
  groups.set(fallback.id, group);
  return group;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getOwnerDisplayName(value: TradeableItem | WishlistItem): string {
  return "ownerDisplayName" in value && typeof value.ownerDisplayName === "string"
    ? value.ownerDisplayName
    : "Collector";
}
