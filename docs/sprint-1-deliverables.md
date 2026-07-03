# Sprint 1 Deliverables

## Objective

A brand-new user can open the mobile app, enter the access flow, complete
onboarding, and arrive at a personalized empty Home dashboard.

## Scope Implemented

- Premium mobile access flow.
- Mock account creation and login flow.
- Invite-code entry and validation state.
- Application/waitlist submission flow.
- Mock verification flow.
- Pending approval screen.
- Profile setup.
- Collector type selection.
- Size preference selection.
- Category preference selection.
- Trade preference configuration.
- Contextual communication preference configuration.
- Notification preference selection.
- Onboarding completion.
- Empty Home dashboard with first-time checklist and navigation shell.
- Local secure persistence of onboarding state.
- Shared onboarding types, constants, and validation schemas.
- Minimal API contracts and mock access routes for applications and invite codes.

## Screens Completed

- Splash
- Welcome
- Login
- Create Account
- Invite Code
- Apply for Access
- Waitlist Confirmation
- Verification
- Account Pending Approval
- Profile Setup
- Collector Type
- Size Preferences
- Category Preferences
- Trade Preferences
- Communication Preferences
- Notification Permission
- Onboarding Complete
- Empty Home Dashboard
- Navigation Shell

## APIs Created

- `POST /v1/access-requests`
  - Validates application structure.
  - Returns `202` with received status.
  - Does not persist yet.

- `POST /v1/access/invite-code`
  - Validates invite-code structure.
  - Returns accepted mock access status.
  - Does not check real invite inventory yet.

## Database Changes

None.

Sprint 1 intentionally avoids database tables until the user lifecycle model is
reviewed and approved.

## Components Created

- `AppButton`
- `AppTextField`
- `ChoiceCard`
- `Chip`
- `FormFrame`
- `LoadingState`
- `ScreenState`
- Onboarding state provider
- Secure persisted onboarding state
- Selection utility

## Technical Debt

- Authentication is mocked locally; Clerk integration is not wired.
- Verification is mocked with a 6-digit local flow.
- Access applications and invite codes validate shape only; no persistence or
  admin review queue exists yet.
- Notification permission is a preference screen only; native OS permission
  prompts are not wired.
- Home navigation shell is visual only; Inventory, Wishlist, Trades, and Profile
  tabs are intentionally not implemented.
- No screenshots were generated because dependencies could not be installed or
  run in this environment.

## Known Issues

- Dependency installation remains blocked by npm registry access in this
  environment.
- Typecheck, lint, tests, builds, and rendered previews must be run after
  `pnpm install` succeeds in a network-enabled environment.

## Code Review Notes

- The product boundary is intact: no inventory, wishlist, trade, recommendation,
  messaging, or admin functionality was implemented beyond onboarding support.
- The communication model is represented as preferences and shared types, but no
  conversation feature exists yet.
- Local onboarding persistence is suitable for Sprint 1 inspection, but should
  be replaced with server-backed user state when Clerk and the database are
  connected.
- The Home screen intentionally points the user toward Sprint 2 behaviors without
  building those features.

## Estimated MVP Completion

Approximately 11-14%.
