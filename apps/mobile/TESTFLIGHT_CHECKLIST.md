# Konnesor TestFlight Checklist

This is the release path for testers outside the development build flow.

## Current App

- App name: Konnesor
- Bundle ID: `com.konnesor.mobile`
- Apple team: Michael Hahn, `BBXEYZXMDG`
- Expo account/project: `mhjr17/konnesor`
- Build profile: `testflight`
- Submit profile: `testflight`

## Before Building

1. Confirm the app opens in the current development build.
2. On Home, tap `Load demo loop` and confirm Archive, Wishlist, Trades, Messages, and Feedback all have data.
3. Confirm photo/video upload still works on a real item.
4. Tap `Reset` on Home and confirm local beta records clear without deleting the app.
5. Confirm the app uses the production API URL.
6. Run the local checks:

```powershell
pnpm.cmd --filter @ctn/mobile typecheck
pnpm.cmd --filter @ctn/mobile lint
pnpm.cmd --filter @ctn/mobile test
```

## App Store Connect

Create the app record in App Store Connect before submitting:

- Platform: iOS
- Name: Konnesor
- Bundle ID: `com.konnesor.mobile`
- SKU: `konnesor-ios`
- User access: Full access for Michael Hahn

## Build For TestFlight

Use this only when we are ready to spend an EAS cloud build:

```powershell
cd C:\Users\Michael\Documents\konnesor-eas-build\apps\mobile
eas.cmd build --profile testflight --platform ios
```

## Submit To TestFlight

After the build succeeds:

```powershell
cd C:\Users\Michael\Documents\konnesor-eas-build\apps\mobile
eas.cmd submit --profile testflight --platform ios --latest
```

## Invite Testers

In App Store Connect:

1. Open Konnesor.
2. Go to TestFlight.
3. Add Michael's brother as an internal or external tester.
4. For outside Whatnot sellers, use an external testing group.
5. Complete beta review details if Apple asks for them.

## What Testers Should Try

Ask each tester to complete this exact loop:

1. Open Konnesor and wait for the logo intro to finish.
2. Tap `Load demo loop` on Home.
3. Open Archive and inspect one item readiness checklist.
4. Open Wishlist and confirm the ranked grail view makes sense.
5. Open Trades, compose one proposal, then mark it accepted or countered.
6. Open Messages from the trade detail and send one note.
7. Return Home and save one feedback note.

## Beta Review Notes

- Konnesor is a private beta for collectors to organize tradeable vintage apparel, rank wishlist grails, compose structured swaps, and keep trade messages in one place.
- The TestFlight build includes demo/local fallback workflows so testers can complete the app loop even if the live API is unavailable.
- Photo and short video upload are used to document item condition and trade proof.
- No real purchases, payments, or shipping labels are executed in this beta build.

## Notes

- TestFlight itself does not cost extra beyond the Apple Developer Program.
- EAS cloud builds are separate from Apple. If the EAS build quota is exhausted, either wait for quota reset, upgrade EAS, or build from a Mac with Xcode.
- Development build links are not the same as TestFlight links.
- TestFlight installs through Apple's TestFlight app, not through the Expo install page.
