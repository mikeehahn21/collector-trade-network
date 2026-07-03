import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";

export default function PendingApprovalScreen() {
  const router = useRouter();

  return (
    <FormFrame
      eyebrow="Approval required"
      title="Your account is under review."
      subtitle="We are keeping the first trading cohort intentionally curated."
      footer={
        <AppButton
          accessibilityLabel="Return to welcome"
          onPress={() => router.replace("/welcome")}
        >
          Back to welcome
        </AppButton>
      }
    >
      <ScreenState
        message="You will be able to complete onboarding after approval. This screen is ready for the real access state once authentication is connected."
        title="Pending approval"
        tone="warning"
      />
    </FormFrame>
  );
}
