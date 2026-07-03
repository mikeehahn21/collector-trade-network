import type { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/clerk-expo";

import { getMobileEnv } from "@/config/env";
import { secureStorage } from "@/storage/secure-storage";

const tokenCache = {
  getToken: (key: string) => secureStorage.getItem(key),
  saveToken: (key: string, token: string) => secureStorage.setItem(key, token),
};

export function MobileAuthProvider({ children }: PropsWithChildren) {
  const { clerkPublishableKey } = getMobileEnv();

  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
