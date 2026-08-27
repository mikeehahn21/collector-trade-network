# Konnesor Stabilization Checklist

Use this before spending another iOS cloud build.

## Current Rule

Do not start a TestFlight build until the current development build opens on a real iPhone and the Home stability checks look correct.

## Device Smoke Test

1. Open Konnesor on the iPhone development build.
2. Confirm the logo intro completes.
3. Confirm Home renders the following cards:
   - MVP Path
   - Tester Walkthrough
   - Beta Demo Controls
   - Stability Check
   - Home comp scanner
   - Trust Layer
   - Seller Feedback
4. Tap `Load demo loop`.
5. Open Archive and add one front photo using `Camera`.
6. Add one tag or detail photo using `Library`.
7. If either upload is blocked, confirm the app shows a clear permission/settings message instead of silently failing.
8. Add Comp Finder clues, open eBay sold comps, and save a value range.
9. Open Wishlist, Trades, Messages, and return Home.
10. Save one feedback note.
11. Tap `Reset` and confirm local beta records clear without reinstalling.

## Backend Check

1. On Home, read the `Stability Check` card.
2. Confirm the API URL is the intended backend for the build.
3. Tap `Recheck API`.
4. If it says backend unavailable, keep testing local fallback but do not submit that build to outside testers until the intended backend URL is confirmed.

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
