import { Pressable, Text, View } from "react-native";

import type { TradeRecommendation } from "@ctn/types";

import {
  formatRecommendationConfidence,
  formatRecommendationType,
} from "@/lib/recommendation-display";
import { useTheme } from "@/theme/theme-provider";

type RecommendationCardProps = {
  onPress: () => void;
  recommendation: TradeRecommendation;
};

export function RecommendationCard({ onPress, recommendation }: RecommendationCardProps) {
  const theme = useTheme();
  const topReason = recommendation.reasons[0];
  const yourItem = recommendation.yourMatchingItems[0];
  const theirItem = recommendation.theirMatchingItems[0];

  return (
    <Pressable
      accessibilityLabel={`View recommendation with ${recommendation.counterpartyDisplayName}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderColor: recommendation.hasGrailMatch ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.md,
        opacity: pressed ? 0.82 : 1,
        padding: theme.spacing.lg,
      })}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
      >
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {recommendation.matchTypes.map(formatRecommendationType).join(" / ")}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
            {recommendation.counterpartyDisplayName}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "700" }}>
            {formatRecommendationConfidence(recommendation.confidence)}
          </Text>
        </View>
        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.accentMuted,
            borderRadius: theme.radius.md,
            height: 58,
            justifyContent: "center",
            width: 58,
          }}
        >
          <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
            {recommendation.score}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: "800" }}>
            SCORE
          </Text>
        </View>
      </View>

      <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
        {topReason?.detail ??
          "This recommendation is based on matching inventory and wishlist signals."}
      </Text>

      <View style={{ gap: theme.spacing.sm }}>
        {theirItem ? (
          <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
            They have: {theirItem.title}
          </Text>
        ) : null}
        {yourItem ? (
          <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
            You have: {yourItem.title}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
