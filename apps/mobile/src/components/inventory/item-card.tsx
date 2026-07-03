import { Pressable, Text, View } from "react-native";

import type { TradeableItem } from "@ctn/types";

import { categoryLabels, sizeLabels, statusLabels } from "@/lib/item-display";
import { useTheme } from "@/theme/theme-provider";

type ItemCardProps = {
  item: TradeableItem;
  onPress: () => void;
};

export function ItemCard({ item, onPress }: ItemCardProps) {
  const theme = useTheme();
  const title = item.title.trim() || "Untitled draft";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "No size";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        opacity: pressed ? 0.82 : 1,
        overflow: "hidden",
      })}
    >
      <View
        style={{
          alignItems: "center",
          aspectRatio: 1,
          backgroundColor: theme.colors.surfaceElevated,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "800" }}>
          {item.photos.length > 0 ? `${item.photos.length} photos` : "Add photos"}
        </Text>
      </View>
      <View style={{ gap: 6, padding: theme.spacing.md }}>
        <Text
          numberOfLines={2}
          style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: "900" }}
        >
          {title}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
          {category} · {size}
        </Text>
        <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
          {statusLabels[item.status]}
        </Text>
      </View>
    </Pressable>
  );
}
