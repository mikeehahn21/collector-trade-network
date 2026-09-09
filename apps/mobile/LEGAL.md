# Konnesor Legal Links

The mobile app reads legal document URLs from `app.config.js` through Expo `extra`:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL`, defaulting to `https://konnesor.app/privacy`
- `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`, defaulting to `https://konnesor.app/terms`

Update those values after legal review and hosting are complete. Keep final public URLs in EAS profile env values or EAS secrets as appropriate for each build target.

## Account deletion

The in-app Delete Account action calls the API's `DELETE /v1/me` flow. The API first anonymizes Konnesor app data so trade history can remain intact for counterparties without retaining personal profile/listing/message details, then deletes the backing Clerk user identity with `CLERK_SECRET_KEY`. If Clerk deletion fails after app-data anonymization, the API logs and forwards the failure to Sentry while still returning success to the app so the user is not trapped in a partially deleted account state.
