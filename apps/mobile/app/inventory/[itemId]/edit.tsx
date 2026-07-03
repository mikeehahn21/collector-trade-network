import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ITEM_ERAS, SHIRT_SIZES, VINTAGE_CATEGORIES } from "@ctn/constants";
import type { ShirtSize, VintageCategory } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Chip } from "@/components/chip";
import { Screen } from "@/components/screen";
import { getMockAiListingSuggestions } from "@/lib/mock-ai-listing";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

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

  async function saveDraft() {
    updateItem(item.id, { status: "draft" });
    try {
      const response = item.id.startsWith("item_")
        ? await api.createItem({ ...item, status: "draft" })
        : await api.updateItem(item.id, { ...item, status: "draft" });
      upsertItemFromServer(response.item, item.id);
      router.push(`/inventory/${response.item.id}/save-draft`);
    } catch {
      Alert.alert(
        "Saved locally",
        "We could not reach the server. Your draft remains cached and can sync later.",
      );
      router.push(`/inventory/${item.id}/save-draft`);
    }
  }

  function applyAiSuggestions() {
    const suggestions = getMockAiListingSuggestions(item);
    updateItem(item.id, { aiSuggestions: suggestions });
    Alert.alert(
      "AI suggestions ready",
      "Suggestions were added for review. Nothing was applied automatically.",
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
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

        {item.aiSuggestions ? (
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
              Confidence: {item.aiSuggestions.confidence}. Review and apply fields manually.
            </Text>
            <AppButton
              accessibilityLabel="Apply suggested title"
              onPress={() => updateItem(item.id, { title: item.aiSuggestions?.title ?? item.title })}
              variant="ghost"
            >
              Apply suggested title
            </AppButton>
          </View>
        ) : null}

        <AppTextField
          label="Title"
          onChangeText={(title) => updateItem(item.id, { title })}
          placeholder="1996 Chicago Bulls championship tee"
          value={item.title}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {VINTAGE_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              onPress={() => updateItem(item.id, { category: category.value as VintageCategory })}
              selected={item.category === category.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Size</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {SHIRT_SIZES.map((size) => (
            <Chip
              key={size.value}
              label={size.label}
              onPress={() => updateItem(item.id, { size: size.value as ShirtSize })}
              selected={item.size === size.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Era</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {ITEM_ERAS.map((era) => (
            <Chip
              key={era}
              label={era}
              onPress={() => updateItem(item.id, { era })}
              selected={item.era === era}
            />
          ))}
        </View>

        <AppTextField
          label="Tag"
          onChangeText={(tag) => updateItem(item.id, { tag })}
          placeholder="Giant, Screen Stars, Brockum, unknown"
          value={item.tag ?? ""}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Measurements
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Chest"
              onChangeText={(chest) =>
                updateItem(item.id, { measurements: { ...item.measurements, chest, unit: "in" } })
              }
              placeholder="23 in"
              value={item.measurements.chest ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Length"
              onChangeText={(length) =>
                updateItem(item.id, { measurements: { ...item.measurements, length, unit: "in" } })
              }
              placeholder="29 in"
              value={item.measurements.length ?? ""}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Shoulder"
              onChangeText={(shoulder) =>
                updateItem(item.id, { measurements: { ...item.measurements, shoulder, unit: "in" } })
              }
              placeholder="21 in"
              value={item.measurements.shoulder ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              label="Sleeve"
              onChangeText={(sleeve) =>
                updateItem(item.id, { measurements: { ...item.measurements, sleeve, unit: "in" } })
              }
              placeholder="8 in"
              value={item.measurements.sleeve ?? ""}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppTextField
              keyboardType="numeric"
              label="Value min"
              onChangeText={(value) =>
                updateItem(item.id, {
                  estimatedValue: {
                    ...item.estimatedValue,
                    min: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                    currency: "USD",
                  },
                })
              }
              placeholder="120"
              value={item.estimatedValue.min?.toString() ?? ""}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextField
              keyboardType="numeric"
              label="Value max"
              onChangeText={(value) =>
                updateItem(item.id, {
                  estimatedValue: {
                    ...item.estimatedValue,
                    max: value && Number.isFinite(Number(value)) ? Number(value) : undefined,
                    currency: "USD",
                  },
                })
              }
              placeholder="220"
              value={item.estimatedValue.max?.toString() ?? ""}
            />
          </View>
        </View>

        <AppTextField
          label="Trade notes"
          multiline
          numberOfLines={4}
          onChangeText={(tradeNotes) => updateItem(item.id, { tradeNotes })}
          placeholder="What would make you move this piece?"
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={item.tradeNotes ?? ""}
        />

        <View style={{ gap: theme.spacing.md }}>
          <AppButton
            accessibilityLabel="Manage photos"
            onPress={() => router.push(`/inventory/${item.id}/photos`)}
            variant="secondary"
          >
            Manage photos
          </AppButton>
          <AppButton
            accessibilityLabel="Edit condition"
            onPress={() => router.push(`/inventory/${item.id}/condition`)}
            variant="secondary"
          >
            Edit condition and flaws
          </AppButton>
          <AppButton
            accessibilityLabel="Edit trade preferences"
            onPress={() => router.push(`/inventory/${item.id}/trade-preferences`)}
            variant="secondary"
          >
            Trade preferences
          </AppButton>
          <AppButton
            accessibilityLabel="Edit communication settings"
            onPress={() => router.push(`/inventory/${item.id}/communication-settings`)}
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
import { useApiClient } from "@/api/use-api-client";
