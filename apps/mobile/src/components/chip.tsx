import { Pressable, Text } from "react-native";

import { useTheme } from "@/theme/theme-provider";

type ChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function Chip({ label, onPress, selected }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderRadius: 999,
        borderWidth: 1,
        opacity: pressed ? 0.82 : 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
      })}
    >
      <Text
        style={{
          color: selected ? theme.colors.background : theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
