import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { TRADE_OFFER_PREFERENCES } from "@ctn/constants";
import type { TradeOfferPreference } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";
import { useTheme } from "@/theme/theme-provider";

export default function TradePreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setTradePreferences, state } = useOnboardingState();
  const [selected, setSelected] = useState<TradeOfferPreference | undefined>(state.tradePreference);
  const [acceptsCashAdjustments, setAcceptsCashAdjustments] = useState(
    state.acceptsCashAdjustments,
  );

  function submit() {
    if (!selected) {
      return;
    }

    setTradePreferences(selected, acceptsCashAdjustments);
    router.push("/onboarding/communication-preferences");
  }

  return (
    <FormFrame
      progressLabel="STEP 5 OF 8"
      title="Set offer boundaries."
      subtitle="Good boundaries protect serious traders from low-quality offers."
      footer={
        <AppButton
          accessibilityLabel="Continue to communication preferences"
          disabled={!selected}
          onPress={submit}
        >
          Continue
        </AppButton>
      }
    >
      {TRADE_OFFER_PREFERENCES.map((preference) => (
        <ChoiceCard
          description={preference.description}
          key={preference.value}
          label={preference.label}
          onPress={() => setSelected(preference.value)}
          selected={selected === preference.value}
        />
      ))}
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
            Allow cash adjustments
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            Cash can balance trades, but cash-only offers are not supported.
          </Text>
        </View>
        <Switch
          onValueChange={setAcceptsCashAdjustments}
          thumbColor={acceptsCashAdjustments ? theme.colors.accent : theme.colors.textSecondary}
          value={acceptsCashAdjustments}
        />
      </View>
    </FormFrame>
  );
}
