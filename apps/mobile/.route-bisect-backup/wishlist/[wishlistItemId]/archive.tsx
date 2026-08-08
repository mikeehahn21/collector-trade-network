import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useApiClient } from "@/api/use-api-client";
import { useWishlistState } from "@/state/wishlist-state";

export default function ArchiveWishlistItemScreen() {
  const { wishlistItemId } = useLocalSearchParams<{ wishlistItemId: string }>();
  const router = useRouter();
  const api = useApiClient();
  const { archiveWishlistItem, deleteWishlistItem, getWishlistItem } = useWishlistState();
  const item = getWishlistItem(wishlistItemId);

  if (!item) {
    return null;
  }
  // Capture narrowed item so closures/JSX see the non-undefined type
  const currentItem = item;

  async function archive() {
    try {
      if (!currentItem.id.startsWith("wish_")) {
        await api.updateWishlistItem(currentItem.id, { isArchived: true });
      }
      archiveWishlistItem(currentItem.id);
    } catch {
      archiveWishlistItem(currentItem.id);
      Alert.alert("Archived locally", "Server sync failed. This archive action is cached locally.");
    }
    router.replace("/wishlist");
  }

  async function deleteForever() {
    try {
      if (!currentItem.id.startsWith("wish_")) {
        await api.deleteWishlistItem(currentItem.id);
      }
      deleteWishlistItem(currentItem.id);
    } catch {
      deleteWishlistItem(currentItem.id);
      Alert.alert(
        "Deleted locally",
        "Server sync failed. This delete action may need reconciliation.",
      );
    }
    router.replace("/wishlist");
  }

  return (
    <FormFrame
      eyebrow="Archive or delete"
      title="Retire this want."
      subtitle={currentItem.title || "Untitled want"}
      footer={
        <>
          <AppButton accessibilityLabel="Archive wishlist item" onPress={() => void archive()}>
            Archive want
          </AppButton>
          <AppButton
            accessibilityLabel="Delete wishlist item forever"
            onPress={() => void deleteForever()}
            variant="secondary"
          >
            Delete permanently
          </AppButton>
          <AppButton
            accessibilityLabel="Cancel archive"
            onPress={() => router.back()}
            variant="ghost"
          >
            Cancel
          </AppButton>
        </>
      }
    >
      <ScreenState
        message="Archive keeps the history of what you were hunting. Delete removes the local want entirely."
        title="Archive is safer than delete."
        tone="warning"
      />
    </FormFrame>
  );
}
