import Constants from "expo-constants";
import { ScrollView, Text, View } from "react-native";

import { useAuthSession } from "@/auth/use-auth-session";
import { getMobileEnv } from "@/config/env";
import { BetaButton, BetaKicker, BetaPanel, BetaScreen } from "@/manual/beta-ui";

import type { BackendFallbackState, BackendHealthState, FallbackScope } from "../beta-app.shared";
import { beta } from "../beta-app.shared";
import { getPushDiagnostics } from "../notification-runtime";

type DiagnosticsScreenProps = {
  backendFallbacks: Partial<Record<FallbackScope, BackendFallbackState>>;
  backendHealth: BackendHealthState;
  blockedUserCount: number;
  localThreadCount: number;
  localTradeCount: number;
  onBack: () => void;
};

export function DiagnosticsScreen({
  backendFallbacks,
  backendHealth,
  blockedUserCount,
  localThreadCount,
  localTradeCount,
  onBack,
}: DiagnosticsScreenProps) {
  const auth = useAuthSession();
  const env = getMobileEnv();
  const pushDiagnostics = getPushDiagnostics({
    appId: env.oneSignalAppId,
    clickRoutingEnabled: env.pushClickRoutingEnabled,
    enabled: env.pushNotificationsEnabled,
    permissionRequestsEnabled: env.pushPermissionRequestsEnabled,
    userAssociationEnabled: env.pushUserAssociationEnabled,
  });
  const manifest = Constants.expoConfig;
  const version = String(manifest?.version ?? "unknown");
  const buildNumber = String(manifest?.ios?.buildNumber ?? "unknown");
  const fallbackRows = Object.values(backendFallbacks).filter(
    (fallback): fallback is BackendFallbackState => Boolean(fallback),
  );

  return (
    <BetaScreen>
      <ScrollView contentContainerStyle={{ gap: beta.spacing.md, paddingBottom: beta.spacing.xl }}>
        <View style={{ gap: beta.spacing.sm }}>
          <BetaButton accessibilityLabel="Back to Home" onPress={onBack} variant="secondary">
            Back
          </BetaButton>
          <View style={{ gap: 4 }}>
            <BetaKicker>DIAGNOSTICS</BetaKicker>
            <Text style={{ color: beta.colors.ink, fontSize: 28, fontWeight: "900" }}>
              Build health
            </Text>
            <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              Internal snapshot for TestFlight debugging. Values show presence and status only.
            </Text>
          </View>
        </View>

        <BetaPanel tone="black">
          <DiagnosticsRow label="App version" value={version} />
          <DiagnosticsRow label="iOS build" value={buildNumber} />
          <DiagnosticsRow label="Runtime" value={String(Constants.executionEnvironment)} />
        </BetaPanel>

        <BetaPanel>
          <DiagnosticsRow label="API URL" value={backendHealth.apiBaseUrl} />
          <DiagnosticsRow
            label="API health"
            tone={backendHealth.status === "online" ? "success" : "warning"}
            value={backendHealth.status.toUpperCase()}
          />
          <DiagnosticsRow label="HTTP status" value={backendHealth.httpStatus ?? "n/a"} />
          <DiagnosticsRow label="Checked at" value={backendHealth.checkedAt ?? "not checked"} />
          <DiagnosticsRow label="Reason" value={backendHealth.reason ?? "none"} />
        </BetaPanel>

        <BetaPanel>
          <DiagnosticsRow label="Signed in" value={auth.isSignedIn ? "yes" : "no"} />
          <DiagnosticsRow label="Auth loaded" value={auth.isLoaded ? "yes" : "no"} />
          <DiagnosticsRow
            label="Clerk key"
            value={env.clerkPublishableKey ? "present" : "missing"}
          />
          <DiagnosticsRow label="Sentry DSN" value={env.sentryDsn ? "present" : "missing"} />
          <DiagnosticsRow label="PostHog key" value={env.posthogApiKey ? "present" : "missing"} />
        </BetaPanel>

        <BetaPanel>
          <DiagnosticsRow
            label="Push runtime"
            tone={pushDiagnostics.status === "enabled" ? "success" : "warning"}
            value={pushDiagnostics.status.toUpperCase()}
          />
          <DiagnosticsRow label="Push reason" value={pushDiagnostics.reason ?? "ready"} />
          <DiagnosticsRow
            label="OneSignal App ID"
            value={env.oneSignalAppId ? "present" : "missing"}
          />
          <DiagnosticsRow
            label="Initialize flag"
            value={env.pushNotificationsEnabled ? "true" : "false"}
          />
          <DiagnosticsRow
            label="User association"
            value={env.pushUserAssociationEnabled ? "true" : "false"}
          />
          <DiagnosticsRow
            label="Click routing"
            value={env.pushClickRoutingEnabled ? "true" : "false"}
          />
          <DiagnosticsRow
            label="Permission prompts"
            value={env.pushPermissionRequestsEnabled ? "true" : "false"}
          />
        </BetaPanel>

        <BetaPanel>
          <DiagnosticsRow label="Local threads" value={localThreadCount} />
          <DiagnosticsRow label="Local trades" value={localTradeCount} />
          <DiagnosticsRow label="Blocked users" value={blockedUserCount} />
          <DiagnosticsRow label="Fallbacks" value={fallbackRows.length} />
          {fallbackRows.map((fallback) => (
            <View
              key={fallback.scope}
              style={{
                borderColor: beta.colors.orange,
                borderRadius: beta.radius.md,
                borderWidth: 1,
                gap: 4,
                padding: beta.spacing.sm,
              }}
            >
              <Text style={{ color: beta.colors.orange, fontSize: 11, fontWeight: "900" }}>
                {fallback.scope.toUpperCase()} / {fallback.operation}
              </Text>
              <Text style={{ color: beta.colors.ink, fontSize: 13, lineHeight: 18 }}>
                {fallback.reason}
              </Text>
              {fallback.detail ? (
                <Text style={{ color: beta.colors.inkMuted, fontSize: 12, lineHeight: 17 }}>
                  {fallback.detail}
                </Text>
              ) : null}
            </View>
          ))}
        </BetaPanel>
      </ScrollView>
    </BetaScreen>
  );
}

function DiagnosticsRow({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
  value: boolean | number | string;
}) {
  const valueColor =
    tone === "success"
      ? beta.colors.success
      : tone === "warning"
        ? beta.colors.orange
        : beta.colors.ink;

  return (
    <View
      style={{
        borderBottomColor: beta.colors.border,
        borderBottomWidth: 1,
        gap: 3,
        paddingBottom: beta.spacing.sm,
      }}
    >
      <Text style={{ color: beta.colors.inkMuted, fontSize: 11, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: 14, fontWeight: "900" }}>{String(value)}</Text>
    </View>
  );
}
