import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";

export default function WaitlistConfirmationScreen() {
  const router = useRouter();

  return (
    <FormFrame
      eyebrow="Application received"
      title="You are on the access list."
      subtitle="We review early members manually to protect trade quality."
      footer={
        <AppButton accessibilityLabel="Return to welcome" onPress={() => router.replace("/welcome")}>
          Done
        </AppButton>
      }
    >
      <ScreenState
        message="If approved, you will receive an invite tied to your account email. This launch mode is temporary; the access system is designed to open over time."
        title="Pending review"
        tone="warning"
      />
    </FormFrame>
  );
}
