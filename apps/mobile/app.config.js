/* eslint-disable no-undef */
 
 
// Dynamic Expo config — overrides app.json at build time.
// For the preview-apk (production) build, APP_ENV=production is set by eas.json,
// so we default apiBaseUrl to the live Railway URL when the env var is not set.
const IS_PRODUCTION = process.env.APP_ENV === "production";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (IS_PRODUCTION ? "https://ctnapi-production-cb44.up.railway.app" : "http://localhost:4000");

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "Konnesor",
    slug: "konnesor",
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
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.konnesor.mobile",
      buildNumber: "1",
      infoPlist: {
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
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "collector-trade-mobile",
          organization: "collector-trade",
        },
      ],
    ],
    extra: {
      eas: {
      },
      router: {
        origin: false,
      },
      apiBaseUrl: API_BASE_URL,
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
      posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "",
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "",
    },
  },
};
