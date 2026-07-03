import { useState } from "react";
import { useRouter } from "expo-router";

import { onboardingProfileSchema } from "@ctn/validation";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { FormFrame } from "@/components/form-frame";
import { useOnboardingState } from "@/state/onboarding-state";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { setProfile, state } = useOnboardingState();
  const [displayName, setDisplayName] = useState(state.profile?.displayName ?? "");
  const [locationRegion, setLocationRegion] = useState(state.profile?.locationRegion ?? "");
  const [bio, setBio] = useState(state.profile?.bio ?? "");
  const [socialHandle, setSocialHandle] = useState(state.profile?.socialHandle ?? "");
  const [error, setError] = useState<string>();

  function submit() {
    const result = onboardingProfileSchema.safeParse({
      displayName,
      locationRegion,
      bio: bio.trim() || undefined,
      socialHandle: socialHandle.trim() || undefined,
    });

    if (!result.success) {
      setError("Add a display name and region so other collectors know who they are trading with.");
      return;
    }

    setProfile(result.data);
    router.push("/onboarding/collector-type");
  }

  return (
    <FormFrame
      progressLabel="STEP 1 OF 8"
      title="Build your collector identity."
      subtitle="Trust starts with a real profile. Keep it concise and recognizable to people in the vintage community."
      footer={
        <AppButton accessibilityLabel="Continue to collector type" onPress={submit}>
          Continue
        </AppButton>
      }
    >
      <AppTextField
        error={error}
        label="Display name"
        onChangeText={setDisplayName}
        placeholder="Michael H."
        value={displayName}
      />
      <AppTextField
        label="Region"
        onChangeText={setLocationRegion}
        placeholder="New York, NY"
        value={locationRegion}
      />
      <AppTextField
        autoCapitalize="none"
        label="Whatnot or Instagram"
        onChangeText={setSocialHandle}
        placeholder="@handle"
        value={socialHandle}
      />
      <AppTextField
        label="Short collector bio"
        multiline
        numberOfLines={4}
        onChangeText={setBio}
        placeholder="Rap tees, Harley, and 90s sports. Open to serious trades."
        style={{ minHeight: 104, textAlignVertical: "top" }}
        value={bio}
      />
    </FormFrame>
  );
}
