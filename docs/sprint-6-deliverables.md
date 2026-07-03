# Sprint 6 Deliverables - Trade Graph Engine v1

## Summary

Sprint 6 introduced the first real Trade Graph experience. Authenticated users
can now receive deterministic, explainable trade opportunities generated from
server-backed inventory and wishlist data.

The sprint stayed inside the approved boundary: no offers, trade execution,
messaging, shipping, or disputes were built.

## Trade Graph Architecture

The backend recommendation system is intentionally modular:

- `trade-graph.repository.ts` loads approved users, visible tradeable inventory,
  and visible active wishlist demand from PostgreSQL.
- `match-generation.ts` creates collector-to-collector candidate relationships.
- `scoring.ts` assigns deterministic point values and produces user-facing
  reasons.
- `recommendation-engine.ts` sorts and returns the top explainable matches.
- `recommendations.routes.ts` exposes authenticated recommendation APIs.

Recommendations are generated at read time. There is no recommendation table in
Sprint 6.

## Matching Algorithm

The engine identifies:

- one-way matches when another collector has something on your wishlist
- one-way matches when you have something on another collector's wishlist
- mutual matches when both directions exist
- Grail matches when a matched wishlist item is marked as a Grail
- exact matches when an exact wishlist title and size match is found
- similar matches when a wishlist item accepts same-category similar items

V1 matching requires category agreement. Exact matching also requires title
overlap and compatible size when the wishlist specifies a size.

## Scoring Model

The deterministic score is capped at 100 and documented in
`docs/decisions/0004-trade-graph-v1-scoring.md`.

Every score returns visible reasons with point values so the user can understand
why a recommendation exists.

## APIs Added

- `GET /v1/recommendations`
- `GET /v1/recommendations/:recommendationId`

Both routes require the authenticated Clerk user to map to an internal active
user profile.

## Database Additions

No new tables were added. Sprint 6 uses the existing `users`, `items`, and
`wishlist_items` tables.

## Screens Completed

- Home recommendation dashboard
- Recommendation detail screen

## Components Created

- `RecommendationSummary`
- `RecommendationCard`
- `ReasonList`

## Shared Package Changes

- Added recommendation domain types to `@ctn/types`
- Added recommendation API response contracts and route constants to
  `@ctn/api-contracts`

## Technical Debt

- Public item detail for another collector's item is not built yet. The
  recommendation detail screen can route to your own matched item, but viewing
  a counterparty item needs a dedicated read-only item surface before offers.
- Title matching is literal substring matching. This is explainable but brittle.
- Recommendation freshness, dismissed matches, notification history, and
  read/unread state are not persisted yet.
- Values are not considered. That is acceptable for Sprint 6, but value
  compatibility must exist before serious offers.

## Known Issues

- Full automated verification is still blocked until dependencies are installed
  in this workspace.
- The mobile recommendation hook depends on the API being reachable; offline
  recommendation cache is not implemented.

## Self-Review

The core architecture is correct for this stage: deterministic, explainable,
and modular enough for later AI ranking. The largest product gap is item
inspection. Collectors will not trust matches unless they can inspect the other
collector's item in detail before making an offer.

## Updated MVP Completion Estimate

Approximate MVP completion: 52%.

The app now has onboarding, authenticated persistence, inventory, wishlist, and
the first Trade Graph discovery surface. The remaining core MVP work is offers,
contextual messaging, trade workflow, reputation, trust tooling, shipping
coordination, disputes, and admin operations.
