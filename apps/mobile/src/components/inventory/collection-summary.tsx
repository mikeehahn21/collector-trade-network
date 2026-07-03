import { Text, View } from "react-native";

import type { CollectionSummary } from "@ctn/types";

import { useTheme } from "@/theme/theme-provider";

type CollectionSummaryProps = {
  summary: CollectionSummary;
};

export function CollectionSummaryPanel({ summary }: CollectionSummaryProps) {
  const theme = useTheme();
  const stats = [
    { label: "Tradeable", value: summary.tradeableItems },
    { label: "Drafts", value: summary.draftItems },
    { label: "Archived", value: summary.archivedItems },
  ] as const;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
        Collection summary
      </Text>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: theme.radius.md,
              flex: 1,
              padding: theme.spacing.md,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
              {stat.value}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: "700" }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
