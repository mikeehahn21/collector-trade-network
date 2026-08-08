import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { SHIRT_SIZES } from "@ctn/constants";
import type { ShirtSize } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { Chip } from "@/components/chip";
import { FormFrame } from "@/components/form-frame";
import { toggleValue } from "@/lib/selection";
import { useOnboardingState } from "@/state/onboarding-state";
import { useTheme } from "@/theme/theme-provider";

export default function SizePreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setSizes, state } = useOnboardingState();
  const [wornSizes, setWornSizes] = useState<ShirtSize[]>(state.wornSizes);
  const [collectedSizes, setCollectedSizes] = useState<ShirtSize[]>(state.collectedSizes);

  function submit() {
    setSizes(wornSizes, collectedSizes);
    router.push("/onboarding/categories");
  }

  return (
    <FormFrame
      progressLabel="STEP 3 OF 8"
      title="Set your size signal."
      subtitle="Vintage sizing is inconsistent, so we separate what you wear from what you collect."
      footer={
        <AppButton
          accessibilityLabel="Continue to category preferences"
          disabled={wornSizes.length === 0 || collectedSizes.length === 0}
          onPress={submit}
        >
          Continue
        </AppButton>
      }
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
        Sizes you wear
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {SHIRT_SIZES.map((size) => (
          <Chip
            key={`worn-${size.value}`}
            label={size.label}
            onPress={() => setWornSizes((current) => toggleValue(current, size.value))}
            selected={wornSizes.includes(size.value)}
          />
        ))}
      </View>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
        Sizes you collect
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {SHIRT_SIZES.map((size) => (
          <Chip
            key={`collected-${size.value}`}
            label={size.label}
            onPress={() => setCollectedSizes((current) => toggleValue(current, size.value))}
            selected={collectedSizes.includes(size.value)}
          />
        ))}
      </View>
    </FormFrame>
  );
}
