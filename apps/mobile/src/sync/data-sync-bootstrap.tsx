import { useEffect, useState } from "react";

import { useApiClient } from "@/api/use-api-client";
import { useAuthSession } from "@/auth/use-auth-session";
import { useCollectionState } from "@/state/collection-state";
import { useOnboardingState } from "@/state/onboarding-state";
import { useWishlistState } from "@/state/wishlist-state";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export function DataSyncBootstrap() {
  const api = useApiClient();
  const auth = useAuthSession();
  const { replaceItemsFromServer } = useCollectionState();
  const { state: onboardingState } = useOnboardingState();
  const { replaceWishlistFromServer } = useWishlistState();
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    let isMounted = true;

    async function sync() {
      if (!auth.isLoaded || !auth.isSignedIn) {
        return;
      }

      setStatus("syncing");

      try {
        if (onboardingState.profile && onboardingState.email) {
          await api.upsertMe({
            bio: onboardingState.profile.bio,
            displayName: onboardingState.profile.displayName,
            email: onboardingState.email,
            locationRegion: onboardingState.profile.locationRegion,
            socialHandle: onboardingState.profile.socialHandle,
          });
        }

        const [itemsResponse, wishlistResponse] = await Promise.all([
          api.listItems(),
          api.listWishlistItems(),
        ]);

        if (!isMounted) {
          return;
        }

        replaceItemsFromServer(itemsResponse.items);
        replaceWishlistFromServer(wishlistResponse.wishlistItems);
        setStatus("synced");
      } catch {
        if (!isMounted) {
          return;
        }
        setStatus("offline");
      }
    }

    void sync();

    return () => {
      isMounted = false;
    };
  }, [
    api,
    auth.isLoaded,
    auth.isSignedIn,
    onboardingState.email,
    onboardingState.profile,
    replaceItemsFromServer,
    replaceWishlistFromServer,
  ]);

  void status;
  return null;
}
