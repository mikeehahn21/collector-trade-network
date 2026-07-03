import type { ComponentType, PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import type { SafeAreaViewProps } from "react-native-safe-area-context";

import { useTheme } from "@/theme/theme-provider";

// Cast needed: @types/react 18.3 ReactNode includes bigint, causing TS2786 with RN components
const SafeAreaView = RNSafeAreaView as unknown as ComponentType<SafeAreaViewProps>;

export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: theme.spacing.lg, width: "100%", maxWidth: 720, alignSelf: "center" }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
