import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { MAX_GRAILS } from "@ctn/constants";
import type {
  ItemCondition,
  ShirtSize,
  VintageCategory,
  WishlistItem,
  WishlistMatchPreference,
  WishlistPriority,
  WishlistSummary,
  WishlistVisibility,
} from "@ctn/types";

import { secureStorage } from "@/storage/secure-storage";

const STORAGE_KEY = "collector_trade_wishlist_state";
const OWNER_ID = "local-user";

export type WishlistInput = {
  title?: string;
  category?: VintageCategory;
  size?: ShirtSize;
  preferredEra?: string;
  preferredTag?: string;
  preferredCondition?: ItemCondition;
  notes?: string;
  priority?: WishlistPriority;
  isGrail?: boolean;
  matchPreference?: WishlistMatchPreference;
  visibility?: WishlistVisibility;
  isArchived?: boolean;
  sortOrder?: number;
};

type State = {
  items: WishlistItem[];
  isHydrated: boolean;
  lastGrailItemId?: string | undefined;
};

type Action =
  | { type: "hydrate"; items?: WishlistItem[] | undefined }
  | { type: "replace"; items: WishlistItem[] }
  | { type: "upsertFromServer"; localItemId?: string | undefined; item: WishlistItem }
  | { type: "create"; item: WishlistItem }
  | { type: "update"; itemId: string; patch: WishlistInput }
  | { type: "archive"; itemId: string }
  | { type: "delete"; itemId: string }
  | { type: "move"; itemId: string; direction: "up" | "down" }
  | { type: "clearGrail" };

type WishlistContextValue = {
  items: WishlistItem[];
  activeItems: WishlistItem[];
  archivedItems: WishlistItem[];
  summary: WishlistSummary;
  lastGrailItem?: WishlistItem | undefined;
  canMarkMoreGrails: boolean;
  createWishlistItem: (input?: WishlistInput) => WishlistItem;
  updateWishlistItem: (itemId: string, patch: WishlistInput) => { ok: boolean; message?: string | undefined };
  archiveWishlistItem: (itemId: string) => void;
  deleteWishlistItem: (itemId: string) => void;
  moveWishlistItem: (itemId: string, direction: "up" | "down") => void;
  clearGrailCelebration: () => void;
  getWishlistItem: (itemId: string) => WishlistItem | undefined;
  replaceWishlistFromServer: (items: WishlistItem[]) => void;
  upsertWishlistItemFromServer: (item: WishlistItem, localItemId?: string | undefined) => void;
};

const initialState: State = {
  items: [],
  isHydrated: false,
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...initialState, items: action.items ?? [], isHydrated: true };
    case "replace":
      return { ...state, items: action.items };
    case "upsertFromServer": {
      const withoutLocal = state.items.filter(
        (item) => item.id !== action.item.id && item.id !== action.localItemId,
      );
      return { ...state, items: [...withoutLocal, action.item] };
    }
    case "create":
      return { ...state, items: [...state.items, action.item] };
    case "update":
      return {
        ...state,
        lastGrailItemId: action.patch.isGrail ? action.itemId : state.lastGrailItemId,
        items: state.items.map((item) =>
          item.id === action.itemId ? { ...item, ...action.patch, updatedAt: new Date().toISOString() } : item,
        ),
      };
    case "archive":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? {
                ...item,
                isArchived: true,
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      };
    case "delete":
      return { ...state, items: state.items.filter((item) => item.id !== action.itemId) };
    case "move":
      return { ...state, items: moveItem(state.items, action.itemId, action.direction) };
    case "clearGrail":
      return { ...state, lastGrailItemId: undefined };
  }
}

export function WishlistStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isMounted = true;

    secureStorage
      .getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted) {
          return;
        }

        dispatch({
          type: "hydrate",
          items: stored ? (JSON.parse(stored) as WishlistItem[]) : undefined,
        });
      })
      .catch(() => dispatch({ type: "hydrate" }));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }

    void secureStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.isHydrated, state.items]);

  const activeItems = useMemo(
    () => state.items.filter((item) => !item.isArchived).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.items],
  );
  const archivedItems = useMemo(() => state.items.filter((item) => item.isArchived), [state.items]);
  const grailCount = activeItems.filter((item) => item.isGrail).length;

  const createWishlistItem = useCallback((input: WishlistInput = {}) => {
    const now = new Date().toISOString();
    const item: WishlistItem = {
      id: createId(),
      ownerId: OWNER_ID,
      title: input.title ?? "",
      category: input.category,
      size: input.size,
      preferredEra: input.preferredEra,
      preferredTag: input.preferredTag,
      preferredCondition: input.preferredCondition,
      notes: input.notes,
      priority: input.priority ?? "medium",
      isGrail: input.isGrail ?? false,
      matchPreference: input.matchPreference ?? "similar",
      visibility: input.visibility ?? "approved_members",
      isArchived: input.isArchived ?? false,
      sortOrder: input.sortOrder ?? Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "create", item });
    return item;
  }, []);

  const updateWishlistItem = useCallback(
    (itemId: string, patch: WishlistInput) => {
      const existing = state.items.find((item) => item.id === itemId);
      const isBecomingGrail = patch.isGrail === true && existing?.isGrail !== true;

      if (isBecomingGrail && grailCount >= MAX_GRAILS) {
        return {
          ok: false,
          message: `You can mark up to ${MAX_GRAILS} grails for now. Remove a grail before adding another.`,
        };
      }

      dispatch({ type: "update", itemId, patch });
      return { ok: true };
    },
    [grailCount, state.items],
  );

  const archiveWishlistItem = useCallback((itemId: string) => {
    dispatch({ type: "archive", itemId });
  }, []);

  const deleteWishlistItem = useCallback((itemId: string) => {
    dispatch({ type: "delete", itemId });
  }, []);

  const moveWishlistItem = useCallback((itemId: string, direction: "up" | "down") => {
    dispatch({ type: "move", itemId, direction });
  }, []);

  const clearGrailCelebration = useCallback(() => {
    dispatch({ type: "clearGrail" });
  }, []);

  const replaceWishlistFromServer = useCallback((items: WishlistItem[]) => {
    dispatch({ type: "replace", items });
  }, []);

  const upsertWishlistItemFromServer = useCallback(
    (item: WishlistItem, localItemId?: string) => {
      dispatch({ type: "upsertFromServer", item, localItemId });
    },
    [],
  );

  const getWishlistItem = useCallback(
    (itemId: string) => state.items.find((item) => item.id === itemId),
    [state.items],
  );

  const summary = useMemo<WishlistSummary>(
    () => ({
      activeItems: activeItems.length,
      archivedItems: archivedItems.length,
      grailItems: grailCount,
      highPriorityItems: activeItems.filter((item) => item.priority === "high").length,
    }),
    [activeItems, archivedItems.length, grailCount],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items: state.items,
      activeItems,
      archivedItems,
      summary,
      lastGrailItem: state.items.find((item) => item.id === state.lastGrailItemId),
      canMarkMoreGrails: grailCount < MAX_GRAILS,
      createWishlistItem,
      updateWishlistItem,
      archiveWishlistItem,
      deleteWishlistItem,
      moveWishlistItem,
      clearGrailCelebration,
      getWishlistItem,
      replaceWishlistFromServer,
      upsertWishlistItemFromServer,
    }),
    [
      activeItems,
      archiveWishlistItem,
      archivedItems,
      clearGrailCelebration,
      createWishlistItem,
      deleteWishlistItem,
      getWishlistItem,
      grailCount,
      moveWishlistItem,
      replaceWishlistFromServer,
      upsertWishlistItemFromServer,
      state.items,
      state.lastGrailItemId,
      summary,
      updateWishlistItem,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlistState(): WishlistContextValue {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlistState must be used within WishlistStateProvider");
  }

  return context;
}

function createId(): string {
  return `wish_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function moveItem(items: WishlistItem[], itemId: string, direction: "up" | "down"): WishlistItem[] {
  const active = items.filter((item) => !item.isArchived).sort((a, b) => a.sortOrder - b.sortOrder);
  const archived = items.filter((item) => item.isArchived);
  const index = active.findIndex((item) => item.id === itemId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= active.length) {
    return items;
  }

  const reordered = [...active];
  const [removed] = reordered.splice(index, 1);
  if (!removed) {
    return items;
  }
  reordered.splice(targetIndex, 0, removed);

  const now = new Date().toISOString();
  return [
    ...reordered.map((item, sortOrder) => ({ ...item, sortOrder, updatedAt: now })),
    ...archived,
  ];
}
