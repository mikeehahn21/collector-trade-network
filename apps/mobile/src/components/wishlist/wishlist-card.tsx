import { Pressable, Text, View } from "react-native";

import type { WishlistItem } from "@ctn/types";

import { categoryLabels, sizeLabels } from "@/lib/item-display";
import { wishlistMatchPreferenceLabels, wishlistPriorityLabels } from "@/lib/wishlist-display";
import { useTheme } from "@/theme/theme-provider";

type WishlistCardProps = {
  item: WishlistItem;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onPress: () => void;
};

export function WishlistCard({ item, onMoveDown, onMoveUp, onPress }: WishlistCardProps) {
  const theme = useTheme();
  const title = item.title.trim() || "Untitled want";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "Any size";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: item.isGrail ? theme.colors.accentMuted : theme.colors.surface,
        borderColor: item.isGrail ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.md,
        opacity: pressed ? 0.82 : 1,
        padding: theme.spacing.lg,
      })}
    >
      <View
        style={{ flexDirection: "row", gap: theme.spacing.md, justifyContent: "space-between" }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {item.isGrail ? "GRAIL" : wishlistPriorityLabels[item.priority].toUpperCase()}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
            {title}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            {category} · {size} · {wishlistMatchPreferenceLabels[item.matchPreference]}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Pressable accessibilityRole="button" onPress={onMoveUp} style={{ paddingVertical: 4 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "800" }}>
            Move up
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onMoveDown} style={{ paddingVertical: 4 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "800" }}>
            Move down
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
