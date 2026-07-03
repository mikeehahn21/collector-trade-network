import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { ScreenState } from "@/components/screen-state";
import { useApiClient } from "@/api/use-api-client";
import { useCollectionState } from "@/state/collection-state";

export default function ArchiveItemScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const api = useApiClient();
  const { archiveItem, deleteItem, getItem } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return null;
  }
  // Capture narrowed item so closures/JSX see the non-undefined type
  const currentItem = item;

  async function archive() {
    try {
      if (!currentItem.id.startsWith("item_")) {
        await api.updateItem(currentItem.id, { status: "archived" });
      }
      archiveItem(currentItem.id);
    } catch {
      archiveItem(currentItem.id);
      Alert.alert("Archived locally", "Server sync failed. This archive action is cached locally.");
    }
    router.replace("/inventory");
  }

  async function deleteForever() {
    try {
      if (!currentItem.id.startsWith("item_")) {
        await api.deleteItem(currentItem.id);
      }
      deleteItem(currentItem.id);
    } catch {
      deleteItem(currentItem.id);
      Alert.alert(
        "Deleted locally",
        "Server sync failed. This delete action may need reconciliation.",
      );
    }
    router.replace("/inventory");
  }

  return (
    <FormFrame
      eyebrow="Archive or delete"
      title="Take this item out of circulation."
      subtitle={currentItem.title || "Untitled draft"}
      footer={
        <>
          <AppButton accessibilityLabel="Archive item" onPress={() => void archive()}>
            Archive item
          </AppButton>
          <AppButton
            accessibilityLabel="Delete item forever"
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
        message="Archive keeps a record in your collection summary. Delete removes the local item entirely."
        title="Archive is safer than delete."
        tone="warning"
      />
    </FormFrame>
  );
}
