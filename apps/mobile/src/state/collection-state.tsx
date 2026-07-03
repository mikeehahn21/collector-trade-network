import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import type {
  AiListingSuggestions,
  CollectionSummary,
  CommunicationPreference,
  EstimatedValueRange,
  ItemCondition,
  ItemMeasurements,
  ItemPhoto,
  ItemStatus,
  ItemVisibility,
  ShirtSize,
  TradeOfferPreference,
  TradeableItem,
  VintageCategory,
} from "@ctn/types";

import { secureStorage } from "@/storage/secure-storage";

const STORAGE_KEY = "collector_trade_collection_state";
const OWNER_ID = "local-user";

export type ItemInput = {
  photos?: ItemPhoto[];
  title?: string;
  category?: VintageCategory;
  size?: ShirtSize;
  measurements?: ItemMeasurements;
  era?: string;
  tag?: string;
  condition?: ItemCondition;
  flaws?: string[];
  estimatedValue?: EstimatedValueRange;
  status?: ItemStatus;
  tradePreference?: TradeOfferPreference;
  tradeNotes?: string;
  visibility?: ItemVisibility;
  communicationPreference?: CommunicationPreference;
  allowsPhotoRequests?: boolean;
  allowsMeasurementRequests?: boolean;
  aiSuggestions?: AiListingSuggestions;
};

type State = {
  items: TradeableItem[];
  isHydrated: boolean;
  lastPublishedItemId?: string | undefined;
};

type Action =
  | { type: "hydrate"; items?: TradeableItem[] | undefined }
  | { type: "replace"; items: TradeableItem[] }
  | { type: "upsertFromServer"; localItemId?: string | undefined; item: TradeableItem }
  | { type: "create"; item: TradeableItem }
  | { type: "update"; itemId: string; patch: ItemInput }
  | { type: "archive"; itemId: string }
  | { type: "delete"; itemId: string }
  | { type: "publish"; itemId: string }
  | { type: "clearPublished" };

type CollectionContextValue = {
  items: TradeableItem[];
  summary: CollectionSummary;
  lastPublishedItem?: TradeableItem | undefined;
  createItem: (input?: ItemInput) => TradeableItem;
  updateItem: (itemId: string, patch: ItemInput) => void;
  archiveItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  publishItem: (itemId: string) => void;
  clearPublishedCelebration: () => void;
  getItem: (itemId: string) => TradeableItem | undefined;
  replaceItemsFromServer: (items: TradeableItem[]) => void;
  upsertItemFromServer: (item: TradeableItem, localItemId?: string) => void;
};

const initialState: State = {
  items: [],
  isHydrated: false,
};

const CollectionContext = createContext<CollectionContextValue | undefined>(undefined);

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
      return { ...state, items: [action.item, ...withoutLocal] };
    }
    case "create":
      return { ...state, items: [action.item, ...state.items] };
    case "update":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? { ...item, ...action.patch, updatedAt: new Date().toISOString() }
            : item,
        ),
      };
    case "archive":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? {
                ...item,
                status: "archived",
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      };
    case "delete":
      return { ...state, items: state.items.filter((item) => item.id !== action.itemId) };
    case "publish":
      return {
        ...state,
        lastPublishedItemId: action.itemId,
        items: state.items.map((item) =>
          item.id === action.itemId
            ? {
                ...item,
                status: "tradeable",
                visibility: item.visibility === "private" ? "approved_members" : item.visibility,
                publishedAt: item.publishedAt ?? new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      };
    case "clearPublished":
      return { ...state, lastPublishedItemId: undefined };
  }
}

export function CollectionStateProvider({ children }: PropsWithChildren) {
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
          items: stored ? (JSON.parse(stored) as TradeableItem[]) : undefined,
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

  const createItem = useCallback((input: ItemInput = {}) => {
    const now = new Date().toISOString();
    const item: TradeableItem = {
      id: createId(),
      ownerId: OWNER_ID,
      photos: input.photos ?? [],
      title: input.title ?? "",
      category: input.category,
      size: input.size,
      measurements: input.measurements ?? { unit: "in" },
      era: input.era,
      tag: input.tag,
      condition: input.condition,
      flaws: input.flaws ?? [],
      estimatedValue: input.estimatedValue ?? { currency: "USD" },
      status: input.status ?? "draft",
      tradePreference: input.tradePreference,
      tradeNotes: input.tradeNotes,
      visibility: input.visibility ?? "private",
      communicationPreference: input.communicationPreference ?? "approved_traders",
      allowsPhotoRequests: input.allowsPhotoRequests ?? true,
      allowsMeasurementRequests: input.allowsMeasurementRequests ?? true,
      aiSuggestions: input.aiSuggestions,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "create", item });
    return item;
  }, []);

  const updateItem = useCallback((itemId: string, patch: ItemInput) => {
    dispatch({ type: "update", itemId, patch });
  }, []);

  const archiveItem = useCallback((itemId: string) => {
    dispatch({ type: "archive", itemId });
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    dispatch({ type: "delete", itemId });
  }, []);

  const publishItem = useCallback((itemId: string) => {
    dispatch({ type: "publish", itemId });
  }, []);

  const clearPublishedCelebration = useCallback(() => {
    dispatch({ type: "clearPublished" });
  }, []);

  const replaceItemsFromServer = useCallback((items: TradeableItem[]) => {
    dispatch({ type: "replace", items });
  }, []);

  const upsertItemFromServer = useCallback((item: TradeableItem, localItemId?: string) => {
    dispatch({ type: "upsertFromServer", item, localItemId });
  }, []);

  const getItem = useCallback(
    (itemId: string) => state.items.find((item) => item.id === itemId),
    [state.items],
  );

  const summary = useMemo<CollectionSummary>(
    () => ({
      totalItems: state.items.filter((item) => item.status !== "archived").length,
      tradeableItems: state.items.filter((item) => item.status === "tradeable").length,
      draftItems: state.items.filter((item) => item.status === "draft").length,
      archivedItems: state.items.filter((item) => item.status === "archived").length,
    }),
    [state.items],
  );

  const value = useMemo<CollectionContextValue>(
    () => ({
      items: state.items,
      summary,
      lastPublishedItem: state.items.find((item) => item.id === state.lastPublishedItemId),
      createItem,
      updateItem,
      archiveItem,
      deleteItem,
      publishItem,
      clearPublishedCelebration,
      getItem,
      replaceItemsFromServer,
      upsertItemFromServer,
    }),
    [
      archiveItem,
      clearPublishedCelebration,
      createItem,
      deleteItem,
      getItem,
      publishItem,
      replaceItemsFromServer,
      upsertItemFromServer,
      state.items,
      state.lastPublishedItemId,
      summary,
      updateItem,
    ],
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollectionState(): CollectionContextValue {
  const context = useContext(CollectionContext);

  if (!context) {
    throw new Error("useCollectionState must be used within CollectionStateProvider");
  }

  return context;
}

function createId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
