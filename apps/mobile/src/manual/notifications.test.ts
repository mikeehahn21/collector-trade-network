import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseKonnesorPushData, routeForPushData } from "./notification-routing";
import {
  cleanupOneSignalClickListener,
  createNotificationClickHandler,
  getOneSignalSdkFromModule,
  getPushDiagnostics,
  registerOneSignalClickListener,
  requestOneSignalPermissionOnce,
  safeInitializeOneSignal,
  safeLoginOneSignal,
  safeLogoutOneSignal,
} from "./notification-runtime";

type TestClickEvent = { notification?: { additionalData?: unknown } };

vi.mock("@sentry/react-native", () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("react-native-onesignal", () => ({
  OneSignal: {
    initialize: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    Notifications: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestPermission: vi.fn(),
      canRequestPermission: vi.fn(),
    },
  },
}));

describe("manual push notification routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes new message payloads into the message detail screen", () => {
    const data = parseKonnesorPushData({
      conversationId: "conv_123",
      messageId: "msg_123",
      type: "message",
    });

    expect(data).toEqual({
      conversationId: "conv_123",
      messageId: "msg_123",
      type: "message",
    });
    expect(data ? routeForPushData(data) : undefined).toEqual({
      messageRoute: { conversationId: "conv_123", mode: "detail" },
      tab: "messages",
    });
  });

  it("routes trade proposal payloads into the trade detail screen", () => {
    const data = parseKonnesorPushData({ tradeId: "trade_123", type: "trade_proposal" });

    expect(data ? routeForPushData(data) : undefined).toEqual({
      tab: "trades",
      tradeRoute: { mode: "detail", tradeId: "trade_123" },
    });
  });

  it("routes completion-needed payloads into the trade detail screen", () => {
    const data = parseKonnesorPushData({
      id: "trade_456",
      tradeId: "trade_456",
      type: "trade_completion_needed",
    });

    expect(data ? routeForPushData(data) : undefined).toEqual({
      tab: "trades",
      tradeRoute: { mode: "detail", tradeId: "trade_456" },
    });
  });

  it("ignores malformed notification payloads", () => {
    expect(parseKonnesorPushData({ tradeId: 123, type: "trade_proposal" })).toBeUndefined();
    expect(parseKonnesorPushData({ conversationId: "conv_123", type: "unknown" })).toBeUndefined();
  });

  it("disables push when the feature flag is off", () => {
    expect(
      getPushDiagnostics(
        {
          appId: "app-id",
          clickRoutingEnabled: false,
          enabled: false,
          permissionRequestsEnabled: false,
          userAssociationEnabled: false,
        },
        "ios",
      ),
    ).toEqual({ reason: "feature flag disabled", status: "disabled" });
  });

  it("disables push when the OneSignal App ID is missing", () => {
    expect(
      getPushDiagnostics(
        {
          appId: undefined,
          clickRoutingEnabled: false,
          enabled: true,
          permissionRequestsEnabled: false,
          userAssociationEnabled: false,
        },
        "ios",
      ),
    ).toEqual({ reason: "missing OneSignal App ID", status: "disabled" });
  });

  it("detects when the native OneSignal module is unavailable", () => {
    expect(getOneSignalSdkFromModule({ OneSignal: undefined })).toBeUndefined();
  });

  it("accepts a complete native OneSignal module", () => {
    const sdk = createSdk();

    expect(getOneSignalSdkFromModule({ OneSignal: sdk })).toBe(sdk);
  });

  it("initializes OneSignal only once", () => {
    const sdk = createSdk();
    const initializedRef = { current: false };

    expect(safeInitializeOneSignal(sdk, "app-id", initializedRef)).toBe(true);
    expect(safeInitializeOneSignal(sdk, "app-id", initializedRef)).toBe(true);

    expect(sdk.initialize).toHaveBeenCalledTimes(1);
  });

  it("keeps initialization exceptions from crashing the app", () => {
    const sdk = createSdk();
    vi.mocked(sdk.initialize).mockImplementation(() => {
      throw new Error("native crash path");
    });
    const initializedRef = { current: false };

    expect(safeInitializeOneSignal(sdk, "app-id", initializedRef)).toBe(false);
    expect(initializedRef.current).toBe(false);
  });

  it("does not log in a signed-out user without an external id", () => {
    const sdk = createSdk();
    const loggedInExternalIdRef = { current: undefined as string | undefined };

    safeLogoutOneSignal(sdk, loggedInExternalIdRef);

    expect(sdk.logout).not.toHaveBeenCalled();
  });

  it("uses the Konnesor database user id as the OneSignal external id", () => {
    const sdk = createSdk();
    const loggedInExternalIdRef = { current: undefined as string | undefined };

    safeLoginOneSignal(sdk, "user_db_uuid_123", loggedInExternalIdRef);

    expect(sdk.login).toHaveBeenCalledWith("user_db_uuid_123");
    expect(loggedInExternalIdRef.current).toBe("user_db_uuid_123");
  });

  it("does not repeat duplicate login calls for the same user", () => {
    const sdk = createSdk();
    const loggedInExternalIdRef = { current: "user_db_uuid_123" };

    safeLoginOneSignal(sdk, "user_db_uuid_123", loggedInExternalIdRef);

    expect(sdk.login).not.toHaveBeenCalled();
  });

  it("logs out the currently associated OneSignal user", () => {
    const sdk = createSdk();
    const loggedInExternalIdRef = { current: "user_db_uuid_123" as string | undefined };

    safeLogoutOneSignal(sdk, loggedInExternalIdRef);

    expect(sdk.logout).toHaveBeenCalledTimes(1);
    expect(loggedInExternalIdRef.current).toBeUndefined();
  });

  it("registers and cleans up exactly one click listener", () => {
    const sdk = createSdk();
    const clickListenerRef = {
      current: undefined as ((event: TestClickEvent) => void) | undefined,
    };
    const listener = vi.fn();

    expect(registerOneSignalClickListener(sdk, clickListenerRef, listener)).toBe(true);
    expect(registerOneSignalClickListener(sdk, clickListenerRef, listener)).toBe(false);
    expect(cleanupOneSignalClickListener(sdk, clickListenerRef)).toBe(true);

    expect(sdk.Notifications.addEventListener).toHaveBeenCalledTimes(1);
    expect(sdk.Notifications.removeEventListener).toHaveBeenCalledTimes(1);
    expect(clickListenerRef.current).toBeUndefined();
  });

  it("routes message notification clicks through the existing router", () => {
    const onOpenMessage = vi.fn();
    const onOpenTrade = vi.fn();
    const listener = createNotificationClickHandler({ onOpenMessage, onOpenTrade });

    listener({ notification: { additionalData: { conversationId: "conv_123", type: "message" } } });

    expect(onOpenMessage).toHaveBeenCalledWith("conv_123");
    expect(onOpenTrade).not.toHaveBeenCalled();
  });

  it("routes trade notification clicks through the existing router", () => {
    const onOpenMessage = vi.fn();
    const onOpenTrade = vi.fn();
    const listener = createNotificationClickHandler({ onOpenMessage, onOpenTrade });

    listener({ notification: { additionalData: { tradeId: "trade_123", type: "trade_status" } } });

    expect(onOpenTrade).toHaveBeenCalledWith("trade_123");
    expect(onOpenMessage).not.toHaveBeenCalled();
  });

  it("does not route malformed notification clicks", () => {
    const onOpenMessage = vi.fn();
    const onOpenTrade = vi.fn();
    const listener = createNotificationClickHandler({ onOpenMessage, onOpenTrade });

    listener({ notification: { additionalData: { type: "trade_status" } } });

    expect(onOpenMessage).not.toHaveBeenCalled();
    expect(onOpenTrade).not.toHaveBeenCalled();
  });

  it("handles permission denial without throwing", async () => {
    const sdk = createSdk();
    vi.mocked(sdk.Notifications.canRequestPermission).mockResolvedValue(false);

    await expect(
      requestOneSignalPermissionOnce({ oneSignal: sdk, wasRequested: false }),
    ).resolves.toBe("denied_or_unavailable");
    expect(sdk.Notifications.requestPermission).not.toHaveBeenCalled();
  });

  it("does not repeat permission prompts after one was recorded", async () => {
    const sdk = createSdk();

    await expect(
      requestOneSignalPermissionOnce({ oneSignal: sdk, wasRequested: true }),
    ).resolves.toBe("already_requested");
    expect(sdk.Notifications.canRequestPermission).not.toHaveBeenCalled();
    expect(sdk.Notifications.requestPermission).not.toHaveBeenCalled();
  });
});

function createSdk() {
  return {
    initialize: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    Notifications: {
      addEventListener: vi.fn(),
      canRequestPermission: vi.fn(async () => true),
      removeEventListener: vi.fn(),
      requestPermission: vi.fn(async (_fallbackToSettings: boolean) => true),
    },
  };
}
