import { ActivityIndicator, Text, View } from "react-native";

import { useTheme } from "@/theme/theme-provider";

type ScreenStateProps = {
  message?: string | undefined;
  title: string;
  tone?: "neutral" | "success" | "warning" | undefined;
};

export function LoadingState({ title, message }: Pick<ScreenStateProps, "message" | "title">) {
  const theme = useTheme();

  return (
    <View
      style={{ alignItems: "center", flex: 1, gap: theme.spacing.md, justifyContent: "center" }}
    >
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
        {title}
      </Text>
      {message ? (
        <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>{message}</Text>
      ) : null}
    </View>
  );
}

export function ScreenState({ message, title, tone = "neutral" }: ScreenStateProps) {
  const theme = useTheme();
  const color =
    tone === "success"
      ? theme.colors.success
      : tone === "warning"
        ? theme.colors.warning
        : theme.colors.accent;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={{ color, fontSize: 13, fontWeight: "800" }}>STATUS</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: "800" }}>
        {title}
      </Text>
      {message ? (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
