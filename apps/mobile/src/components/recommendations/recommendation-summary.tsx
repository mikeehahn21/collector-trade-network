import { Text, View } from "react-native";

import type { RecommendationSummary as RecommendationSummaryType } from "@ctn/types";

import { useTheme } from "@/theme/theme-provider";

type RecommendationSummaryProps = {
  summary: RecommendationSummaryType;
};

export function RecommendationSummary({ summary }: RecommendationSummaryProps) {
  const theme = useTheme();
  const stats = [
    { label: "Opportunities", value: summary.total },
    { label: "Grails", value: summary.grailMatches },
    { label: "New", value: summary.newMatches },
  ];

  return (
    <View
      style={{
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
      }}
    >
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
  );
}
