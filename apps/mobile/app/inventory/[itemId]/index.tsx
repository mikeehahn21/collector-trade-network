import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { useApiClient } from "@/api/use-api-client";
import { Screen } from "@/components/screen";
import {
  categoryLabels,
  communicationPreferenceLabels,
  conditionLabels,
  sizeLabels,
  statusLabels,
  tradePreferenceLabels,
  visibilityLabels,
} from "@/lib/item-display";
import { getPublishCheck } from "@/lib/item-validation";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const api = useApiClient();
  const { getItem, publishItem, upsertItemFromServer } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            Item not found
          </Text>
          <AppButton accessibilityLabel="Back to inventory" onPress={() => router.replace("/inventory")}>
            Back to inventory
          </AppButton>
        </View>
      </Screen>
    );
  }

  const publishCheck = getPublishCheck(item);
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
    .join(" · ");

  async function publish() {
    if (!publishCheck.isValid) {
      Alert.alert("Before publishing", `Complete: ${publishCheck.missing.join(", ")}`);
      return;
    }

    try {
      const response = item.id.startsWith("item_")
        ? await api.publishItem({ ...item, status: "tradeable" })
        : await api.updateItem(item.id, { ...item, status: "tradeable" });
      upsertItemFromServer(response.item, item.id);
      router.push(`/inventory/${response.item.id}/publish-confirmation`);
    } catch {
      publishItem(item.id);
      Alert.alert(
        "Published locally",
        "Server sync failed. The item remains cached and should be synced before recommendations use it.",
      );
      router.push(`/inventory/${item.id}/publish-confirmation`);
    }
  }

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
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            {statusLabels[item.status]}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            {item.title || "Untitled draft"}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {item.category ? categoryLabels[item.category] : "No category"} ·{" "}
            {item.size ? sizeLabels[item.size] : "No size"}
          </Text>
        </View>

        <DetailPanel
          rows={[
            ["Condition", item.condition ? conditionLabels[item.condition] : "Not set"],
            ["Tag", item.tag || "Not set"],
            ["Era", item.era || "Not set"],
            ["Measurements", measurements || "Not set"],
            ["Value", value],
            ["Visibility", visibilityLabels[item.visibility]],
          ]}
        />

        <DetailPanel
          title="Trade and communication"
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

        <View style={{ gap: theme.spacing.md }}>
          <AppButton accessibilityLabel="Edit item" onPress={() => router.push(`/inventory/${item.id}/edit`)}>
            Edit item
          </AppButton>
          <AppButton
            accessibilityLabel="Manage photos"
            onPress={() => router.push(`/inventory/${item.id}/photos`)}
            variant="secondary"
          >
            Manage photos
          </AppButton>
          <AppButton
            accessibilityLabel="Publish item"
            disabled={item.status === "tradeable"}
            onPress={() => void publish()}
            variant="secondary"
          >
            Publish as Tradeable
          </AppButton>
          <AppButton
            accessibilityLabel="Archive item"
            onPress={() => router.push(`/inventory/${item.id}/archive`)}
            variant="ghost"
          >
            Archive or delete
          </AppButton>
        </View>
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
