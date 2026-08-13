import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { useTheme } from "@/theme/theme-provider";

type AppButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
}>;

export function AppButton({
  accessibilityLabel,
  children,
  disabled,
  loading,
  onPress,
  variant = "primary",
}: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary"
      ? theme.colors.accent
      : variant === "secondary"
        ? theme.colors.surfaceElevated
        : "transparent";
  const color = variant === "primary" ? theme.colors.background : theme.colors.textPrimary;
  const content: ReactNode =
    typeof children === "string" || typeof children === "number" ? (
      <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor,
        borderColor: variant === "ghost" ? "transparent" : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: variant === "primary" ? 0 : 1,
        minHeight: 52,
        justifyContent: "center",
        opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
        paddingHorizontal: theme.spacing.lg,
      })}
    >
      {loading ? <ActivityIndicator color={color} /> : content}
    </Pressable>
  );
}
