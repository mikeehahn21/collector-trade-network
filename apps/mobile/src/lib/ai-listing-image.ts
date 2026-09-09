import * as ImageManipulator from "expo-image-manipulator";

import type { AiListingImageInput, TradeableItem } from "@ctn/types";

const MAX_AI_IMAGE_WIDTH = 1280;
const AI_IMAGE_QUALITY = 0.72;

export function getPrimaryLocalListingPhoto(
  item: Pick<TradeableItem, "photos">,
): TradeableItem["photos"][number] | undefined {
  return [...item.photos].sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

export function dataUriToAiListingImage(dataUri: string): AiListingImageInput | undefined {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUri.trim());
  if (!match) {
    return undefined;
  }

  const [, mediaType, data] = match;
  if (!mediaType || !data) {
    return undefined;
  }

  return {
    data,
    mediaType: mediaType.toLowerCase() as AiListingImageInput["mediaType"],
  };
}

export async function encodeListingPhotoForAi(
  uri: string | undefined,
): Promise<AiListingImageInput | undefined> {
  if (!uri) {
    return undefined;
  }

  if (uri.startsWith("data:image/")) {
    return dataUriToAiListingImage(uri);
  }

  if (!isLocalImageUri(uri)) {
    return undefined;
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_AI_IMAGE_WIDTH } }],
    {
      base64: true,
      compress: AI_IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  if (!result.base64) {
    return undefined;
  }

  return {
    data: result.base64,
    mediaType: "image/jpeg",
  };
}

function isLocalImageUri(uri: string): boolean {
  return uri.startsWith("file:") || uri.startsWith("content:") || uri.startsWith("asset:");
}
