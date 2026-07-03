import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { COMMUNICATION_PREFERENCES } from "@ctn/constants";
import type { CommunicationPreference } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";
import { useTheme } from "@/theme/theme-provider";

export default function CommunicationPreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setCommunicationPreferences, state } = useOnboardingState();
  const [selected, setSelected] = useState<CommunicationPreference | undefined>(
    state.communicationPreference,
  );
  const [allowsPhotoRequests, setAllowsPhotoRequests] = useState(state.allowsPhotoRequests);
  const [allowsMeasurementRequests, setAllowsMeasurementRequests] = useState(
    state.allowsMeasurementRequests,
  );

  function submit() {
    if (!selected) {
      return;
    }

    setCommunicationPreferences(selected, allowsPhotoRequests, allowsMeasurementRequests);
    router.push("/onboarding/notifications");
  }

  return (
    <FormFrame
      progressLabel="STEP 6 OF 8"
      title="Control item conversations."
      subtitle="Collectors can ask questions, but every message must stay attached to an item, trade, or system update."
      footer={
        <AppButton
          accessibilityLabel="Continue to notification permissions"
          disabled={!selected}
          onPress={submit}
        >
          Continue
        </AppButton>
      }
    >
      {COMMUNICATION_PREFERENCES.map((preference) => (
        <ChoiceCard
          description={preference.description}
          key={preference.value}
          label={preference.label}
          onPress={() => setSelected(preference.value)}
          selected={selected === preference.value}
        />
      ))}
      {[
        {
          label: "Allow photo requests",
          value: allowsPhotoRequests,
          onValueChange: setAllowsPhotoRequests,
        },
        {
          label: "Allow measurement requests",
          value: allowsMeasurementRequests,
          onValueChange: setAllowsMeasurementRequests,
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
          <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
            {setting.label}
          </Text>
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
