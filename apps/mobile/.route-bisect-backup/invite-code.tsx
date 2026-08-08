import { useState } from "react";
import { useRouter } from "expo-router";

import { inviteCodeSchema } from "@ctn/validation";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useOnboardingState } from "@/state/onboarding-state";

export default function InviteCodeScreen() {
  const router = useRouter();
  const { setAccess } = useOnboardingState();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function submit() {
    const result = inviteCodeSchema.safeParse({ code });

    if (!result.success) {
      setError("Enter a valid invite code.");
      return;
    }

    setError(undefined);
    setIsLoading(true);
    setTimeout(() => {
      setAccess("invited", { inviteCode: code.trim().toUpperCase() });
      setAccepted(true);
      setIsLoading(false);
    }, 500);
  }

  return (
    <FormFrame
      eyebrow="Private beta"
      title="Enter your invite."
      subtitle="Invites protect the early trade graph and keep the first collector cohort high-signal."
      footer={
        <>
          <AppButton
            accessibilityLabel={accepted ? "Create account" : "Verify invite"}
            loading={isLoading}
            onPress={accepted ? () => router.push("/create-account") : submit}
          >
            {accepted ? "Create account" : "Verify invite"}
          </AppButton>
          <AppButton
            accessibilityLabel="Apply for access"
            onPress={() => router.push("/apply")}
            variant="ghost"
          >
            Need an invite?
          </AppButton>
        </>
      }
    >
      <AppTextField
        autoCapitalize="characters"
        error={error}
        label="Invite code"
        onChangeText={setCode}
        onSubmitEditing={submit}
        placeholder="FOUNDERS-CLUB"
        value={code}
      />
      {accepted ? (
        <ScreenState
          message="Your invite is valid. Create your account to continue onboarding."
          title="Invite accepted"
          tone="success"
        />
      ) : null}
    </FormFrame>
  );
}
