import { useEffect, useRef } from "react";

import { getMobileEnv } from "@/config/env";
import type { AuthSession } from "@/auth/clerk-provider";

export function useKonnesorPushNotifications({
  auth,
  onOpenMessage,
  onOpenTrade,
}: {
  auth: AuthSession;
  onOpenMessage: (conversationId: string) => void;
  onOpenTrade: (tradeId: string) => void;
}) {
  const initializedRef = useRef(false);
  const { oneSignalAppId } = getMobileEnv();

  useEffect(() => {
    if (!oneSignalAppId || initializedRef.current || !auth.isLoaded) {
      return;
    }

    initializedRef.current = true;
    console.log("[Konnesor Push] OneSignal runtime initialization disabled for crash isolation");
  }, [auth.isLoaded, oneSignalAppId, onOpenMessage, onOpenTrade]);
}
