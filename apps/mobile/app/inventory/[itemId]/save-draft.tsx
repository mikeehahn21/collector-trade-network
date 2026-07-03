import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";

export default function SaveDraftScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();

  return (
    <FormFrame
      eyebrow="Draft saved"
      title="Your item is safe."
      subtitle="Come back when you have photos, condition details, or trade boundaries ready."
      footer={
        <>
          <AppButton
            accessibilityLabel="Continue editing draft"
            onPress={() => router.replace(`/inventory/${itemId}/edit`)}
          >
            Continue editing
          </AppButton>
          <AppButton
            accessibilityLabel="Back to inventory"
            onPress={() => router.replace("/inventory")}
            variant="secondary"
          >
            Back to inventory
          </AppButton>
        </>
      }
    >
      <ScreenState
        message="Drafts do not appear as tradeable supply until you publish them."
        title="Saved as draft"
        tone="success"
      />
    </FormFrame>
  );
}
