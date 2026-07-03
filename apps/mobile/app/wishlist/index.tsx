import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { WishlistCard } from "@/components/wishlist/wishlist-card";
import { WishlistSummaryPanel } from "@/components/wishlist/wishlist-summary";
import { useWishlistState } from "@/state/wishlist-state";
import { useTheme } from "@/theme/theme-provider";

export default function WishlistHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    activeItems,
    clearGrailCelebration,
    createWishlistItem,
    lastGrailItem,
    moveWishlistItem,
    summary,
  } = useWishlistState();

  function startNewWish() {
    const item = createWishlistItem();
    router.push(`/wishlist/${item.id}/edit`);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            WISHLIST
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 34, fontWeight: "900" }}>
            What are you hunting?
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Wishlist signals tell the future recommendation engine what actually matters to your
            collection.
          </Text>
        </View>

        {lastGrailItem ? (
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
              Grail marked.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              {lastGrailItem.title || "This want"} is now one of your strongest demand signals.
            </Text>
            <AppButton
              accessibilityLabel="Dismiss grail celebration"
              onPress={clearGrailCelebration}
              variant="ghost"
            >
              Dismiss
            </AppButton>
          </View>
        ) : null}

        <WishlistSummaryPanel summary={summary} />

        <AppButton accessibilityLabel="Add wishlist item" onPress={startNewWish}>
          Add wanted item
        </AppButton>

        {activeItems.length === 0 ? (
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
              Build your dream collection.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 23 }}>
              Start with the pieces you would actually move inventory for. Grails should stay scarce
              so they remain meaningful.
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {activeItems.map((item) => (
              <WishlistCard
                item={item}
                key={item.id}
                onMoveDown={() => moveWishlistItem(item.id, "down")}
                onMoveUp={() => moveWishlistItem(item.id, "up")}
                onPress={() => router.push(`/wishlist/${item.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
