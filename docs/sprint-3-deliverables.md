# Sprint 3 Deliverables

## Objective

Build the demand side of the platform. Users can define what they are hunting
without starting Recommendations, Offers, Trades, Messaging, or AI matching.

## Features Implemented

- Wishlist Home.
- Wishlist empty state.
- Wishlist summary.
- Add Wishlist Item.
- Edit Wishlist Item.
- Wishlist Item Detail.
- Archive Wishlist Item.
- Delete Wishlist Item.
- Save confirmation.
- Organize Wishlist with move up / move down controls.
- Mark priority.
- Mark Grails.
- Enforce limited Grails.
- Choose Exact Match or Similar Items Accepted.
- Set visibility.
- Track archive status.
- Local secure persistence for wishlist state.
- Home dashboard updated with:
  - Tradeable Items.
  - Wishlist Count.
  - Grail Count.
  - Recommendations marked as Coming Soon.

## Screens Completed

- Wishlist Home
- Wishlist Empty State
- Wishlist Item Detail
- Add Wishlist Item
- Edit Wishlist Item
- Archive Wishlist Item
- Delete Confirmation
- Save Confirmation
- Home Dashboard update

## APIs Added

- `POST /v1/wishlist-items`
  - Validates sparse wishlist drafts.
  - Returns mock accepted response.

- `POST /v1/wishlist-items/publish`
  - Validates complete wishlist demand signals.
  - Returns mock valid response.

These routes are intentionally not wired to auth/persistence yet.

## Database Schema Additions

Added migration:

- `apps/api/migrations/1720000000001_wishlist_grails.ts`

Table:

- `wishlist_items`

The schema supports ownership, title, category, size, preferred era, preferred
tag, preferred condition, notes, priority, grail flag, exact/similar match
preference, visibility, archive status, sort order, and timestamps.

## Shared Package Changes

- `WishlistItem`
- `WishlistPriority`
- `WishlistMatchPreference`
- `WishlistVisibility`
- `WishlistSummary`
- `MAX_GRAILS`
- Wishlist priority constants.
- Wishlist match preference constants.
- Wishlist visibility constants.
- Wishlist draft validation schema.
- Wishlist publish validation schema.
- Wishlist API contracts.

## Technical Debt

- Wishlist is stored locally until Clerk-backed ownership is wired.
- API routes validate only; they do not persist to PostgreSQL yet.
- Grail limit is enforced in mobile state only; it must also be enforced on the
  server before launch.
- Organizing uses simple move up / move down controls, not drag and drop.
- Home navigation remains a simple shell, not a full tab navigator.

## Known Issues

- Dependency installation remains blocked by npm registry access in this
  environment.
- Typecheck, lint, tests, builds, and screenshots/previews must be run after
  `pnpm install` succeeds in a network-enabled environment.

## Self-Review

- Sprint boundary was respected: no recommendation engine, offers, trades,
  messaging, or AI matching was implemented.
- Grails are modeled as a first-class demand signal, not just a visual badge.
- Exact vs similar match preference is captured now so future ranking can
  differentiate literal hunts from adjacent acceptable wants.
- The Wishlist experience has the right product framing: hunting and dream
  collection building rather than a generic saved-search form.
- The weakest UX area is organizing. Move up / move down is reliable, but drag
  sorting would feel more premium once dependencies can be installed and tested.

## Recommendations Before Sprint 4

- Wire a real tab navigator before building the recommendation surface so Home,
  Inventory, and Wishlist feel like one coherent app.
- Decide whether Sprint 4 is auth/server persistence hardening or recommendation
  system v0. My CTO recommendation is to harden auth and server persistence first,
  because recommendations need trustworthy ownership and durable supply/demand
  data.
- Enforce `MAX_GRAILS` server-side before any real matching logic consumes grail
  signals.
- Add native image picking from Sprint 2 before serious founder UX review.

## Estimated MVP Completion

Approximately 24-28%.
