# Mobile Sentry Setup

Create a React Native project in Sentry, copy its client DSN, and set it as the EAS secret `EXPO_PUBLIC_SENTRY_DSN` for the mobile app. Keep the actual DSN out of `eas.json`; the committed build profiles only reserve the env key so cloud builds can receive the secret at build time.
