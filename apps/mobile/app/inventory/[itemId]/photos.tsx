import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import type { ItemPhoto } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { PhotoManager } from "@/components/inventory/photo-manager";
import { useCollectionState } from "@/state/collection-state";

export default function PhotoManagerScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { getItem, updateItem } = useCollectionState();
  const item = getItem(itemId);

  if (!item) {
    return null;
  }
  // Capture narrowed item so closures/JSX see the non-undefined type
  const currentItem = item;

  async function addMockPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      addFallbackPhoto();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.86,
    });

    if (result.canceled) {
      return;
    }

    const photos: ItemPhoto[] = result.assets.map((asset, index) => ({
      id: `photo_${Date.now()}_${index}`,
      uri: asset.uri,
      kind: currentItem.photos.length === 0 && index === 0 ? "front" : "detail",
      sortOrder: currentItem.photos.length + index,
      createdAt: new Date().toISOString(),
    }));

    updateItem(currentItem.id, { photos: [...currentItem.photos, ...photos] });
  }

  function addFallbackPhoto() {
    const photo: ItemPhoto = {
      id: `photo_${Date.now()}`,
      uri: `mock://photo/${Date.now()}`,
      kind:
        currentItem.photos.length === 0
          ? "front"
          : currentItem.photos.length === 1
            ? "back"
            : "detail",
      sortOrder: currentItem.photos.length,
      createdAt: new Date().toISOString(),
    };
    updateItem(currentItem.id, { photos: [...currentItem.photos, photo] });
  }

  function removePhoto(photoId: string) {
    updateItem(currentItem.id, {
      photos: currentItem.photos.filter((photo) => photo.id !== photoId),
    });
  }

  return (
    <FormFrame
      eyebrow="Photo manager"
      title="Make the item easy to trust."
      subtitle="Front, back, tag, and flaw photos will matter when trades begin."
      footer={
        <AppButton accessibilityLabel="Done managing photos" onPress={() => router.back()}>
          Done
        </AppButton>
      }
    >
      <PhotoManager
        onAddMockPhoto={addMockPhoto}
        onRemovePhoto={removePhoto}
        photos={currentItem.photos}
      />
    </FormFrame>
  );
}
