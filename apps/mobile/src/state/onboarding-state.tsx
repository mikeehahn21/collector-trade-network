import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import type {
  CollectorType,
  CommunicationPreference,
  OnboardingProfile,
  OnboardingState,
  ShirtSize,
  TradeOfferPreference,
  UserAccessStatus,
  VintageCategory,
} from "@ctn/types";

import { secureStorage } from "@/storage/secure-storage";

const STORAGE_KEY = "collector_trade_onboarding_state";

type State = OnboardingState & {
  isHydrated: boolean;
};

type Action =
  | { type: "hydrate"; payload?: OnboardingState }
  | { type: "setAccess"; status: UserAccessStatus; email?: string; inviteCode?: string }
  | { type: "setProfile"; profile: OnboardingProfile }
  | { type: "setCollectorType"; collectorType: CollectorType }
  | { type: "setSizes"; wornSizes: ShirtSize[]; collectedSizes: ShirtSize[] }
  | { type: "setCategories"; categories: VintageCategory[] }
  | {
      type: "setTradePreferences";
      tradePreference: TradeOfferPreference;
      acceptsCashAdjustments: boolean;
    }
  | {
      type: "setCommunicationPreferences";
      communicationPreference: CommunicationPreference;
      allowsPhotoRequests: boolean;
      allowsMeasurementRequests: boolean;
    }
  | { type: "setNotifications"; notificationsEnabled: boolean }
  | { type: "complete" }
  | { type: "reset" };

type OnboardingContextValue = {
  state: State;
  isOnboardingComplete: boolean;
  setAccess: (status: UserAccessStatus, options?: { email?: string; inviteCode?: string }) => void;
  setProfile: (profile: OnboardingProfile) => void;
  setCollectorType: (collectorType: CollectorType) => void;
  setSizes: (wornSizes: ShirtSize[], collectedSizes: ShirtSize[]) => void;
  setCategories: (categories: VintageCategory[]) => void;
  setTradePreferences: (
    tradePreference: TradeOfferPreference,
    acceptsCashAdjustments: boolean,
  ) => void;
  setCommunicationPreferences: (
    communicationPreference: CommunicationPreference,
    allowsPhotoRequests: boolean,
    allowsMeasurementRequests: boolean,
  ) => void;
  setNotifications: (notificationsEnabled: boolean) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

const initialState: State = {
  accessStatus: "waitlisted",
  wornSizes: [],
  collectedSizes: [],
  categories: [],
  acceptsCashAdjustments: true,
  allowsPhotoRequests: true,
  allowsMeasurementRequests: true,
  notificationsEnabled: false,
  isHydrated: false,
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...initialState, ...action.payload, isHydrated: true };
    case "setAccess":
      return {
        ...state,
        accessStatus: action.status,
        email: action.email ?? state.email,
        inviteCode: action.inviteCode ?? state.inviteCode,
      };
    case "setProfile":
      return { ...state, profile: action.profile };
    case "setCollectorType":
      return { ...state, collectorType: action.collectorType };
    case "setSizes":
      return { ...state, wornSizes: action.wornSizes, collectedSizes: action.collectedSizes };
    case "setCategories":
      return { ...state, categories: action.categories };
    case "setTradePreferences":
      return {
        ...state,
        tradePreference: action.tradePreference,
        acceptsCashAdjustments: action.acceptsCashAdjustments,
      };
    case "setCommunicationPreferences":
      return {
        ...state,
        communicationPreference: action.communicationPreference,
        allowsPhotoRequests: action.allowsPhotoRequests,
        allowsMeasurementRequests: action.allowsMeasurementRequests,
      };
    case "setNotifications":
      return { ...state, notificationsEnabled: action.notificationsEnabled };
    case "complete":
      return {
        ...state,
        accessStatus: "active",
        completedAt: new Date().toISOString(),
      };
    case "reset":
      return { ...initialState, isHydrated: true };
  }
}

export function OnboardingStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isMounted = true;

    secureStorage
      .getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted) {
          return;
        }

        if (stored) {
          dispatch({ type: "hydrate", payload: JSON.parse(stored) as OnboardingState });
          return;
        }

        dispatch({ type: "hydrate" });
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

    const { isHydrated: _isHydrated, ...persisted } = state;
    void secureStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [state]);

  const setAccess = useCallback(
    (status: UserAccessStatus, options?: { email?: string; inviteCode?: string }) =>
      dispatch({ type: "setAccess", status, ...options }),
    [],
  );
  const setProfile = useCallback((profile: OnboardingProfile) => dispatch({ type: "setProfile", profile }), []);
  const setCollectorType = useCallback(
    (collectorType: CollectorType) => dispatch({ type: "setCollectorType", collectorType }),
    [],
  );
  const setSizes = useCallback(
    (wornSizes: ShirtSize[], collectedSizes: ShirtSize[]) =>
      dispatch({ type: "setSizes", wornSizes, collectedSizes }),
    [],
  );
  const setCategories = useCallback(
    (categories: VintageCategory[]) => dispatch({ type: "setCategories", categories }),
    [],
  );
  const setTradePreferences = useCallback(
    (tradePreference: TradeOfferPreference, acceptsCashAdjustments: boolean) =>
      dispatch({ type: "setTradePreferences", tradePreference, acceptsCashAdjustments }),
    [],
  );
  const setCommunicationPreferences = useCallback(
    (
      communicationPreference: CommunicationPreference,
      allowsPhotoRequests: boolean,
      allowsMeasurementRequests: boolean,
    ) =>
      dispatch({
        type: "setCommunicationPreferences",
        communicationPreference,
        allowsPhotoRequests,
        allowsMeasurementRequests,
      }),
    [],
  );
  const setNotifications = useCallback(
    (notificationsEnabled: boolean) => dispatch({ type: "setNotifications", notificationsEnabled }),
    [],
  );
  const completeOnboarding = useCallback(() => dispatch({ type: "complete" }), []);
  const reset = useCallback(() => {
    void secureStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      isOnboardingComplete: state.accessStatus === "active" && Boolean(state.completedAt),
      setAccess,
      setProfile,
      setCollectorType,
      setSizes,
      setCategories,
      setTradePreferences,
      setCommunicationPreferences,
      setNotifications,
      completeOnboarding,
      reset,
    }),
    [
      completeOnboarding,
      reset,
      setAccess,
      setCategories,
      setCollectorType,
      setCommunicationPreferences,
      setNotifications,
      setProfile,
      setSizes,
      setTradePreferences,
      state,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingState(): OnboardingContextValue {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboardingState must be used within OnboardingStateProvider");
  }

  return context;
}
