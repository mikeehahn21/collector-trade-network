import Constants from "expo-constants";

type MobileEnv = {
  apiBaseUrl: string;
  clerkPublishableKey?: string | undefined;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  sentryDsn?: string | undefined;
  posthogApiKey?: string | undefined;
  oneSignalAppId?: string | undefined;
};

export function getMobileEnv(): MobileEnv {
  const extra = Constants.expoConfig?.extra ?? {};

  return {
    apiBaseUrl: String(extra.apiBaseUrl ?? "http://localhost:4000"),
    clerkPublishableKey: asOptionalString(extra.clerkPublishableKey),
    privacyPolicyUrl: String(extra.privacyPolicyUrl ?? "https://konnesor.app/privacy"),
    termsOfServiceUrl: String(extra.termsOfServiceUrl ?? "https://konnesor.app/terms"),
    sentryDsn: asOptionalString(extra.sentryDsn),
    posthogApiKey: asOptionalString(extra.posthogApiKey),
    oneSignalAppId: asOptionalString(extra.oneSignalAppId),
  };
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
