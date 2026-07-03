# ADR 0003: Authentication and Synchronization Strategy

## Status

Accepted for Sprint 5

## Decision

Use Clerk for authentication and session management, but keep the application
database as the business source of truth.

Clerk owns:

- Login.
- Account creation.
- Session restoration.
- Session expiration.
- Token issuance.

The application database owns:

- Internal user ID.
- Access status.
- Roles.
- Profile.
- Inventory ownership.
- Wishlist ownership.
- Grail limits.
- Domain authorization.

## Synchronization Model

Mobile local storage is a cache and offline layer, not the source of truth.

Server-first actions:

- Explicit inventory save.
- Inventory publish.
- Inventory archive/delete when server ID exists.
- Explicit wishlist save.
- Wishlist archive/delete when server ID exists.

Local-first exceptions:

- In-progress item drafts before the user taps Save.
- In-progress wishlist edits before the user taps Save.
- Offline fallback when a server write fails.

## Conflict Resolution

For Sprint 5, server state wins during hydration. Local changes that fail to sync
remain cached locally and should be reconciled before matching consumes them.

Future conflict handling should add:

- Pending operation queue.
- Per-record sync status.
- Retry scheduler.
- User-visible conflict resolution for edited records.

## Retry Policy

Mobile API requests retry transient network/server failures:

- GET requests retry up to 3 attempts.
- Write requests retry up to 2 attempts.
- 4xx responses do not retry.

## Auth Enforcement

API routes require either:

- A verified Clerk bearer token.
- Local/development Clerk-compatible headers.

Production must not accept development headers.
