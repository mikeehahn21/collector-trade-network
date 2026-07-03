# Sprint 4 Deliverables

## Objective

Harden the platform foundation before recommendations by introducing real auth
boundaries, durable server-side ownership models, and persistence paths for user
profiles, inventory, and wishlist demand.

## Features Implemented

- Clerk-compatible mobile auth provider boundary.
- Local mock auth header provider for development.
- API client for mobile server sync.
- `/v1/me` user profile read/upsert API.
- User profile persistence schema.
- Access application persistence.
- Invite code persistence schema and lookup.
- Auth context helper using Clerk-compatible headers.
- API error handling for missing auth and missing synced user profile.
- Server-backed item repository.
- Authenticated item list/create/update/delete route boundaries.
- Server-backed wishlist repository.
- Authenticated wishlist list/create/update/delete route boundaries.
- Server-side Grail limit enforcement.
- Collection state can be replaced from server.
- Wishlist state can be replaced from server.

## Screens Completed

No new user-facing screens were added in Sprint 4.

This sprint intentionally hardened data ownership and persistence instead of
adding new product surfaces.

## APIs Added Or Hardened

- `GET /v1/me`
- `PUT /v1/me`
- `POST /v1/access-requests`
  - Now persists access applications.
- `POST /v1/access/invite-code`
  - Now checks persisted invite codes.
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

## Database Schema Additions

Added migration:

- `apps/api/migrations/1719999999999_users_access.ts`

Tables:

- `users`
- `access_applications`
- `invite_codes`

Updated existing migrations:

- `items.owner_id` now references `users(id)`.
- `wishlist_items.owner_id` now references `users(id)`.

## Shared Package Changes

- `UserProfile`
- `AccessApplication`
- user profile upsert validation
- API response types for user, item, and wishlist sync

## Technical Debt

- API auth currently reads Clerk-compatible headers. Production Clerk JWT
  verification must be added before launch.
- Mobile account creation/login screens still use the Sprint 1 mock flow. Clerk
  UI/session methods are not wired into those screens yet.
- Mobile inventory/wishlist screens still write local state first. The sync
  client and state replacement seams exist, but screen-level save operations are
  not fully server-first yet.
- Item photo persistence schema exists, but native image upload/R2 remains
  unwired.
- Invite code consumption is not implemented; lookup exists, but marking used is
  still future work.
- Access approval admin workflow is not implemented.

## Known Issues

- Dependency installation remains blocked by npm registry access in this
  environment.
- Typecheck, lint, tests, builds, migrations, and screenshots/previews must be
  run after `pnpm install` succeeds in a network-enabled environment.
- The local `.git` directory still exists but is not recognized as a valid Git
  repository by the bundled Git executable.

## Self-Review

- Sprint 4 deliberately avoided new product behavior and focused on the right
  prerequisite for recommendations: trustworthy server-owned supply and demand.
- Keeping internal user IDs as UUIDs while storing Clerk IDs externally is the
  right long-term decision. It prevents provider-specific IDs from leaking into
  every domain table.
- Server-side Grail enforcement is now represented, which matters before any
  recommendation system consumes Grail signals.
- The biggest incomplete piece is actual Clerk session wiring inside the mobile
  login/create-account screens. The provider boundary exists, but auth UX still
  needs to move from mock to real.

## Recommendations Before Sprint 5

- Run a network-enabled install and full quality suite before building matching.
- Wire Clerk session methods into Login/Create Account/Verification.
- Run migrations against local Postgres and verify the schema.
- Convert Inventory and Wishlist save/delete operations to call the API client
  first, then update local cache from server responses.
- Add R2-backed image upload before founders judge inventory polish.

## Estimated MVP Completion

Approximately 30-34%.
