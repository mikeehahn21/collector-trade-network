import { useState } from "react";
import { useRouter } from "expo-router";

import { COLLECTOR_TYPES } from "@ctn/constants";
import type { CollectorType } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";

export default function CollectorTypeScreen() {
  const router = useRouter();
  const { setCollectorType, state } = useOnboardingState();
  const [selected, setSelected] = useState<CollectorType | undefined>(state.collectorType);

  function submit() {
    if (!selected) {
      return;
    }

    setCollectorType(selected);
    router.push("/onboarding/sizes");
  }

  return (
    <FormFrame
      progressLabel="STEP 2 OF 8"
      title="How do you participate?"
      subtitle="This tunes trade recommendations and early trust signals."
      footer={
        <AppButton accessibilityLabel="Continue to size preferences" disabled={!selected} onPress={submit}>
          Continue
        </AppButton>
      }
    >
      {COLLECTOR_TYPES.map((type) => (
        <ChoiceCard
          description={type.description}
          key={type.value}
          label={type.label}
          onPress={() => setSelected(type.value)}
          selected={selected === type.value}
        />
      ))}
    </FormFrame>
  );
}
