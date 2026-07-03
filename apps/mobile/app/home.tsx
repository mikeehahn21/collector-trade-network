import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { useAuthSession } from "@/auth/use-auth-session";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RecommendationSummary } from "@/components/recommendations/recommendation-summary";
import { Screen } from "@/components/screen";
import { useCollectionState } from "@/state/collection-state";
import { useOnboardingState } from "@/state/onboarding-state";
import { useRecommendations } from "@/state/recommendation-state";
import { useWishlistState } from "@/state/wishlist-state";
import { useTheme } from "@/theme/theme-provider";

const checklist = [
  "Add 3 tradeable vintage tees",
  "Add 5 wishlist wants",
  "Review your offer boundaries",
  "Invite trusted collectors when invites open",
] as const;

const navItems = ["Home", "Inventory", "Wishlist", "Trades", "Messages"] as const;

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuthSession();
  const theme = useTheme();
  const { summary: collectionSummary } = useCollectionState();
  const { reset, state } = useOnboardingState();
  const recommendationState = useRecommendations();
  const { summary: wishlistSummary } = useWishlistState();
  const name = state.profile?.displayName ?? "Collector";

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between", gap: theme.spacing.xl }}>
        <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
              HOME
            </Text>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
              Welcome, {name}.
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
              Your trade network is reading inventory and wishlist signals to surface explainable
              opportunities.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              flexDirection: "row",
              gap: theme.spacing.sm,
              padding: theme.spacing.lg,
            }}
          >
            {[
              { label: "Tradeable", value: collectionSummary.tradeableItems },
              { label: "Wishlist", value: wishlistSummary.activeItems },
              { label: "Grails", value: wishlistSummary.grailItems },
            ].map((stat) => (
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
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
              First-time checklist
            </Text>
            {checklist.map((item, index) => (
              <View
                key={item}
                style={{ alignItems: "center", flexDirection: "row", gap: theme.spacing.md }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: index === 0 ? theme.colors.accentMuted : theme.colors.surfaceElevated,
                    borderRadius: 999,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                  }}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: "800" }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.textSecondary, flex: 1, fontSize: 15 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
              Potential Trade Opportunities
            </Text>
            <RecommendationSummary summary={recommendationState.summary} />
            {recommendationState.isLoading ? (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Reading current inventory and wishlist signals.
              </Text>
            ) : null}
            {recommendationState.error ? (
              <View style={{ gap: theme.spacing.md }}>
                <Text style={{ color: theme.colors.warning, fontSize: 15, lineHeight: 22 }}>
                  {recommendationState.error}
                </Text>
                <AppButton
                  accessibilityLabel="Retry trade opportunities"
                  onPress={() => void recommendationState.refresh()}
                  variant="secondary"
                >
                  Retry
                </AppButton>
              </View>
            ) : null}
            {!recommendationState.isLoading &&
            !recommendationState.error &&
            recommendationState.recommendations.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                No strong matches yet. Add tradeable pieces with clear category and size, then add
                wishlist wants that describe what you are hunting.
              </Text>
            ) : null}
            {recommendationState.recommendations.slice(0, 3).map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                onPress={() => router.push(`/recommendations/${recommendation.id}`)}
                recommendation={recommendation}
              />
            ))}
          </View>
        </ScrollView>

        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              padding: theme.spacing.sm,
            }}
          >
            {navItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item === "Home" }}
                key={item}
                onPress={() => {
                  if (item === "Inventory") {
                    router.push("/inventory");
                  }
                  if (item === "Wishlist") {
                    router.push("/wishlist");
                  }
                  if (item === "Trades") {
                    router.push("/trades");
                  }
                  if (item === "Messages") {
                    router.push("/conversations");
                  }
                }}
                style={{
                  alignItems: "center",
                  flex: 1,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <Text
                  style={{
                    color: item === "Home" ? theme.colors.accent : theme.colors.textSecondary,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <AppButton
            accessibilityLabel="Log out"
            onPress={() => {
              void auth.logout();
              reset();
              router.replace("/welcome");
            }}
            variant="ghost"
          >
            Log out
          </AppButton>
        </View>
      </View>
    </Screen>
  );
}
