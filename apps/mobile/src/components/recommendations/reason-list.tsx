import { Text, View } from "react-native";

import type { RecommendationReason } from "@ctn/types";

import { useTheme } from "@/theme/theme-provider";

type ReasonListProps = {
  reasons: RecommendationReason[];
};

export function ReasonList({ reasons }: ReasonListProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {reasons.map((reason) => (
        <View
          key={reason.code}
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.md,
            gap: theme.spacing.xs,
            padding: theme.spacing.md,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
          >
            <Text
              style={{ color: theme.colors.textPrimary, flex: 1, fontSize: 15, fontWeight: "800" }}
            >
              {reason.label}
            </Text>
            <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: "900" }}>
              +{reason.points}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            {reason.detail}
          </Text>
        </View>
      ))}
    </View>
  );
}
