import "react-native-reanimated";

import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

function RootLayout() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "#0F1115",
        flex: 1,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <StatusBar style="light" />
      <Text style={{ color: "#F7F2E8", fontSize: 28, fontWeight: "900", textAlign: "center" }}>
        Expo Router Layout Works
      </Text>
      <Text
        style={{
          color: "#B8C5BA",
          fontSize: 16,
          lineHeight: 24,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        This bypasses Slot and navigator rendering.
      </Text>
    </View>
  );
}

export default RootLayout;
