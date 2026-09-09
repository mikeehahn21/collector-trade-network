# Konnesor Stabilization Checklist

Use this before spending another iOS cloud build.

## Current Rule

Do not start a TestFlight build until the current development build opens on a real iPhone and the Home stability checks look correct.

## Device Smoke Test

1. Open Konnesor on the iPhone development build.
2. Confirm the logo intro completes.
3. Confirm Home renders the logo, match card, stats, and six action tiles.
4. Open `Guide` and tap `Seed demo data`.
5. Open Collection and add one front photo using `Camera`.
6. Add one tag or detail photo using `Library`.
7. If either upload is blocked, confirm the app shows a clear permission/settings message instead of silently failing.
8. Add Comp Finder clues, open eBay sold comps, and save a value range.
9. Open Wishlist, Trades, Messages, and return Home.
10. Save one feedback note.
11. Confirm the tester can return Home without reinstalling.

## Backend Check

1. Confirm the API URL in `apps/mobile/app.config.js` is the intended backend for the build.
2. If the live API is unavailable, keep testing local fallback but do not submit that build to outside testers until the intended backend URL is confirmed.

## Local Gates

Run these before a cloud build:

```powershell
pnpm.cmd --filter @ctn/mobile typecheck
pnpm.cmd --filter @ctn/mobile lint
pnpm.cmd --filter @ctn/mobile test
pnpm.cmd --filter @ctn/mobile exec expo export --platform ios --clear --output-dir dist-testflight-check
```

## Build Gate

Only after the device smoke test and local gates pass:

```powershell
eas.cmd build --profile testflight --platform ios
```

Then submit only the successful build:

```powershell
eas.cmd submit --profile testflight --platform ios --latest
```
