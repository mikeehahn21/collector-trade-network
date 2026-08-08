import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useApiClient } from "@/api/use-api-client";
import { useOnboardingState } from "@/state/onboarding-state";

export default function WaitlistConfirmationScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { state } = useOnboardingState();
  const email = state.email;
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);

  useEffect(() => {
    if (email) {
      api
        .getWaitlistStatus(email)
        .then((res) => {
          setPosition(res.position);
          setEstimatedDays(res.estimatedWaitDays ?? null);
        })
        .catch(() => {
          // Silent catch for waitlist fetch
        });
    }
  }, [api, email]);

  return (
    <FormFrame
      eyebrow="Waitlist joined"
      title="You're on the list."
      subtitle="We are gradually opening the network to maintain trade quality."
      footer={
        <AppButton
          accessibilityLabel="Return to welcome"
          onPress={() => router.replace("/welcome")}
        >
          Done
        </AppButton>
      }
    >
      <ScreenState
        message={
          position
            ? `You are #${position} on the waitlist. We estimate you'll be invited in about ${estimatedDays} days.`
            : "You will receive an invite tied to your account email when your spot opens up."
        }
        title={position ? `Position #${position}` : "Pending invite"}
        tone="warning"
      />
    </FormFrame>
  );
}
