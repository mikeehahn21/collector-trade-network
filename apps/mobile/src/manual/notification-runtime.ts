import { parseKonnesorPushData, routeForPushData } from "./notification-routing";

export type OneSignalClickEvent = {
  notification?: {
    additionalData?: unknown;
  };
};

export type OneSignalNotifications = {
  addEventListener: (event: "click", listener: (event: OneSignalClickEvent) => void) => void;
  canRequestPermission?: () => Promise<boolean>;
  removeEventListener: (event: "click", listener: (event: OneSignalClickEvent) => void) => void;
  requestPermission?: (fallbackToSettings: boolean) => Promise<boolean>;
};

export type OneSignalSdk = {
  initialize: (appId: string) => void;
  login: (externalId: string) => void;
  logout: () => void;
  Notifications: OneSignalNotifications;
};

export type PushConfig = {
  appId: string | undefined;
  clickRoutingEnabled: boolean;
  enabled: boolean;
  permissionRequestsEnabled: boolean;
  userAssociationEnabled: boolean;
};

export type PushDiagnostics = {
  reason?: string;
  status: "disabled" | "enabled";
};

export function getPushDiagnostics(
  config: PushConfig,
  platform: string = getRuntimePlatform(),
): PushDiagnostics {
  if (!config.enabled) {
    return { reason: "feature flag disabled", status: "disabled" };
  }
  if (!config.appId) {
    return { reason: "missing OneSignal App ID", status: "disabled" };
  }
  if (platform !== "ios" && platform !== "android") {
    return { reason: `unsupported platform ${platform}`, status: "disabled" };
  }
  return { status: "enabled" };
}

export function loadOneSignalSdk(): OneSignalSdk | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("react-native-onesignal") as { OneSignal?: unknown };
    return getOneSignalSdkFromModule(module);
  } catch (error) {
    recordPushException("native module load failed", error);
    return undefined;
  }
}

export function getOneSignalSdkFromModule(module: {
  OneSignal?: unknown;
}): OneSignalSdk | undefined {
  return isOneSignalSdk(module.OneSignal) ? module.OneSignal : undefined;
}

export function safeInitializeOneSignal(
  oneSignal: OneSignalSdk,
  appId: string | undefined,
  initializedRef: { current: boolean },
): boolean {
  if (!appId || initializedRef.current) {
    return initializedRef.current;
  }

  try {
    recordPushBreadcrumb("before initialization");
    oneSignal.initialize(appId);
    initializedRef.current = true;
    recordPushBreadcrumb("initialization completed");
    return true;
  } catch (error) {
    initializedRef.current = false;
    recordPushException("initialization failed", error);
    return false;
  }
}

export function safeLoginOneSignal(
  oneSignal: OneSignalSdk,
  externalId: string,
  loggedInExternalIdRef: { current: string | undefined },
) {
  if (loggedInExternalIdRef.current === externalId) {
    return;
  }

  try {
    recordPushBreadcrumb("user association attempted");
    oneSignal.login(externalId);
    loggedInExternalIdRef.current = externalId;
    recordPushBreadcrumb("user association completed");
  } catch (error) {
    recordPushException("user association failed", error);
  }
}

export function safeLogoutOneSignal(
  oneSignal: OneSignalSdk,
  loggedInExternalIdRef: { current: string | undefined },
) {
  if (!loggedInExternalIdRef.current) {
    return;
  }

  try {
    oneSignal.logout();
    loggedInExternalIdRef.current = undefined;
    recordPushBreadcrumb("logout completed");
  } catch (error) {
    recordPushException("logout failed", error);
  }
}

export function createNotificationClickHandler({
  onOpenMessage,
  onOpenTrade,
}: {
  onOpenMessage: (conversationId: string) => void;
  onOpenTrade: (tradeId: string) => void;
}) {
  return (event: OneSignalClickEvent) => {
    recordPushBreadcrumb("notification opened");
    const data = parseKonnesorPushData(event.notification?.additionalData);
    if (!data) {
      recordPushBreadcrumb("notification payload ignored");
      return;
    }

    const route = routeForPushData(data);
    if (route.tab === "messages") {
      onOpenMessage(route.messageRoute.conversationId ?? "");
    } else {
      onOpenTrade(route.tradeRoute.tradeId ?? "");
    }
  };
}

export function registerOneSignalClickListener(
  oneSignal: OneSignalSdk,
  clickListenerRef: { current: ((event: OneSignalClickEvent) => void) | undefined },
  listener: (event: OneSignalClickEvent) => void,
) {
  if (clickListenerRef.current) {
    return false;
  }

  try {
    oneSignal.Notifications.addEventListener("click", listener);
    clickListenerRef.current = listener;
    recordPushBreadcrumb("click listener registered");
    return true;
  } catch (error) {
    recordPushException("click listener registration failed", error);
    return false;
  }
}

export function cleanupOneSignalClickListener(
  oneSignal: OneSignalSdk,
  clickListenerRef: { current: ((event: OneSignalClickEvent) => void) | undefined },
) {
  if (!clickListenerRef.current) {
    return false;
  }

  try {
    oneSignal.Notifications.removeEventListener("click", clickListenerRef.current);
    return true;
  } catch (error) {
    recordPushException("click listener cleanup failed", error);
    return false;
  } finally {
    clickListenerRef.current = undefined;
  }
}

export async function requestOneSignalPermissionOnce({
  oneSignal,
  wasRequested,
}: {
  oneSignal: OneSignalSdk;
  wasRequested: boolean;
}) {
  if (wasRequested) {
    recordPushBreadcrumb("permission request skipped", { reason: "already requested" });
    return "already_requested" as const;
  }

  const canRequest = await oneSignal.Notifications.canRequestPermission?.();
  if (canRequest === false) {
    recordPushBreadcrumb("permission request skipped", { reason: "denied or unavailable" });
    return "denied_or_unavailable" as const;
  }

  recordPushBreadcrumb("permission requested");
  const granted = await oneSignal.Notifications.requestPermission?.(false);
  recordPushBreadcrumb("permission completed", { granted: Boolean(granted) });
  return granted ? ("granted" as const) : ("denied" as const);
}

export function recordPushBreadcrumb(message: string, data?: Record<string, unknown>) {
  console.log(`[Konnesor Push] ${message}`, data ?? {});
  loadSentry().addBreadcrumb({
    category: "push_notifications",
    level: "info",
    message,
    ...(data ? { data } : {}),
  });
}

export function recordPushException(
  message: string,
  error: unknown,
  data?: Record<string, unknown>,
) {
  console.log(`[Konnesor Push] ${message}`, {
    ...data,
    reason: error instanceof Error ? error.message : String(error),
  });
  loadSentry().addBreadcrumb({
    category: "push_notifications",
    level: "error",
    message,
    ...(data ? { data } : {}),
  });
  loadSentry().captureException(error, {
    ...(data ? { extra: data } : {}),
    tags: { area: "push_notifications", event: message },
  });
}

function isOneSignalSdk(value: unknown): value is OneSignalSdk {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OneSignalSdk>;
  return (
    typeof candidate.initialize === "function" &&
    typeof candidate.login === "function" &&
    typeof candidate.logout === "function" &&
    Boolean(candidate.Notifications) &&
    typeof candidate.Notifications?.addEventListener === "function" &&
    typeof candidate.Notifications?.removeEventListener === "function"
  );
}

function getRuntimePlatform(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("react-native") as { Platform?: { OS?: unknown } };
    return typeof module.Platform?.OS === "string" ? module.Platform.OS : "unknown";
  } catch {
    return "unknown";
  }
}

function loadSentry(): {
  addBreadcrumb: (breadcrumb: {
    category: string;
    data?: Record<string, unknown>;
    level: "error" | "info";
    message: string;
  }) => void;
  captureException: (
    error: unknown,
    context?: { extra?: Record<string, unknown>; tags?: Record<string, string> },
  ) => void;
} {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@sentry/react-native") as {
      addBreadcrumb: (breadcrumb: {
        category: string;
        data?: Record<string, unknown>;
        level: "error" | "info";
        message: string;
      }) => void;
      captureException: (
        error: unknown,
        context?: { extra?: Record<string, unknown>; tags?: Record<string, string> },
      ) => void;
    };
  } catch {
    return {
      addBreadcrumb: () => {},
      captureException: () => {},
    };
  }
}
