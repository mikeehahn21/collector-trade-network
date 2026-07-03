import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useOnboardingState } from "@/state/onboarding-state";

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingState();

  function finish() {
    completeOnboarding();
    router.replace("/home");
  }

  return (
    <FormFrame
      progressLabel="STEP 8 OF 8"
      title="Your trade profile is ready."
      subtitle="Next, we will help you add tradeable inventory and wishlist signals. For Sprint 1, you will land on the empty Home dashboard."
      footer={
        <AppButton accessibilityLabel="Enter home dashboard" onPress={finish}>
          Enter Collector Trade
        </AppButton>
      }
    >
      <ScreenState
        message="Your early preferences are saved. The app can now personalize your first-time checklist."
        title="Onboarding complete"
        tone="success"
      />
    </FormFrame>
  );
}
