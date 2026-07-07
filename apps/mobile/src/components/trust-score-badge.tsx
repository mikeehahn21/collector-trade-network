import { View, Text } from "react-native";
import { useTheme } from "../theme/theme-provider";

type TrustScoreBadgeProps = {
  score: number;
  isElite: boolean;
  size?: "sm" | "md" | "lg";
};

export function TrustScoreBadge({ score, isElite, size = "md" }: TrustScoreBadgeProps) {
  const theme = useTheme();

  const getScoreColor = () => {
    if (isElite) return "#FFD700"; // Gold for elite
    if (score >= 80) return theme.colors.success; // High trust
    if (score >= 50) return theme.colors.accent; // Normal trust
    return theme.colors.warning; // Low trust
  };

  const getScoreLabel = () => {
    if (isElite) return "Elite Collector";
    if (score >= 80) return "Highly Trusted";
    if (score >= 50) return "Trusted";
    return "Building Trust";
  };

  const dimensions = {
    sm: { padding: theme.spacing.xs, fontSize: 10, iconSize: 12 },
    md: { padding: theme.spacing.sm, fontSize: 12, iconSize: 14 },
    lg: { padding: theme.spacing.md, fontSize: 14, iconSize: 16 },
  };

  const current = dimensions[size];
  const color = getScoreColor();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: `${color}15`, // 15% opacity
        paddingHorizontal: current.padding * 1.5,
        paddingVertical: current.padding,
        borderRadius: current.iconSize / 2,
        borderWidth: 1,
        borderColor: `${color}30`,
        alignSelf: "flex-start",
        gap: theme.spacing.xs,
      }}
    >
      <View
        style={{
          width: current.iconSize,
          height: current.iconSize,
          borderRadius: current.iconSize / 2,
          backgroundColor: color,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isElite && (
          <Text
            style={{
              color: theme.colors.surface,
              fontSize: current.iconSize * 0.7,
              fontWeight: "bold",
            }}
          >
            ★
          </Text>
        )}
      </View>
      <Text
        style={{
          color: color,
          fontSize: current.fontSize,
          fontWeight: "800",
        }}
      >
        {score} • {getScoreLabel()}
      </Text>
    </View>
  );
}
