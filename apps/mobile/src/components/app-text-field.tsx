import { Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";

import { useTheme } from "@/theme/theme-provider";

type AppTextFieldProps = TextInputProps & {
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
};

export function AppTextField({ error, label, style, ...props }: AppTextFieldProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "700" }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            color: theme.colors.textPrimary,
            fontSize: 16,
            minHeight: 52,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={{ color: theme.colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}
