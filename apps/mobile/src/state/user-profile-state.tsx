import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { UserProfile } from "@ctn/types";
import { useApiClient } from "@/api/use-api-client";

type UserProfileState = {
  profile: UserProfile | undefined;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileState>({
  profile: undefined,
  isLoading: false,
  refresh: async () => {},
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const api = useApiClient();
  const apiRef = useRef(api);
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, refresh }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileState {
  return useContext(UserProfileContext);
}
