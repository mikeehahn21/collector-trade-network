import { useEffect, useRef } from "react";
import type { NotificationClickEvent } from "react-native-onesignal";
import { OneSignal } from "react-native-onesignal";

import { getMobileEnv } from "@/config/env";
import type { AuthSession } from "@/auth/clerk-provider";

import { parseKonnesorPushData, routeForPushData } from "./notification-routing";

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
    if (!oneSignalAppId || initializedRef.current) {
      return;
    }

    OneSignal.initialize(oneSignalAppId);
    initializedRef.current = true;

    void OneSignal.Notifications.requestPermission(false);
  }, [oneSignalAppId]);

  useEffect(() => {
    if (!oneSignalAppId || !auth.isLoaded || !auth.isSignedIn) {
      return;
    }

    let cancelled = false;

    void auth.getApiAuth().then((apiAuth) => {
      if (!cancelled && apiAuth.clerkUserId) {
        OneSignal.login(apiAuth.clerkUserId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auth, oneSignalAppId]);

  useEffect(() => {
    if (!oneSignalAppId) {
      return;
    }

    const onClick = (event: NotificationClickEvent) => {
      const data = parseKonnesorPushData(event.notification.additionalData);
      if (!data) {
        return;
      }

      const route = routeForPushData(data);
      if (route.tab === "messages") {
        onOpenMessage(route.messageRoute.conversationId ?? "");
      } else {
        onOpenTrade(route.tradeRoute.tradeId ?? "");
      }
    };

    OneSignal.Notifications.addEventListener("click", onClick);
    return () => OneSignal.Notifications.removeEventListener("click", onClick);
  }, [onOpenMessage, onOpenTrade, oneSignalAppId]);
}
