import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ITEM_ERAS, SHIRT_SIZES, VINTAGE_CATEGORIES } from "@ctn/constants";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Chip } from "@/components/chip";
import { Screen } from "@/components/screen";
import { getMockAiListingSuggestions } from "@/lib/mock-ai-listing";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";
import { useApiClient } from "@/api/use-api-client";

export default function EditItemScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const api = useApiClient();
  const { getItem, updateItem, upsertItemFromServer } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.textPrimary }}>Item not found.</Text>
      </Screen>
    );
  }
  // Capture narrowed item in a const so closures and JSX see TradeableItem (not TradeableItem | undefined)
  const currentItem = item;

  async function saveDraft() {
    updateItem(currentItem.id, { status: "draft" });
    try {
      const response = currentItem.id.startsWith("item_")
        ? await api.createItem({ ...currentItem, status: "draft" })
        : await api.updateItem(currentItem.id, { ...currentItem, status: "draft" });
      upsertItemFromServer(response.item, currentItem.id);
      router.push(`/inventory/${response.item.id}/save-draft`);
    } catch {
      Alert.alert(
        "Saved locally",
        "We could not reach the server. Your draft remains cached and can sync later.",
      );
      router.push(`/inventory/${currentItem.id}/save-draft`);
    }
  }

  function applyAiSuggestions() {
    const suggestions = getMockAiListingSuggestions(currentItem);
    updateItem(currentItem.id, { aiSuggestions: suggestions });
    Alert.alert(
      "AI suggestions ready",
      "Suggestions were added for review. Nothing was applied automatically.",
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            ITEM BUILDER
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            Shape the item record.
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            The better the record, the better future trade opportunities can become.
          </Text>
        </View>

        <AppButton
          accessibilityLabel="Generate mocked AI suggestions"
          onPress={applyAiSuggestions}
          variant="secondary"
        >
          Generate AI suggestions
        </AppButton>

        {currentItem.aiSuggestions ? (
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
            <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
              Suggestions available
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21 }}>
              Confidence: {currentItem.aiSuggestions.confidence}. Review and apply fields manually.
            </Text>
            <AppButton
              accessibilityLabel="Apply suggested title"
              onPress={() =>
                updateItem(currentItem.id, {
                  title: currentItem.aiSuggestions?.title ?? currentItem.title,
                })
              }
              variant="ghost"
            >
              Apply suggested title
            </AppButton>
          </View>
        ) : null}

        <AppTextField
          label="Title"
          onChangeText={(title) => updateItem(currentItem.id, { title })}
          placeholder="1996 Chicago Bulls championship tee"
          value={currentItem.title}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {VINTAGE_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              onPress={() => updateItem(currentItem.id, { category: category.value })}
              selected={currentItem.category === category.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Size
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {SHIRT_SIZES.map((size) => (
            <Chip
              key={size.value}
              label={size.label}
              onPress={() => updateItem(currentItem.id, { size: size.value })}
              selected={currentItem.size === size.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Era
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {ITEM_ERAS.map((era) => (
            <Chip
              key={era}
              label={era}
              onPress={() => updateItem(currentItem.id, { era })}
              selected={currentItem.era === era}
            />
          ))}
        </View>

        <AppTextField
          label="Tag"
          onChangeText={(tag) => updateItem(currentItem.id, { tag })}
          placeholder="Giant, Screen Stars, Brockum, unknown"
          value={currentItem.tag ?? ""}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Measurements
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Chest"
              onChangeText={(chest) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, chest, unit: "in" },
                })
              }
              placeholder="23 in"
              value={currentItem.measurements.chest ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Length"
              onChangeText={(length) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, length, unit: "in" },
                })
              }
              placeholder="29 in"
              value={currentItem.measurements.length ?? ""}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Shoulder"
              onChangeText={(shoulder) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, shoulder, unit: "in" },
                })
              }
              placeholder="21 in"
              value={currentItem.measurements.shoulder ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Sleeve"
              onChangeText={(sleeve) =>
                updateItem(currentItem.id, {
                  measurements: { ...currentItem.measurements, sleeve, unit: "in" },
                })
              }
              placeholder="8 in"
              value={currentItem.measurements.sleeve ?? ""}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              keyboardType="numeric"
              label="Value min"
              onChangeText={(value) =>
                updateItem(currentItem.id, {
                  estimatedValue: {
                    ...currentItem.estimatedValue,
                    min: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                    currency: "USD",
                  },
                })
              }
              placeholder="120"
              value={currentItem.estimatedValue.min?.toString() ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              keyboardType="numeric"
              label="Value max"
              onChangeText={(value) =>
                updateItem(currentItem.id, {
                  estimatedValue: {
                    ...currentItem.estimatedValue,
                    max: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                    currency: "USD",
                  },
                })
              }
              placeholder="220"
              value={currentItem.estimatedValue.max?.toString() ?? ""}
            />
          </View>
        </View>

        <AppTextField
          label="Trade notes"
          multiline
          numberOfLines={4}
          onChangeText={(tradeNotes) => updateItem(currentItem.id, { tradeNotes })}
          placeholder="What would make you move this piece?"
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={currentItem.tradeNotes ?? ""}
        />

        <View style={{ gap: theme.spacing.md }}>
          <AppButton
            accessibilityLabel="Manage photos"
            onPress={() => router.push(`/inventory/${currentItem.id}/photos`)}
            variant="secondary"
          >
            Manage photos
          </AppButton>
          <AppButton
            accessibilityLabel="Edit condition"
            onPress={() => router.push(`/inventory/${currentItem.id}/condition`)}
            variant="secondary"
          >
            Edit condition and flaws
          </AppButton>
          <AppButton
            accessibilityLabel="Edit trade preferences"
            onPress={() => router.push(`/inventory/${currentItem.id}/trade-preferences`)}
            variant="secondary"
          >
            Trade preferences
          </AppButton>
          <AppButton
            accessibilityLabel="Edit communication settings"
            onPress={() => router.push(`/inventory/${currentItem.id}/communication-settings`)}
            variant="secondary"
          >
            Communication settings
          </AppButton>
          <AppButton accessibilityLabel="Save draft" onPress={() => void saveDraft()}>
            Save draft
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}
