import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { useTheme } from "@/theme/theme-provider";

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between", gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.xl }}>
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: "800" }}>
              INVITE-ONLY VINTAGE TRADING
            </Text>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 42, fontWeight: "900" }}>
              Trade into better pieces.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 17, lineHeight: 26 }}>
              Join a trusted collector network built around serious trades, contextual
              conversations, and reputation earned through completed deals.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              gap: theme.spacing.md,
              padding: theme.spacing.lg,
            }}
          >
            {["Invite-only launch", "Trade-first community", "No unrestricted DMs"].map((value) => (
              <Text key={value} style={{ color: theme.colors.textPrimary, fontSize: 15 }}>
                {value}
              </Text>
            ))}
          </View>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <AppButton accessibilityLabel="Enter invite code" onPress={() => router.push("/invite-code")}>
            Enter invite code
          </AppButton>
          <AppButton
            accessibilityLabel="Apply for access"
            onPress={() => router.push("/apply")}
            variant="secondary"
          >
            Apply for access
          </AppButton>
          <AppButton accessibilityLabel="Log in" onPress={() => router.push("/login")} variant="ghost">
            I already have access
          </AppButton>
        </View>
      </View>
    </Screen>
  );
}
