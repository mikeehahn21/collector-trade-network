/* eslint-disable no-undef */
const IS_PRODUCTION = process.env.APP_ENV === "production";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (IS_PRODUCTION ? "https://ctnapi-production-cb44.up.railway.app" : "http://localhost:4000");
const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? "https://konnesor.app/privacy";
const TERMS_OF_SERVICE_URL =
  process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL ?? "https://konnesor.app/terms";
const ONESIGNAL_MODE = IS_PRODUCTION ? "production" : "development";

module.exports = {
  expo: {
    name: "Konnesor",
    slug: "konnesor",
    owner: "mhjr17s-team",
    scheme: "konnesor",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F1115",
    },
    newArchEnabled: false,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.konnesor.mobile",
      buildNumber: "1",
      itsAppUsesNonExemptEncryption: false,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "Konnesor needs camera access so you can take photos of your items and record verification videos.",
        NSPhotoLibraryUsageDescription:
          "Konnesor needs photo library access so you can upload photos of your items.",
      },
    },
    android: {
      package: "com.konnesor.mobile",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F1115",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
      ],
    },
    plugins: [
      [
        "onesignal-expo-plugin",
        {
          mode: ONESIGNAL_MODE,
          disableLocation: true,
        },
      ],
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.9.25",
          },
        },
      ],
      "./plugins/with-fmt-cxx17",
    ],
    extra: {
      eas: {
        projectId: "ccaa9437-aa3a-4cb9-ac09-bc8d96bbd10a",
      },
      router: {
        origin: false,
      },
      apiBaseUrl: API_BASE_URL,
      privacyPolicyUrl: PRIVACY_POLICY_URL,
      termsOfServiceUrl: TERMS_OF_SERVICE_URL,
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
      posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "",
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "",
    },
  },
};
