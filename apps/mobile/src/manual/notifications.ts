import { useEffect, useMemo, useRef } from "react";

import { createApiClient } from "@/api/api-client";
import type { AuthSession } from "@/auth/clerk-provider";
import { getMobileEnv } from "@/config/env";
import { secureStorage } from "@/storage/secure-storage";

import {
  cleanupOneSignalClickListener,
  createNotificationClickHandler,
  getPushDiagnostics,
  loadOneSignalSdk,
  recordPushBreadcrumb,
  recordPushException,
  registerOneSignalClickListener,
  requestOneSignalPermissionOnce,
  safeInitializeOneSignal,
  safeLoginOneSignal,
  safeLogoutOneSignal,
} from "./notification-runtime";
import type { OneSignalClickEvent, OneSignalSdk, PushConfig } from "./notification-runtime";

const PUSH_PERMISSION_REQUESTED_KEY = "konnesor_push_permission_requested";

function getPushConfig(): PushConfig {
  const env = getMobileEnv();
  return {
    appId: env.oneSignalAppId,
    clickRoutingEnabled: env.pushClickRoutingEnabled,
    enabled: env.pushNotificationsEnabled,
    permissionRequestsEnabled: env.pushPermissionRequestsEnabled,
    userAssociationEnabled: env.pushUserAssociationEnabled,
  };
}

export function useKonnesorPushNotifications({
  auth,
  notificationsOptIn,
  onOpenMessage,
  onOpenTrade,
}: {
  auth: AuthSession;
  notificationsOptIn: boolean;
  onOpenMessage: (conversationId: string) => void;
  onOpenTrade: (tradeId: string) => void;
}) {
  const api = useMemo(() => createApiClient(auth.getApiAuth), [auth.getApiAuth]);
  const clickListenerRef = useRef<((event: OneSignalClickEvent) => void) | undefined>();
  const initializedRef = useRef(false);
  const loggedInExternalIdRef = useRef<string | undefined>();
  const oneSignalRef = useRef<OneSignalSdk | undefined>();
  const permissionRequestStartedRef = useRef(false);
  const config = getPushConfig();
  const diagnostics = getPushDiagnostics(config);

  useEffect(() => {
    recordPushBreadcrumb("hook mounted");
  }, []);

  useEffect(() => {
    recordPushBreadcrumb("configuration detected", {
      clickRoutingEnabled: config.clickRoutingEnabled,
      hasAppId: Boolean(config.appId),
      permissionRequestsEnabled: config.permissionRequestsEnabled,
      pushEnabled: config.enabled,
      userAssociationEnabled: config.userAssociationEnabled,
    });

    if (diagnostics.status === "disabled") {
      recordPushBreadcrumb("runtime disabled", { reason: diagnostics.reason });
      return;
    }

    if (initializedRef.current) {
      return;
    }

    const oneSignal = loadOneSignalSdk();
    if (!oneSignal) {
      recordPushBreadcrumb("native module unavailable");
      return;
    }

    if (safeInitializeOneSignal(oneSignal, config.appId, initializedRef)) {
      oneSignalRef.current = oneSignal;
    }
  }, [
    config.appId,
    config.clickRoutingEnabled,
    config.enabled,
    config.permissionRequestsEnabled,
    config.userAssociationEnabled,
    diagnostics.reason,
    diagnostics.status,
  ]);

  useEffect(() => {
    recordPushBreadcrumb("authentication loaded", {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn,
    });

    const oneSignal = oneSignalRef.current;
    if (!oneSignal || !initializedRef.current || !config.userAssociationEnabled || !auth.isLoaded) {
      return;
    }

    if (!auth.isSignedIn) {
      safeLogoutOneSignal(oneSignal, loggedInExternalIdRef);
      return;
    }

    let cancelled = false;

    void api
      .getMe()
      .then((response) => {
        const externalId = response.user.id;
        if (!cancelled) {
          safeLoginOneSignal(oneSignal, externalId, loggedInExternalIdRef);
        }
      })
      .catch((error) => {
        recordPushException("user association failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, [api, auth.isLoaded, auth.isSignedIn, config.userAssociationEnabled]);

  useEffect(() => {
    const oneSignal = oneSignalRef.current;
    if (!oneSignal || !initializedRef.current || !config.clickRoutingEnabled) {
      return;
    }

    const onClick = createNotificationClickHandler({ onOpenMessage, onOpenTrade });
    registerOneSignalClickListener(oneSignal, clickListenerRef, onClick);

    return () => {
      cleanupOneSignalClickListener(oneSignal, clickListenerRef);
    };
  }, [config.clickRoutingEnabled, onOpenMessage, onOpenTrade]);

  useEffect(() => {
    const oneSignal = oneSignalRef.current;
    if (
      !oneSignal ||
      !initializedRef.current ||
      !config.permissionRequestsEnabled ||
      !notificationsOptIn ||
      permissionRequestStartedRef.current
    ) {
      return;
    }

    permissionRequestStartedRef.current = true;

    void secureStorage
      .getItem(PUSH_PERMISSION_REQUESTED_KEY)
      .then(async (alreadyRequested) => {
        const result = await requestOneSignalPermissionOnce({
          oneSignal,
          wasRequested: Boolean(alreadyRequested),
        });

        if (result !== "already_requested") {
          await secureStorage.setItem(PUSH_PERMISSION_REQUESTED_KEY, "true");
        }
      })
      .catch((error) => {
        recordPushException("permission request failed", error);
      });
  }, [config.permissionRequestsEnabled, notificationsOptIn]);
}
