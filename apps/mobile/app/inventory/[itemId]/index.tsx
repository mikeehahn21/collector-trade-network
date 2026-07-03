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
  const { getItem, publishItem, updateItem, upsertItemFromServer } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: "900" }}>
            Item not found
          </Text>
          <AppButton
            accessibilityLabel="Back to inventory"
            onPress={() => router.replace("/inventory")}
          >
            Back to inventory
          </AppButton>
        </View>
      </Screen>
    );
  }
  // Capture narrowed item so closures and JSX see TradeableItem (not TradeableItem | undefined)
  const currentItem = item;

  const publishCheck = getPublishCheck(currentItem);
  const value =
    currentItem.estimatedValue.min || currentItem.estimatedValue.max
      ? `$${currentItem.estimatedValue.min ?? "?"} - $${currentItem.estimatedValue.max ?? "?"}`
      : "Not estimated";
  const measurements = [
    currentItem.measurements.chest ? `Chest ${currentItem.measurements.chest}` : undefined,
    currentItem.measurements.length ? `Length ${currentItem.measurements.length}` : undefined,
    currentItem.measurements.shoulder ? `Shoulder ${currentItem.measurements.shoulder}` : undefined,
    currentItem.measurements.sleeve ? `Sleeve ${currentItem.measurements.sleeve}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  async function publish() {
    if (!publishCheck.isValid) {
      Alert.alert("Before publishing", `Complete: ${publishCheck.missing.join(", ")}`);
      return;
    }

    try {
      const response = currentItem.id.startsWith("item_")
        ? await api.publishItem({ ...currentItem, status: "tradeable" })
        : await api.updateItem(currentItem.id, { ...currentItem, status: "tradeable" });
      upsertItemFromServer(response.item, currentItem.id);
      router.push(`/inventory/${response.item.id}/publish-confirmation`);
    } catch {
      publishItem(currentItem.id);
      Alert.alert(
        "Published locally",
        "Server sync failed. The item remains cached and should be synced before recommendations use it.",
      );
      router.push(`/inventory/${currentItem.id}/publish-confirmation`);
    }
  }

  async function refreshVerificationStatus() {
    try {
      const response = await api.getItemVerificationStatus(currentItem.id);
      updateItem(currentItem.id, {
        verificationVideoUrl: response.item.verificationVideoUrl,
        verificationStatus: response.item.verificationStatus,
        verificationFailedReason: response.item.verificationFailedReason,
        verifiedAt: response.item.verifiedAt,
        aiMetadata: response.item.aiMetadata,
      });
    } catch {
      Alert.alert("Verification unavailable", "Verification status could not be refreshed.");
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
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
            {currentItem.photos.length > 0
              ? `${currentItem.photos.length} photos`
              : "No photos yet"}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            {statusLabels[currentItem.status]}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            {currentItem.title || "Untitled draft"}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            {currentItem.category ? categoryLabels[currentItem.category] : "No category"} ·{" "}
            {currentItem.size ? sizeLabels[currentItem.size] : "No size"}
          </Text>
        </View>

        <VerificationPanel
          failedReason={currentItem.verificationFailedReason}
          onRefresh={() => void refreshVerificationStatus()}
          onVerify={() => router.push(`/inventory/${currentItem.id}/verify`)}
          status={currentItem.verificationStatus ?? "pending"}
          verifiedAt={currentItem.verifiedAt}
        />

        <DetailPanel
          rows={[
            [
              "Condition",
              currentItem.condition ? conditionLabels[currentItem.condition] : "Not set",
            ],
            ["Tag", currentItem.tag || "Not set"],
            ["Era", currentItem.era || "Not set"],
            ["Measurements", measurements || "Not set"],
            ["Value", value],
            ["Visibility", visibilityLabels[currentItem.visibility]],
          ]}
        />

        <DetailPanel
          title="Trade and communication"
          rows={[
            [
              "Trade preference",
              currentItem.tradePreference
                ? tradePreferenceLabels[currentItem.tradePreference]
                : "Not set",
            ],
            ["Conversations", communicationPreferenceLabels[currentItem.communicationPreference]],
            ["Photo requests", currentItem.allowsPhotoRequests ? "Allowed" : "Disabled"],
            [
              "Measurement requests",
              currentItem.allowsMeasurementRequests ? "Allowed" : "Disabled",
            ],
          ]}
        />

        {currentItem.flaws.length > 0 ? (
          <DetailPanel
            title="Flaws"
            rows={currentItem.flaws.map((flaw, index): [string, string] => [
              `Flaw ${index + 1}`,
              flaw,
            ])}
          />
        ) : null}

        <View style={{ gap: theme.spacing.md }}>
          <AppButton
            accessibilityLabel="Edit item"
            onPress={() => router.push(`/inventory/${currentItem.id}/edit`)}
          >
            Edit item
          </AppButton>
          <AppButton
            accessibilityLabel="Manage photos"
            onPress={() => router.push(`/inventory/${currentItem.id}/photos`)}
            variant="secondary"
          >
            Manage photos
          </AppButton>
          <AppButton
            accessibilityLabel="Verify item"
            onPress={() => router.push(`/inventory/${currentItem.id}/verify`)}
            variant="secondary"
          >
            Verify Item
          </AppButton>
          <AppButton
            accessibilityLabel="Publish item"
            disabled={currentItem.status === "tradeable"}
            onPress={() => void publish()}
            variant="secondary"
          >
            Publish as Tradeable
          </AppButton>
          <AppButton
            accessibilityLabel="Archive item"
            onPress={() => router.push(`/inventory/${currentItem.id}/archive`)}
            variant="ghost"
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
  title = "Item details",
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

function VerificationPanel({
  failedReason,
  onRefresh,
  onVerify,
  status,
  verifiedAt,
}: {
  failedReason?: string | undefined;
  onRefresh: () => void;
  onVerify: () => void;
  status: "pending" | "verified" | "failed";
  verifiedAt?: string | undefined;
}) {
  const theme = useTheme();
  const title =
    status === "verified"
      ? "CTN Verified"
      : status === "failed"
        ? "Verification failed"
        : "Review in progress";
  const message =
    status === "verified"
      ? `Verified${verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ""}. This item can appear in collector discovery.`
      : status === "failed"
        ? (failedReason ??
          "AI review could not verify the item. Re-record a clearer proof-of-life video.")
        : "This item will stay hidden from public discovery until AI review verifies it.";

  return (
    <View
      style={{
        backgroundColor: status === "verified" ? theme.colors.accentMuted : theme.colors.surface,
        borderColor: status === "verified" ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
        {title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
        {message}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <AppButton
          accessibilityLabel="Refresh verification status"
          onPress={onRefresh}
          variant="secondary"
        >
          Refresh Status
        </AppButton>
        {status !== "verified" ? (
          <AppButton accessibilityLabel="Start item verification" onPress={onVerify}>
            {status === "failed" ? "Re-verify Item" : "Start Verification"}
          </AppButton>
        ) : null}
      </View>
    </View>
  );
}
