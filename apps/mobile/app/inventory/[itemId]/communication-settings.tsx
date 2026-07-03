import { Switch, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { COMMUNICATION_PREFERENCES } from "@ctn/constants";
import { AppButton } from "@/components/app-button";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function ItemCommunicationSettingsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getItem, updateItem } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return null;
  }

  return (
    <FormFrame
      eyebrow="Communication"
      title="Control item questions."
      subtitle="Conversations are useful, but they must stay attached to this item."
      footer={
        <AppButton accessibilityLabel="Done editing communication settings" onPress={() => router.back()}>
          Done
        </AppButton>
      }
    >
      {COMMUNICATION_PREFERENCES.map((preference) => (
        <ChoiceCard
          description={preference.description}
          key={preference.value}
          label={preference.label}
          onPress={() =>
            updateItem(item.id, { communicationPreference: preference.value })
          }
          selected={item.communicationPreference === preference.value}
        />
      ))}

      {[
        {
          label: "Allow photo requests",
          description: "Collectors can ask for tag, flaw, or detail photos.",
          value: item.allowsPhotoRequests,
          onValueChange: (allowsPhotoRequests: boolean) => updateItem(item.id, { allowsPhotoRequests }),
        },
        {
          label: "Allow measurement requests",
          description: "Collectors can ask for pit-to-pit, length, shoulder, or sleeve details.",
          value: item.allowsMeasurementRequests,
          onValueChange: (allowsMeasurementRequests: boolean) =>
            updateItem(item.id, { allowsMeasurementRequests }),
        },
      ].map((setting) => (
        <View
          key={setting.label}
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
              {setting.label}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              {setting.description}
            </Text>
          </View>
          <Switch
            onValueChange={setting.onValueChange}
            thumbColor={setting.value ? theme.colors.accent : theme.colors.textSecondary}
            value={setting.value}
          />
        </View>
      ))}
    </FormFrame>
  );
}
