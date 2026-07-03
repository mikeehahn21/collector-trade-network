import { Image, Text, View } from "react-native";

import type { ItemPhoto } from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { useTheme } from "@/theme/theme-provider";

type PhotoManagerProps = {
  onAddMockPhoto: () => void | Promise<void>;
  onRemovePhoto: (photoId: string) => void;
  photos: ItemPhoto[];
};

export function PhotoManager({ onAddMockPhoto, onRemovePhoto, photos }: PhotoManagerProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
        {photos.map((photo, index) => (
          <View
            key={photo.id}
            style={{
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              width: "48%",
            }}
          >
            {photo.uri.startsWith("file:") || photo.uri.startsWith("http") ? (
              <Image
                accessibilityLabel={`Item photo ${index + 1}`}
                source={{ uri: photo.uri }}
                style={{ aspectRatio: 1, borderRadius: theme.radius.sm, width: "100%" }}
              />
            ) : (
              <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: "900" }}>
                Photo {index + 1}
              </Text>
            )}
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{photo.kind}</Text>
            <AppButton
              accessibilityLabel={`Remove photo ${index + 1}`}
              onPress={() => onRemovePhoto(photo.id)}
              variant="ghost"
            >
              Remove
            </AppButton>
          </View>
        ))}
      </View>
      <AppButton accessibilityLabel="Add mock photo" onPress={() => { void onAddMockPhoto(); }} variant="secondary">
        Add photo
      </AppButton>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
        Photos are local previews until cloud upload is wired.
      </Text>
    </View>
  );
}
