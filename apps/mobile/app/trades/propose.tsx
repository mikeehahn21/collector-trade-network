import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { PublicTradeableItem, TradeableItem } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { categoryLabels, sizeLabels } from "@/lib/item-display";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function TradeProposalScreen() {
  const { counterpartyItemId } = useLocalSearchParams<{ counterpartyItemId: string }>();
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const { items } = useCollectionState();
  const [counterpartyItem, setCounterpartyItem] = useState<PublicTradeableItem | undefined>();
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const tradeableItems = items.filter((item) => item.status === "tradeable" && isUuid(item.id));

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await apiRef.current.getPublicItem(counterpartyItemId);
        if (isMounted) {
          setCounterpartyItem(response.item);
        }
      } catch {
        if (isMounted) {
          setError("This item is no longer available for trade proposals.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      isMounted = false;
    };
  }, [counterpartyItemId]);

  async function submitTrade() {
    if (!selectedItemId) {
      setError("Choose one of your tradeable items first.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await apiRef.current.createTrade({
        proposerItemId: selectedItemId,
        counterpartyItemId,
        proposerNotes: notes || undefined,
      });
      router.replace(`/trades/${response.trade.id}`);
    } catch {
      setError("Trade proposal could not be created with those items.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Screen>
        <ScreenState message="Preparing a private trade proposal." title="Loading proposal" />
      </Screen>
    );
  }

  if (!counterpartyItem) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <ScreenState message={error} title="Proposal unavailable" tone="warning" />
          <AppButton accessibilityLabel="Go back" onPress={() => router.back()}>
            Back
          </AppButton>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            TRADE PROPOSAL
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: "900" }}>
            Offer a piece for {counterpartyItem.title}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Pick one tradeable item from your collection. Cash, shipping, and disputes come later.
          </Text>
        </View>

        <ItemPanel item={counterpartyItem} title="Requested item" />

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
            Your offer
          </Text>
          {tradeableItems.length === 0 ? (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              Publish at least one tradeable item before proposing a trade.
            </Text>
          ) : (
            tradeableItems.map((item) => (
              <ItemChoice
                isSelected={item.id === selectedItemId}
                item={item}
                key={item.id}
                onPress={() => setSelectedItemId(item.id)}
              />
            ))
          )}
        </View>

        <AppTextField
          label="Notes"
          multiline
          onChangeText={setNotes}
          placeholder="Add condition context, sizing notes, or what makes this trade make sense."
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={notes}
        />

        {error ? <Text style={{ color: theme.colors.warning, fontSize: 14 }}>{error}</Text> : null}

        <AppButton
          accessibilityLabel="Send trade proposal"
          disabled={!selectedItemId || tradeableItems.length === 0}
          loading={isSubmitting}
          onPress={() => void submitTrade()}
        >
          Send Trade Proposal
        </AppButton>
        <AppButton accessibilityLabel="Cancel trade proposal" onPress={() => router.back()} variant="ghost">
          Cancel
        </AppButton>
      </ScrollView>
    </Screen>
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function ItemPanel({ item, title }: { item: PublicTradeableItem; title: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
        {item.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
        {item.owner.displayName} / {item.category ? categoryLabels[item.category] : "No category"}
        {item.size ? ` / ${sizeLabels[item.size]}` : ""}
      </Text>
    </View>
  );
}

function ItemChoice({
  isSelected,
  item,
  onPress,
}: {
  isSelected: boolean;
  item: TradeableItem;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? theme.colors.accentMuted : theme.colors.surfaceElevated,
        borderColor: isSelected ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
        {item.title || "Untitled item"}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
        {item.category ? categoryLabels[item.category] : "No category"}
        {item.size ? ` / ${sizeLabels[item.size]}` : ""}
      </Text>
    </Pressable>
  );
}
