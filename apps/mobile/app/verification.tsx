import { useState } from "react";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { useAuthSession } from "@/auth/use-auth-session";
import { useOnboardingState } from "@/state/onboarding-state";

export default function VerificationScreen() {
  const router = useRouter();
  const auth = useAuthSession();
  const { setAccess, state } = useOnboardingState();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit verification code. Use 123456 in Sprint 1.");
      return;
    }

    setError(undefined);
    setIsLoading(true);
    const authResult = await auth.verifyEmail(code.trim());
    setIsLoading(false);

    if (!authResult.ok) {
      setError(authResult.message ?? "Invalid verification code.");
      return;
    }

    setAccess("approved", state.email ? { email: state.email } : undefined);
    router.replace("/onboarding/profile");
  }

  return (
    <FormFrame
      eyebrow="Verification"
      title="Confirm your account."
      subtitle="Verification is mocked for Sprint 1. Enter 123456 to continue."
      footer={
        <AppButton accessibilityLabel="Verify account" loading={isLoading} onPress={() => void submit()}>
          Verify account
        </AppButton>
      }
    >
      <AppTextField
        error={error}
        keyboardType="number-pad"
        label="Verification code"
        maxLength={6}
        onChangeText={setCode}
        onSubmitEditing={() => void submit()}
        placeholder="123456"
        value={code}
      />
    </FormFrame>
  );
}
