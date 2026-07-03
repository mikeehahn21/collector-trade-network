import { useState } from "react";
import { useRouter } from "expo-router";

import { createAccountSchema } from "@ctn/validation";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { useAuthSession } from "@/auth/use-auth-session";
import { useOnboardingState } from "@/state/onboarding-state";

export default function CreateAccountScreen() {
  const router = useRouter();
  const auth = useAuthSession();
  const { setAccess } = useOnboardingState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    const result = createAccountSchema.safeParse({ email, password });

    if (!result.success) {
      setError("Use a valid email and a password with at least 8 characters.");
      return;
    }

    setError(undefined);
    setIsLoading(true);
    const authResult = await auth.createAccount(email, password);
    setIsLoading(false);

    if (!authResult.ok) {
      setError(authResult.message ?? "Unable to create account.");
      return;
    }

    setAccess("approved", { email });
    router.push("/verification");
  }

  return (
    <FormFrame
      eyebrow="Create account"
      title="Secure your beta access."
      subtitle="Use the email associated with your invite or approved application."
      footer={
        <AppButton
          accessibilityLabel="Continue to verification"
          loading={isLoading}
          onPress={() => void submit()}
        >
          Continue
        </AppButton>
      }
    >
      <AppTextField
        autoCapitalize="none"
        autoComplete="email"
        error={error}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="you@example.com"
        value={email}
      />
      <AppTextField
        autoCapitalize="none"
        label="Password"
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        value={password}
      />
    </FormFrame>
  );
}
