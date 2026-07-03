import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { loginSchema } from "@ctn/validation";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { useAuthSession } from "@/auth/use-auth-session";
import { useOnboardingState } from "@/state/onboarding-state";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuthSession();
  const { isOnboardingComplete, setAccess } = useOnboardingState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      setError("Enter the email and password connected to your invite.");
      return;
    }

    setError(undefined);
    setIsLoading(true);
    const authResult = await auth.login(email, password);
    setIsLoading(false);

    if (!authResult.ok) {
      setError(authResult.message ?? "Unable to log in.");
      return;
    }

    setAccess("approved", { email });
    router.replace(isOnboardingComplete ? "/home" : "/onboarding/profile");
  }

  return (
    <FormFrame
      eyebrow="Member access"
      title="Welcome back."
      subtitle="Log in to continue your collector profile."
      footer={
        <>
          <AppButton accessibilityLabel="Log in" loading={isLoading} onPress={() => void submit()}>
            Log in
          </AppButton>
          <AppButton
            accessibilityLabel="Create account"
            onPress={() => router.push("/create-account")}
            variant="ghost"
          >
            Create account instead
          </AppButton>
        </>
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
        onSubmitEditing={() => void submit()}
        placeholder="Your password"
        secureTextEntry
        value={password}
      />
      <AppButton
        accessibilityLabel="Forgot password"
        onPress={() => Alert.alert("Password reset", "Password reset should be handled through Clerk.")}
        variant="ghost"
      >
        Forgot password?
      </AppButton>
    </FormFrame>
  );
}
