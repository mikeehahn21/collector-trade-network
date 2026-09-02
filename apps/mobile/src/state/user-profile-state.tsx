import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { UserProfile } from "@ctn/types";
import { useApiClient } from "@/api/use-api-client";
import { useAuthSession } from "@/auth/use-auth-session";
import { secureStorage } from "@/storage/secure-storage";

const COLLECTOR_CARD_STORAGE_KEY = "konnesor_collector_card_customization";

export type CollectorCardCustomization = {
  avatarUri?: string | undefined;
  displayName?: string | undefined;
  tagline?: string | undefined;
};

type UserProfileState = {
  card: CollectorCardCustomization;
  profile: UserProfile | undefined;
  isLoading: boolean;
  refresh: () => Promise<void>;
  saveCollectorCard: (card: CollectorCardCustomization) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileState>({
  card: {},
  profile: undefined,
  isLoading: false,
  refresh: async () => {},
  saveCollectorCard: async () => {},
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const api = useApiClient();
  const auth = useAuthSession();
  const apiRef = useRef(api);
  const authRef = useRef(auth);
  const profileRef = useRef<UserProfile | undefined>();
  const [card, setCard] = useState<CollectorCardCustomization>({});
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    let isMounted = true;

    secureStorage
      .getItem(COLLECTOR_CARD_STORAGE_KEY)
      .then((stored) => {
        if (!isMounted || !stored) {
          return;
        }

        setCard(JSON.parse(stored) as CollectorCardCustomization);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRef.current.getMe();
      setProfile(response.user);
    } catch {
      // Silently fail — profile is optional enhancement
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCollectorCard = useCallback(async (nextCard: CollectorCardCustomization) => {
    const trimmedCard: CollectorCardCustomization = {
      avatarUri: nextCard.avatarUri?.trim() || undefined,
      displayName: nextCard.displayName?.trim() || undefined,
      tagline: nextCard.tagline?.trim() || undefined,
    };

    setCard(trimmedCard);
    await secureStorage.setItem(COLLECTOR_CARD_STORAGE_KEY, JSON.stringify(trimmedCard));

    const currentAuth = authRef.current;
    const currentProfile = profileRef.current;
    const apiAuth = await currentAuth.getApiAuth();
    const email = currentProfile?.email ?? apiAuth.email ?? currentAuth.userEmail;

    if (
      !currentAuth.clerkEnabled ||
      !currentAuth.isSignedIn ||
      !email ||
      !trimmedCard.displayName
    ) {
      return;
    }

    try {
      const response = await apiRef.current.upsertMe({
        bio: trimmedCard.tagline,
        displayName: trimmedCard.displayName,
        email,
        locationRegion: currentProfile?.locationRegion,
        socialHandle: currentProfile?.socialHandle,
      });
      setProfile(response.user);
    } catch (error) {
      console.log("[Konnesor Profile] Collector card saved locally; live sync failed", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <UserProfileContext.Provider value={{ card, profile, isLoading, refresh, saveCollectorCard }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileState {
  return useContext(UserProfileContext);
}
