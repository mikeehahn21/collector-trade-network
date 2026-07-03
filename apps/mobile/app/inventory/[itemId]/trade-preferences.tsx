import { Switch, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ITEM_VISIBILITY_OPTIONS, TRADE_OFFER_PREFERENCES } from "@ctn/constants";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function ItemTradePreferencesScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getItem, updateItem } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return null;
  }
  // Capture narrowed item so closures/JSX see TradeableItem (not TradeableItem | undefined)
  const currentItem = item;

  return (
    <FormFrame
      eyebrow="Trade settings"
      title="Decide how this piece can move."
      subtitle="Item-level settings let special pieces have stricter boundaries than your default profile."
      footer={
        <AppButton accessibilityLabel="Done editing trade preferences" onPress={() => router.back()}>
          Done
        </AppButton>
      }
    >
      {TRADE_OFFER_PREFERENCES.map((preference) => (
        <ChoiceCard
          description={preference.description}
          key={preference.value}
          label={preference.label}
          onPress={() => updateItem(currentItem.id, { tradePreference: preference.value })}
          selected={currentItem.tradePreference === preference.value}
        />
      ))}

      <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
        Visibility
      </Text>
      {ITEM_VISIBILITY_OPTIONS.map((visibility) => (
        <ChoiceCard
          description={visibility.description}
          key={visibility.value}
          label={visibility.label}
          onPress={() => updateItem(currentItem.id, { visibility: visibility.value })}
          selected={currentItem.visibility === visibility.value}
        />
      ))}

      <AppTextField
        label="Trade notes"
        multiline
        numberOfLines={4}
        onChangeText={(tradeNotes) => updateItem(currentItem.id, { tradeNotes })}
        placeholder="Open to rap tees, XL Harley, or cash-balancing around strong trades."
        style={{ minHeight: 104, textAlignVertical: "top" }}
        value={currentItem.tradeNotes ?? ""}
      />

      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          padding: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
            Mark as reserved
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            Reserved items stay visible but should not be treated as active trade supply.
          </Text>
        </View>
        <Switch
          onValueChange={(enabled) => updateItem(currentItem.id, { status: enabled ? "reserved" : "draft" })}
          thumbColor={currentItem.status === "reserved" ? theme.colors.accent : theme.colors.textSecondary}
          value={currentItem.status === "reserved"}
        />
      </View>
    </FormFrame>
  );
}
