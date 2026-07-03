import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppErrorBoundary } from "@/components/error-boundary";
import { MobileAuthProvider } from "@/auth/clerk-provider";
import { ProtectedRouteGuard } from "@/auth/protected-route-guard";
import { CollectionStateProvider } from "@/state/collection-state";
import { OnboardingStateProvider } from "@/state/onboarding-state";
import { WishlistStateProvider } from "@/state/wishlist-state";
import { DataSyncBootstrap } from "@/sync/data-sync-bootstrap";
import { ThemeProvider, useTheme } from "@/theme/theme-provider";

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <MobileAuthProvider>
          <OnboardingStateProvider>
            <CollectionStateProvider>
              <WishlistStateProvider>
                <ProtectedRouteGuard />
                <DataSyncBootstrap />
                <RootNavigator />
              </WishlistStateProvider>
            </CollectionStateProvider>
          </OnboardingStateProvider>
        </MobileAuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
