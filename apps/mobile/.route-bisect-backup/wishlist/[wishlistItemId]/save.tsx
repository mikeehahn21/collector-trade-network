import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useWishlistState } from "@/state/wishlist-state";

export default function SaveWishlistItemScreen() {
  const { wishlistItemId } = useLocalSearchParams<{ wishlistItemId: string }>();
  const router = useRouter();
  const { getWishlistItem } = useWishlistState();
  const item = getWishlistItem(wishlistItemId);

  return (
    <FormFrame
      eyebrow="Want saved"
      title={item?.isGrail ? "Grail added to your hunt." : "Your wishlist is sharper."}
      subtitle={
        item?.title
          ? `${item.title} is now part of your demand profile.`
          : "This want is now part of your demand profile."
      }
      footer={
        <>
          <AppButton
            accessibilityLabel="View wishlist item"
            onPress={() => router.replace(`/wishlist/${wishlistItemId}`)}
          >
            View want
          </AppButton>
          <AppButton
            accessibilityLabel="Back to wishlist"
            onPress={() => router.replace("/wishlist")}
            variant="secondary"
          >
            Back to wishlist
          </AppButton>
        </>
      }
    >
      <ScreenState
        message="This want now helps the Trade Graph find explainable collector matches."
        title="This is what you are hunting."
        tone="success"
      />
    </FormFrame>
  );
}
