import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ITEM_CONDITIONS } from "@ctn/constants";
import type { ItemCondition } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function ConditionEditorScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getItem, updateItem } = useCollectionState();
  const item = getItem(itemId);
  const [flawDraft, setFlawDraft] = useState("");

  if (!item) {
    return null;
  }

  function addFlaw() {
    const flaw = flawDraft.trim();
    if (!flaw) {
      return;
    }
    updateItem(item.id, { flaws: [...item.flaws, flaw] });
    setFlawDraft("");
  }

  return (
    <FormFrame
      eyebrow="Condition"
      title="Be precise about wear."
      subtitle="Honest condition protects trust and prevents future disputes."
      footer={
        <AppButton accessibilityLabel="Done editing condition" onPress={() => router.back()}>
          Done
        </AppButton>
      }
    >
      {ITEM_CONDITIONS.map((condition) => (
        <ChoiceCard
          description={condition.description}
          key={condition.value}
          label={condition.label}
          onPress={() => updateItem(item.id, { condition: condition.value as ItemCondition })}
          selected={item.condition === condition.value}
        />
      ))}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppTextField
            label="Add flaw"
            onChangeText={setFlawDraft}
            placeholder="Small pinhole near hem"
            value={flawDraft}
          />
        </View>
        <View style={{ justifyContent: "flex-end" }}>
          <AppButton accessibilityLabel="Add flaw" onPress={addFlaw} variant="secondary">
            Add
          </AppButton>
        </View>
      </View>
      {item.flaws.map((flaw, index) => (
        <View
          key={`${flaw}-${index}`}
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            flexDirection: "row",
            gap: theme.spacing.md,
            justifyContent: "space-between",
            padding: theme.spacing.md,
          }}
        >
          <Text style={{ color: theme.colors.textPrimary, flex: 1 }}>{flaw}</Text>
          <AppButton
            accessibilityLabel={`Remove flaw ${index + 1}`}
            onPress={() =>
              updateItem(item.id, { flaws: item.flaws.filter((_, flawIndex) => flawIndex !== index) })
            }
            variant="ghost"
          >
            Remove
          </AppButton>
        </View>
      ))}
    </FormFrame>
  );
}
