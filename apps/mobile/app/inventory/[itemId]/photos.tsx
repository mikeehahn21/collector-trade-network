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
      kind: item.photos.length === 0 && index === 0 ? "front" : "detail",
      sortOrder: item.photos.length + index,
      createdAt: new Date().toISOString(),
    }));

    updateItem(item.id, { photos: [...item.photos, ...photos] });
  }

  function addFallbackPhoto() {
    const photo: ItemPhoto = {
      id: `photo_${Date.now()}`,
      uri: `mock://photo/${Date.now()}`,
      kind: item.photos.length === 0 ? "front" : item.photos.length === 1 ? "back" : "detail",
      sortOrder: item.photos.length,
      createdAt: new Date().toISOString(),
    };
    updateItem(item.id, { photos: [...item.photos, photo] });
  }

  function removePhoto(photoId: string) {
    updateItem(item.id, { photos: item.photos.filter((photo) => photo.id !== photoId) });
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
      <PhotoManager onAddMockPhoto={addMockPhoto} onRemovePhoto={removePhoto} photos={item.photos} />
    </FormFrame>
  );
}
