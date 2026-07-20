import type { ComponentType } from "react";
import { Stack as ExpoStack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppErrorBoundary } from "@/components/error-boundary";
import { MobileAuthProvider } from "@/auth/clerk-provider";
import { ProtectedRouteGuard } from "@/auth/protected-route-guard";
import { CollectionStateProvider } from "@/state/collection-state";
import { OnboardingStateProvider } from "@/state/onboarding-state";
import { UserProfileProvider } from "@/state/user-profile-state";
import { WishlistStateProvider } from "@/state/wishlist-state";
import { DataSyncBootstrap } from "@/sync/data-sync-bootstrap";
import { ThemeProvider, useTheme } from "@/theme/theme-provider";

// Cast needed: @types/react 18.3 ReactNode includes bigint, causing TS2786 with expo-router components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Stack = ExpoStack as unknown as ComponentType<any>;

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

function RootLayout() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <MobileAuthProvider>
          <OnboardingStateProvider>
            <CollectionStateProvider>
              <UserProfileProvider>
                <WishlistStateProvider>
                  <ProtectedRouteGuard />
                  <DataSyncBootstrap />
                  <RootNavigator />
                </WishlistStateProvider>
              </UserProfileProvider>
            </CollectionStateProvider>
          </OnboardingStateProvider>
        </MobileAuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default RootLayout;
