import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type {
  RecommendationFeedbackRating,
  RecommendationItemSummary,
  TradeRecommendation,
} from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { ReasonList } from "@/components/recommendations/reason-list";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import {
  formatRecommendationCategory,
  formatRecommendationConfidence,
  formatRecommendationSize,
  formatRecommendationType,
} from "@/lib/recommendation-display";
import { useTheme } from "@/theme/theme-provider";

export default function RecommendationDetailScreen() {
  const { recommendationId } = useLocalSearchParams<{ recommendationId: string }>();
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const [recommendation, setRecommendation] = useState<TradeRecommendation | undefined>();
  const [feedbackRating, setFeedbackRating] = useState<RecommendationFeedbackRating | undefined>();
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [feedbackError, setFeedbackError] = useState<string | undefined>();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendation() {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await apiRef.current.getRecommendation(recommendationId);
        if (isMounted) {
          setRecommendation(response.recommendation);
        }
      } catch {
        if (isMounted) {
          setError("This recommendation is no longer available.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecommendation();

    return () => {
      isMounted = false;
    };
  }, [recommendationId]);

  if (isLoading) {
    return (
      <Screen>
        <ScreenState
          message="We are rebuilding the explanation from current server data."
          title="Loading recommendation"
        />
      </Screen>
    );
  }

  if (error || !recommendation) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <ScreenState message={error} title="Recommendation unavailable" tone="warning" />
          <AppButton accessibilityLabel="Back to Home" onPress={() => router.replace("/home")}>
            Back to Home
          </AppButton>
        </View>
      </Screen>
    );
  }

  const primaryItem = recommendation.theirMatchingItems[0] ?? recommendation.yourMatchingItems[0];

  function viewItem() {
    if (primaryItem) {
      router.push(`/items/${primaryItem.id}`);
    }
  }

  async function submitFeedback(rating: RecommendationFeedbackRating) {
    if (!recommendation) {
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError(undefined);

    try {
      await apiRef.current.submitRecommendationFeedback(recommendation.id, {
        rating,
        targetItemId: primaryItem?.id,
      });
      setFeedbackRating(rating);
    } catch {
      setFeedbackError("We could not save that feedback. Try again shortly.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {recommendation.matchTypes.map(formatRecommendationType).join(" / ")}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: "900" }}>
            Match with {recommendation.counterpartyDisplayName}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            {formatRecommendationConfidence(recommendation.confidence)} with a deterministic score
            of {recommendation.score}.
          </Text>
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
          <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
            Trade Compatibility
          </Text>
          <DetailRow label="Mutual interest" value={recommendation.isMutual ? "Yes" : "One-way"} />
          <DetailRow label="Grail signal" value={recommendation.hasGrailMatch ? "Yes" : "No"} />
          <DetailRow label="Exact match" value={recommendation.hasExactMatch ? "Yes" : "No"} />
          <DetailRow
            label="Shared categories"
            value={
              recommendation.sharedCategories.length > 0
                ? recommendation.sharedCategories.map(formatRecommendationCategory).join(", ")
                : "None"
            }
          />
          <DetailRow
            label="Compatible sizes"
            value={
              recommendation.compatibleSizes.length > 0
                ? recommendation.compatibleSizes.map(formatRecommendationSize).join(", ")
                : "No direct size match"
            }
          />
        </View>

        <ItemSection items={recommendation.theirMatchingItems} title="Their matching items" />
        <ItemSection items={recommendation.yourMatchingItems} title="Your matching items" />

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
          <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
            Why this exists
          </Text>
          <ReasonList reasons={recommendation.reasons} />
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
          <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
            Recommendation quality
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
            Your feedback helps tune future matches without changing this recommendation.
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <AppButton
              accessibilityLabel="Mark recommendation helpful"
              disabled={isSubmittingFeedback}
              onPress={() => void submitFeedback("helpful")}
              variant={feedbackRating === "helpful" ? "primary" : "secondary"}
            >
              Helpful
            </AppButton>
            <AppButton
              accessibilityLabel="Mark recommendation not relevant"
              disabled={isSubmittingFeedback}
              onPress={() => void submitFeedback("not_relevant")}
              variant={feedbackRating === "not_relevant" ? "primary" : "secondary"}
            >
              Not relevant
            </AppButton>
          </View>
          {feedbackError ? (
            <Text style={{ color: theme.colors.warning, fontSize: 14 }}>{feedbackError}</Text>
          ) : null}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <AppButton
            accessibilityLabel="View matched item"
            disabled={!primaryItem}
            onPress={viewItem}
          >
            View Item
          </AppButton>
          <AppButton
            accessibilityLabel="Back to Home"
            onPress={() => router.back()}
            variant="ghost"
          >
            Back
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ItemSection({ items, title }: { items: RecommendationItemSummary[]; title: string }) {
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
      <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
          No direct item match on this side.
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={{ gap: theme.spacing.xs }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
              {item.title}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              {item.category ? formatRecommendationCategory(item.category) : "Uncategorized"}
              {item.size ? ` / ${formatRecommendationSize(item.size)}` : ""}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text
        style={{ color: theme.colors.textPrimary, flex: 1, fontWeight: "800", textAlign: "right" }}
      >
        {value}
      </Text>
    </View>
  );
}
