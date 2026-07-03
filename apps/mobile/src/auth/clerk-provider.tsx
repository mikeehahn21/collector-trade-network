import { createElement } from "react";
import type { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/clerk-expo";
import type { ClerkProviderProps } from "@clerk/clerk-expo";

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

  // Use createElement to avoid TS2322: @types/react 18.3 removed implicit children from FC props
  const props: ClerkProviderProps & { children: typeof children } = {
    publishableKey: clerkPublishableKey,
    tokenCache,
    children,
  };
  return createElement(ClerkProvider, props);
}
