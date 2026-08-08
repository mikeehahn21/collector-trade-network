import { useState } from "react";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { ChoiceCard } from "@/components/choice-card";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { setNotifications, state } = useOnboardingState();
  const [enabled, setEnabled] = useState(state.notificationsEnabled);

  function submit() {
    setNotifications(enabled);
    router.push("/onboarding/complete");
  }

  return (
    <FormFrame
      progressLabel="STEP 7 OF 8"
      title="Choose signal over noise."
      subtitle="We only want to notify you when there is a real trade opportunity or action required."
      footer={
        <AppButton accessibilityLabel="Continue to onboarding completion" onPress={submit}>
          Continue
        </AppButton>
      }
    >
      <ChoiceCard
        description="Trade offers, accepted offers, shipping actions, and high-confidence wishlist matches."
        label="Enable high-signal notifications"
        onPress={() => setEnabled(true)}
        selected={enabled}
      />
      <ChoiceCard
        description="You can turn notifications on later from settings."
        label="Not now"
        onPress={() => setEnabled(false)}
        selected={!enabled}
      />
    </FormFrame>
  );
}
