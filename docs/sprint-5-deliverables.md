# Sprint 5 Deliverables

## Objective

Complete the transition from prototype local state toward a connected,
authenticated, server-owned application before building the Trade Graph Engine.

## Authentication Status

Implemented:

- Clerk provider boundary in mobile.
- Clerk login integration path.
- Clerk account creation integration path.
- Clerk email verification integration path.
- Logout.
- Session restoration through Clerk provider.
- Protected route guard for Home, Inventory, and Wishlist.
- Backend Clerk bearer-token verification path.
- Local development auth fallback using Clerk-compatible headers.

Still incomplete:

- Dependency installation is blocked, so Clerk runtime behavior has not been
  verified locally.
- Password reset is not fully implemented.
- Production Clerk JWT settings need live environment verification.

## Sync Architecture

Implemented:

- Mobile API client with auth headers and bearer-token support.
- Retry behavior for transient failures.
- Data sync bootstrap after authentication.
- User profile upsert from onboarding state.
- Server hydration for Inventory and Wishlist.
- Local storage treated as cache/offline fallback.
- Server-first explicit save/publish/archive/delete paths where practical.
- Local fallback with user-facing warning when server write fails.

Important decision:

- Local edits remain local while users are actively shaping a draft.
- Explicit Save/Publish actions attempt the server first.
- Server hydration replaces local cache after successful sync.

Documented in:

- `docs/decisions/0003-auth-sync-strategy.md`

## APIs Completed Or Hardened

- `GET /v1/me`
- `PUT /v1/me`
- `GET /v1/items`
- `POST /v1/items`
- `POST /v1/items/publish`
- `GET /v1/items/:itemId`
- `PUT /v1/items/:itemId`
- `DELETE /v1/items/:itemId`
- `GET /v1/wishlist-items`
- `POST /v1/wishlist-items`
- `POST /v1/wishlist-items/publish`
- `GET /v1/wishlist-items/:wishlistItemId`
- `PUT /v1/wishlist-items/:wishlistItemId`
- `DELETE /v1/wishlist-items/:wishlistItemId`

## Database Changes

No new Sprint 5 tables.

Sprint 5 hardened usage of existing Sprint 4 schema:

- Users are the ownership root.
- Inventory references `users(id)`.
- Wishlist references `users(id)`.
- Grail limit enforcement exists server-side.

## Mobile Integration Summary

Added:

- `MobileAuthProvider`
- `useAuthSession`
- `ProtectedRouteGuard`
- `createApiClient`
- `useApiClient`
- `DataSyncBootstrap`
- server replacement methods for Inventory and Wishlist state
- server-first save/publish/archive/delete paths
- native image picker foundation with local previews

## Remaining Technical Debt

- Full Clerk runtime behavior needs dependency install and device testing.
- Password reset needs a real Clerk flow.
- Local draft operations do not yet maintain a durable pending operation queue.
- Conflict resolution is server-wins during hydration; richer reconciliation is
  future work.
- Server-first writes are wired for explicit save/publish/archive/delete, but
  field-by-field autosave remains local until save.
- Cloudflare R2 upload remains unwired.
- Access approval admin workflow remains future work.
- Invite code consumption/mark-used remains future work.

## Known Issues

- Dependency installation remains blocked by npm registry access in this
  environment.
- Typecheck, lint, tests, builds, migrations, and screenshots/previews must be
  run after `pnpm install` succeeds in a network-enabled environment.
- The existing `.git` directory is still not recognized as a valid Git repo by
  the bundled Git executable.

## Self-Review

- This sprint moved the product materially closer to a real app without starting
  Recommendations, Offers, Trades, or Messaging.
- The core architectural decision is sound: Clerk authenticates, but the app
  database owns business identity and domain rules.
- The sync model is pragmatic for this stage, but it is not yet a sophisticated
  offline-first system.
- The biggest weakness is that dependency installation remains blocked, so Clerk
  and Expo Image Picker behavior cannot be validated in-app yet.

## Updated MVP Completion Estimate

Approximately 38-42%.
