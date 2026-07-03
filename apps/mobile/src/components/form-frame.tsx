import type { PropsWithChildren } from "react";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme } from "@/theme/theme-provider";

type FormFrameProps = PropsWithChildren<{
  eyebrow?: string;
  footer?: ReactNode;
  progressLabel?: string;
  subtitle?: string;
  title: string;
}>;

export function FormFrame({
  children,
  eyebrow,
  footer,
  progressLabel,
  subtitle,
  title,
}: FormFrameProps) {
  const theme = useTheme();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: theme.spacing.sm }}>
            {progressLabel ? (
              <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
                {progressLabel}
              </Text>
            ) : null}
            {eyebrow ? (
              <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
                {eyebrow}
              </Text>
            ) : null}
            <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "800" }}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={{ gap: theme.spacing.md }}>{children}</View>
          {footer ? (
            <View style={{ marginTop: "auto", gap: theme.spacing.md }}>{footer}</View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
