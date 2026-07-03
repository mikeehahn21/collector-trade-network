import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/theme/theme-provider";

type ChoiceCardProps = {
  description?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function ChoiceCard({ description, label, onPress, selected }: ChoiceCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? theme.colors.accentMuted : theme.colors.surface,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        opacity: pressed ? 0.82 : 1,
        padding: theme.spacing.md,
      })}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "700" }}>
          {label}
        </Text>
        {description ? (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
