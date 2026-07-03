import { useState } from "react";
import { useRouter } from "expo-router";

import { accessRequestSchema } from "@ctn/validation";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";

export default function ApplyForAccessScreen() {
  const router = useRouter();
  const { setAccess } = useOnboardingState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  function submit() {
    const result = accessRequestSchema.safeParse({
      name,
      email,
      socialHandle: socialHandle.trim() || undefined,
      reason,
    });

    if (!result.success) {
      setError("Add your name, a valid email, and a short note about your vintage background.");
      return;
    }

    setError(undefined);
    setIsLoading(true);
    setTimeout(() => {
      setAccess("applied", { email });
      setIsLoading(false);
      router.replace("/waitlist-confirmation");
    }, 550);
  }

  return (
    <FormFrame
      eyebrow="Apply for access"
      title="Tell us why you belong here."
      subtitle="Applications help us open the network without lowering trust."
      footer={
        <AppButton accessibilityLabel="Submit application" loading={isLoading} onPress={submit}>
          Submit application
        </AppButton>
      }
    >
      <AppTextField label="Name" onChangeText={setName} placeholder="Your name" value={name} />
      <AppTextField
        autoCapitalize="none"
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="you@example.com"
        value={email}
      />
      <AppTextField
        autoCapitalize="none"
        label="Whatnot or Instagram"
        onChangeText={setSocialHandle}
        placeholder="@handle"
        value={socialHandle}
      />
      <AppTextField
        error={error}
        label="Vintage background"
        multiline
        numberOfLines={5}
        onChangeText={setReason}
        placeholder="What do you collect, sell, or trade?"
        style={{ minHeight: 120, textAlignVertical: "top" }}
        value={reason}
      />
    </FormFrame>
  );
}
