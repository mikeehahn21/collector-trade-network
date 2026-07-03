import Constants from "expo-constants";

type MobileEnv = {
  apiBaseUrl: string;
  clerkPublishableKey?: string;
  sentryDsn?: string;
  posthogApiKey?: string;
  oneSignalAppId?: string;
};

export function getMobileEnv(): MobileEnv {
  const extra = Constants.expoConfig?.extra ?? {};

  return {
    apiBaseUrl: String(extra.apiBaseUrl ?? "http://localhost:4000"),
    clerkPublishableKey: asOptionalString(extra.clerkPublishableKey),
    sentryDsn: asOptionalString(extra.sentryDsn),
    posthogApiKey: asOptionalString(extra.posthogApiKey),
    oneSignalAppId: asOptionalString(extra.oneSignalAppId),
  };
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
