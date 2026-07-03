import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { FormFrame } from "@/components/form-frame";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

const verificationSteps = ["Front", "Back", "Tag", "Flaws", "Rotate"] as const;

export default function ItemVerificationScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const api = useApiClient();
  const router = useRouter();
  const theme = useTheme();
  const { getItem, updateItem } = useCollectionState();
  const item = getItem(itemId);
  const verificationCode = useMemo(() => createVerificationCode(), []);
  const [videoUri, setVideoUri] = useState<string | undefined>();
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!item) {
    return null;
  }

  async function recordVideo() {
    setError(undefined);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError("Camera access is required to record a verification video.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 30,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const duration = asset?.duration ? Math.round(asset.duration / 1000) : undefined;

    if (!asset?.uri || duration === undefined) {
      setError("Video duration could not be read. Please record again.");
      return;
    }

    if (duration < 5 || duration > 30) {
      setError("Verification video must be between 5 and 30 seconds.");
      return;
    }

    setVideoUri(asset.uri);
    setDurationSeconds(duration);
  }

  async function submitVideo() {
    if (!videoUri || durationSeconds === undefined) {
      setError("Record a verification video before submitting.");
      return;
    }

    setIsUploading(true);
    setError(undefined);

    try {
      const response = await api.uploadItemVerificationVideo(item.id, {
        videoUrl: videoUri,
        durationSeconds,
        verificationCode,
      });
      updateItem(item.id, {
        verificationVideoUrl: response.item.verificationVideoUrl,
        verificationStatus: response.item.verificationStatus,
        verificationFailedReason: response.item.verificationFailedReason,
        verifiedAt: response.item.verifiedAt,
        aiMetadata: response.item.aiMetadata,
      });
      Alert.alert("Review started", "Your verification video is queued for AI review.");
      router.back();
    } catch {
      setError("Verification video could not be submitted.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <FormFrame
      eyebrow="Proof of Life"
      title="Verify this item."
      subtitle="Record a 5-30 second video showing the item front, back, tag, flaws, and rotation with the code visible."
      footer={
        <View style={{ gap: theme.spacing.md }}>
          <AppButton accessibilityLabel="Record verification video" onPress={() => void recordVideo()}>
            Record Verification Video
          </AppButton>
          <AppButton
            accessibilityLabel="Submit verification video"
            disabled={!videoUri}
            loading={isUploading}
            onPress={() => void submitVideo()}
            variant="secondary"
          >
            Submit for Review
          </AppButton>
        </View>
      }
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.accent,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: "800" }}>
            VERIFICATION CODE
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 44, fontWeight: "900" }}>
            {verificationCode}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center" }}>
            Keep this code visible in the frame while recording.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
            Recording guide
          </Text>
          {verificationSteps.map((step, index) => (
            <View key={step} style={{ alignItems: "center", flexDirection: "row", gap: theme.spacing.md }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: theme.colors.accentMuted,
                  borderRadius: 999,
                  height: 28,
                  justifyContent: "center",
                  width: 28,
                }}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: "900" }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={{ color: theme.colors.textSecondary, flex: 1, fontSize: 15 }}>{step}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            alignItems: "center",
            aspectRatio: 0.72,
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            borderStyle: "dashed",
            borderWidth: 1,
            gap: theme.spacing.md,
            justifyContent: "center",
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
            Camera guide overlay
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: "center" }}>
            Center the shirt inside this frame. Move slowly through each step so the AI review can compare the
            video against the listing.
          </Text>
          {videoUri ? (
            <Text style={{ color: theme.colors.accent, fontSize: 14, fontWeight: "900" }}>
              Video ready: {durationSeconds}s
            </Text>
          ) : null}
        </View>

        {error ? <Text style={{ color: theme.colors.warning, fontSize: 14 }}>{error}</Text> : null}
      </View>
    </FormFrame>
  );
}

function createVerificationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
