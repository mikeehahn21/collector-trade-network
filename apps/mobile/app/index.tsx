import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/screen";
import { LoadingState } from "@/components/screen-state";
import { useOnboardingState } from "@/state/onboarding-state";
import { useTheme } from "@/theme/theme-provider";

export default function SplashScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isOnboardingComplete, state } = useOnboardingState();

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }

    const timeout = setTimeout(() => {
      router.replace(isOnboardingComplete ? "/home" : "/welcome");
    }, 700);

    return () => clearTimeout(timeout);
  }, [isOnboardingComplete, router, state.isHydrated]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: "800" }}>
            PRIVATE BETA
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 40, fontWeight: "900" }}>
            Collector Trade
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 17, lineHeight: 25 }}>
            A trusted trade network for serious vintage collectors.
          </Text>
        </View>
        <LoadingState title="Preparing your session" />
      </View>
    </Screen>
  );
}
