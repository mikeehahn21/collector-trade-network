import { describe, expect, it, vi } from "vitest";

const { manipulateAsyncMock } = vi.hoisted(() => ({
  manipulateAsyncMock: vi.fn(),
}));

vi.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  manipulateAsync: manipulateAsyncMock,
}));

import {
  dataUriToAiListingImage,
  encodeListingPhotoForAi,
  getPrimaryLocalListingPhoto,
} from "./ai-listing-image";

describe("AI listing image helpers", () => {
  it("extracts base64 image input from a data URI", () => {
    expect(dataUriToAiListingImage("data:image/jpeg;base64,abc123")).toEqual({
      data: "abc123",
      mediaType: "image/jpeg",
    });
  });

  it("uses the lowest sort order photo for per-item AI suggestions", () => {
    const photo = getPrimaryLocalListingPhoto({
      photos: [
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          id: "photo_back",
          kind: "back",
          sortOrder: 1,
          uri: "file:///back.jpg",
        },
        {
          createdAt: "2026-01-01T00:00:00.000Z",
          id: "photo_front",
          kind: "front",
          sortOrder: 0,
          uri: "file:///front.jpg",
        },
      ],
    });

    expect(photo?.uri).toBe("file:///front.jpg");
  });

  it("compresses and base64-encodes local picker photos for AI suggestions", async () => {
    manipulateAsyncMock.mockResolvedValueOnce({ base64: "compressed-local-image" });

    await expect(encodeListingPhotoForAi("file:///picked-shirt.jpg")).resolves.toEqual({
      data: "compressed-local-image",
      mediaType: "image/jpeg",
    });
    expect(manipulateAsyncMock).toHaveBeenCalledWith(
      "file:///picked-shirt.jpg",
      [{ resize: { width: 1280 } }],
      {
        base64: true,
        compress: 0.72,
        format: "jpeg",
      },
    );
  });
});
