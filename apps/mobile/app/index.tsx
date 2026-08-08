import { Text, View } from "react-native";

export default function SplashScreen() {
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
      <Text style={{ color: "#F7F2E8", fontSize: 28, fontWeight: "900", textAlign: "center" }}>
        Konnesor Smoke Test
      </Text>
      <Text style={{ color: "#B8C5BA", fontSize: 16, lineHeight: 24, marginTop: 16, textAlign: "center" }}>
        If you can see this screen, the iPhone install and native app shell are working.
      </Text>
    </View>
  );
}
