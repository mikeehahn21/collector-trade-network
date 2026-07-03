import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { PublicTradeableItem } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import {
  categoryLabels,
  communicationPreferenceLabels,
  conditionLabels,
  sizeLabels,
  tradePreferenceLabels,
} from "@/lib/item-display";
import { useTheme } from "@/theme/theme-provider";

export default function PublicItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const [item, setItem] = useState<PublicTradeableItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await apiRef.current.getPublicItem(itemId);
        if (isMounted) {
          setItem(response.item);
        }
      } catch {
        if (isMounted) {
          setError("This item is no longer available to view.");
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
  }, [itemId]);

  if (isLoading) {
    return (
      <Screen>
        <ScreenState message="Loading item details from the collector network." title="Loading item" />
      </Screen>
    );
  }

  if (error || !item) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <ScreenState message={error} title="Item unavailable" tone="warning" />
          <AppButton accessibilityLabel="Go back" onPress={() => router.back()}>
            Back
          </AppButton>
        </View>
      </Screen>
    );
  }

  const value =
    item.estimatedValue.min || item.estimatedValue.max
      ? `$${item.estimatedValue.min ?? "?"} - $${item.estimatedValue.max ?? "?"}`
      : "Not estimated";
  const measurements = [
    item.measurements.chest ? `Chest ${item.measurements.chest}` : undefined,
    item.measurements.length ? `Length ${item.measurements.length}` : undefined,
    item.measurements.shoulder ? `Shoulder ${item.measurements.shoulder}` : undefined,
    item.measurements.sleeve ? `Sleeve ${item.measurements.sleeve}` : undefined,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <View
          style={{
            alignItems: "center",
            aspectRatio: 0.86,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.lg,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: "800" }}>
            {item.photos.length > 0 ? `${item.photos.length} photos` : "No photos yet"}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {item.owner.displayName}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            {item.title}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {item.category ? categoryLabels[item.category] : "No category"} /{" "}
            {item.size ? sizeLabels[item.size] : "No size"}
          </Text>
        </View>

        <DetailPanel
          rows={[
            ["Owner", item.owner.displayName],
            ["Region", item.owner.locationRegion ?? "Not shared"],
            ["Condition", item.condition ? conditionLabels[item.condition] : "Not set"],
            ["Tag", item.tag || "Not set"],
            ["Era", item.era || "Not set"],
            ["Measurements", measurements || "Not set"],
            ["Value", value],
          ]}
        />

        <DetailPanel
          title="Trade boundaries"
          rows={[
            ["Trade preference", item.tradePreference ? tradePreferenceLabels[item.tradePreference] : "Not set"],
            ["Conversations", communicationPreferenceLabels[item.communicationPreference]],
            ["Photo requests", item.allowsPhotoRequests ? "Allowed" : "Disabled"],
            ["Measurement requests", item.allowsMeasurementRequests ? "Allowed" : "Disabled"],
          ]}
        />

        {item.flaws.length > 0 ? (
          <DetailPanel
            title="Flaws"
            rows={item.flaws.map((flaw, index): [string, string] => [`Flaw ${index + 1}`, flaw])}
          />
        ) : null}

        <AppButton accessibilityLabel="Back to recommendation" onPress={() => router.back()} variant="secondary">
          Back
        </AppButton>
      </ScrollView>
    </Screen>
  );
}

function DetailPanel({ rows, title = "Item details" }: { rows: [string, string][]; title?: string }) {
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
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>{title}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>{label}</Text>
          <Text style={{ color: theme.colors.textPrimary, flex: 1, fontWeight: "700", textAlign: "right" }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
