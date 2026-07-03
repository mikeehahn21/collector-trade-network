# Sprint 2 Deliverables

## Objective

A user can build and manage a tradeable collection without starting Wishlist,
Offers, Trades, Recommendations, Messaging, or Admin functionality.

## Implemented Features

- Inventory Home.
- Inventory Empty State.
- Collection Summary.
- Inventory grid/list card view.
- Add item flow.
- Edit existing item flow.
- Archive item flow.
- Delete item confirmation.
- Save draft confirmation.
- Publish confirmation with momentum-oriented copy.
- Item Details screen.
- Photo Manager with mock photo records.
- Condition Editor.
- Flaw capture.
- Item-level Trade Preferences.
- Item-level Communication Settings.
- Local secure persistence for collection state.
- Mock AI-assisted listing suggestions.
- Publish readiness validation.
- Shared item domain types, constants, validation, and API contracts.
- Initial database migration for collection persistence.
- Mock item API route boundaries.

## Screens Completed

- Inventory Home
- Inventory Empty State
- Inventory Grid/List View
- Add Item
- Edit Item
- Item Details
- Photo Manager
- Condition Editor
- Trade Preferences
- Communication Settings
- Archive Item
- Delete Confirmation
- Save Draft
- Publish Confirmation

## Components Created

- `CollectionSummaryPanel`
- `ItemCard`
- `PhotoManager`
- item display label utilities
- item publish validation utility
- mock AI listing utility
- collection state provider

## APIs Added

- `POST /v1/items`
  - Validates sparse item drafts.
  - Returns mock accepted response.

- `POST /v1/items/publish`
  - Validates complete tradeable item payloads.
  - Returns mock publish-ready response.

- `POST /v1/items/ai-suggestions`
  - Returns mocked editable listing suggestions.

These routes are intentionally not wired to auth/persistence yet.

## Database Schema Changes

Added migration:

- `apps/api/migrations/1720000000000_collection_engine.ts`

Tables:

- `items`
- `item_photos`

The schema supports item ownership, statuses, photos, vintage metadata,
measurements, flaws, value range, item-level trade preferences, item-level
communication settings, AI suggestions, and archive/publish timestamps.

## Shared Package Changes

- Item statuses.
- Item condition.
- Item visibility.
- Item measurements.
- Item photos.
- Estimated value range.
- Tradeable item type.
- AI listing suggestions type.
- Collection summary type.
- Item constants.
- Draft validation schema.
- Publish validation schema.
- Item API contracts.

## Remaining Technical Debt

- Photo upload uses mock records; native image picker and Cloudflare R2 upload are
  not wired.
- AI listing suggestions are mocked; OpenAI vision/listing extraction is not
  wired.
- Mobile inventory state is local secure storage; server persistence waits for
  Clerk-backed user ownership.
- API item routes validate only; they do not persist to PostgreSQL yet.
- Item ownership/authz is not enforced until auth integration.
- No real image rendering because mock photos do not point to local assets.
- Bottom navigation is still a simple shell, not a full tab navigator.

## Known Issues

- Dependency installation remains blocked by npm registry access in this
  environment.
- Typecheck, lint, tests, builds, and screenshots/previews must be run after
  `pnpm install` succeeds in a network-enabled environment.

## Self-Review

- The sprint boundary was respected: no Wishlist, Offers, Trades,
  Recommendations, Messaging, or Admin functionality was started.
- Draft and publish are correctly separated. Drafts can be incomplete; tradeable
  items require meaningful data.
- Item-level communication settings honor the approved contextual messaging
  model without implementing messaging.
- The inventory experience is stronger than a generic listing form, but native
  photo picking is the biggest missing piece before founder UX review can feel
  realistic.
- The real backend persistence should not be implemented until user ownership and
  access lifecycle are finalized with Clerk and the database.

## Suggested Improvements Before Sprint 3

- Add native image picker and local image previews before evaluating polish.
- Replace the visual navigation shell with a real tab navigator once Inventory is
  approved.
- Add server-backed item ownership immediately after auth schema review.
- Add auto-save feedback so users know edits are persisted.
- Consider a guided first-item flow for the first 3 items, then a faster editor
  for experienced users.

## Estimated MVP Completion

Approximately 18-22%.
