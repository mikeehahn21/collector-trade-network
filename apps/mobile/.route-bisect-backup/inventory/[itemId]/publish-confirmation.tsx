import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useCollectionState } from "@/state/collection-state";

export default function PublishConfirmationScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { getItem } = useCollectionState();
  const item = getItem(itemId);

  return (
    <FormFrame
      eyebrow="Published"
      title="Your collection is growing."
      subtitle={item?.title ? `${item.title} is now tradeable.` : "Your item is now tradeable."}
      footer={
        <>
          <AppButton
            accessibilityLabel="View published item"
            onPress={() => router.replace(`/inventory/${itemId}`)}
          >
            View item
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
        message="We will begin looking for trade opportunities from your live wishlist and collection signals."
        title="Great addition to your collection."
        tone="success"
      />
    </FormFrame>
  );
}
