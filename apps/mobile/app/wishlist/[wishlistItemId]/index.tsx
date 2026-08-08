import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { categoryLabels, conditionLabels, sizeLabels } from "@/lib/item-display";
import {
  wishlistMatchPreferenceLabels,
  wishlistPriorityLabels,
  wishlistVisibilityLabels,
} from "@/lib/wishlist-display";
import { useWishlistState } from "@/state/wishlist-state";
import { useTheme } from "@/theme/theme-provider";

export default function WishlistItemDetailScreen() {
  const { wishlistItemId } = useLocalSearchParams<{ wishlistItemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getWishlistItem } = useWishlistState();
  const item = getWishlistItem(wishlistItemId);

  if (!item) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            Wishlist item not found
          </Text>
          <AppButton
            accessibilityLabel="Back to wishlist"
            onPress={() => router.replace("/wishlist")}
          >
            Back to wishlist
          </AppButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {item.isGrail
              ? "GRAIL"
              : `${wishlistPriorityLabels[item.priority].toUpperCase()} PRIORITY`}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 34, fontWeight: "900" }}>
            {item.title || "Untitled want"}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {item.category ? categoryLabels[item.category] : "No category"} ·{" "}
            {item.size ? sizeLabels[item.size] : "Any size"}
          </Text>
        </View>

        <DetailPanel
          rows={[
            ["Match type", wishlistMatchPreferenceLabels[item.matchPreference]],
            ["Preferred era", item.preferredEra || "Any"],
            ["Preferred tag", item.preferredTag || "Any"],
            [
              "Preferred condition",
              item.preferredCondition ? conditionLabels[item.preferredCondition] : "Flexible",
            ],
            ["Visibility", wishlistVisibilityLabels[item.visibility]],
            ["Archived", item.isArchived ? "Yes" : "No"],
          ]}
        />

        {item.notes ? <DetailPanel title="Notes" rows={[["Collector note", item.notes]]} /> : null}

        <View style={{ gap: theme.spacing.md }}>
          <AppButton
            accessibilityLabel="Edit wishlist item"
            onPress={() => router.push(`/wishlist/${item.id}/edit`)}
          >
            Edit want
          </AppButton>
          <AppButton
            accessibilityLabel="Archive wishlist item"
            onPress={() => router.push(`/wishlist/${item.id}/archive`)}
            variant="secondary"
          >
            Archive or delete
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailPanel({
  rows,
  title = "Wishlist details",
}: {
  rows: [string, string][];
  title?: string;
}) {
  const theme = useTheme();

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
        {title}
      </Text>
      {rows.map(([label, value]) => (
        <View
          key={label}
          style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
        >
          <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>{label}</Text>
          <Text
            style={{
              color: theme.colors.textPrimary,
              flex: 1,
              fontWeight: "700",
              textAlign: "right",
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
