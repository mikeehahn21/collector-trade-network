import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { CollectionSummaryPanel } from "@/components/inventory/collection-summary";
import { ItemCard } from "@/components/inventory/item-card";
import { Screen } from "@/components/screen";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function InventoryHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { createItem, items, lastPublishedItem, summary, clearPublishedCelebration } =
    useCollectionState();
  const visibleItems = items.filter((item) => item.status !== "archived");

  function startNewItem() {
    const item = createItem();
    router.push(`/inventory/${item.id}/edit`);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            COLLECTION ENGINE
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 34, fontWeight: "900" }}>
            Your tradeable collection.
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Add pieces you would actually consider trading. Strong inventory creates future
            opportunities.
          </Text>
        </View>

        {lastPublishedItem ? (
          <View
            style={{
              backgroundColor: theme.colors.accentMuted,
              borderColor: theme.colors.accent,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              gap: theme.spacing.sm,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
              Great addition to your collection.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              {lastPublishedItem.title || "Your item"} is tradeable. We will use it to unlock future
              trade opportunities once recommendations begin.
            </Text>
            <AppButton
              accessibilityLabel="Dismiss publish celebration"
              onPress={clearPublishedCelebration}
              variant="ghost"
            >
              Dismiss
            </AppButton>
          </View>
        ) : null}

        <CollectionSummaryPanel summary={summary} />

        <AppButton accessibilityLabel="Add item" onPress={startNewItem}>
          Add item
        </AppButton>

        {visibleItems.length === 0 ? (
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
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
              Start with one strong piece.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 23 }}>
              A good first item has clear photos, honest condition, and trade boundaries. You can
              save drafts before publishing.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            {visibleItems.map((item) => (
              <View key={item.id} style={{ width: "47%" }}>
                <ItemCard item={item} onPress={() => router.push(`/inventory/${item.id}`)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
