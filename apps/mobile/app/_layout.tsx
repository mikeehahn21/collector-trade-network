import "react-native-reanimated";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F1115" }}>
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}
