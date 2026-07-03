import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { VINTAGE_CATEGORIES } from "@ctn/constants";
import type { VintageCategory } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { Chip } from "@/components/chip";
import { FormFrame } from "@/components/form-frame";
import { toggleValue } from "@/lib/selection";
import { useOnboardingState } from "@/state/onboarding-state";
import { useTheme } from "@/theme/theme-provider";

export default function CategoryPreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setCategories, state } = useOnboardingState();
  const [categories, setLocalCategories] = useState<VintageCategory[]>(state.categories);
  const isValid = categories.length >= 3 && categories.length <= 8;

  function submit() {
    if (!isValid) {
      return;
    }

    setCategories(categories);
    router.push("/onboarding/trade-preferences");
  }

  return (
    <FormFrame
      progressLabel="STEP 4 OF 8"
      title="Choose your lanes."
      subtitle="Pick 3 to 8 categories so recommendations start focused instead of noisy."
      footer={
        <AppButton
          accessibilityLabel="Continue to trade preferences"
          disabled={!isValid}
          onPress={submit}
        >
          Continue
        </AppButton>
      }
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {VINTAGE_CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            label={category.label}
            onPress={() => setLocalCategories((current) => toggleValue(current, category.value))}
            selected={categories.includes(category.value)}
          />
        ))}
      </View>
      <Text style={{ color: isValid ? theme.colors.success : theme.colors.textSecondary, fontSize: 14 }}>
        {categories.length}/8 selected. Minimum 3.
      </Text>
    </FormFrame>
  );
}
