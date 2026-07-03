# Trade Graph v1 Scoring

## Status

Accepted for Sprint 6.

## Context

The first recommendation engine must earn trust before it becomes clever. V1
therefore uses deterministic matching over server-backed inventory and wishlist
data. No speculative AI ranking is used.

## Decision

Recommendations are generated at read time from:

- active approved users
- visible active wishlist items
- visible tradeable inventory
- category overlap
- exact versus similar wishlist preference
- size compatibility
- Grail priority
- mutual supply and demand

The engine is split into three concerns:

- match generation: find collector-to-collector candidate relationships
- scoring: assign deterministic points to candidate relationships
- explanation: return the exact reasons and point values shown to users

Recommendations are not stored in a database table yet. Persisting generated
matches will become useful when we need notification history, dismissed matches,
freshness windows, or offline recommendation caches.

## Scoring Model

Scores are capped at 100.

- Their item matches your wishlist: 20
- Your item matches their wishlist: 20
- Mutual demand: 30
- Grail match: 25
- Exact match: 20
- Similar match accepted: 8
- Category overlap: 5 per shared category, capped at 15
- Size compatibility: 6 per compatible size, capped at 18
- Active tradeable inventory: 10
- Approved collector profile: 5

Confidence is derived from the final score:

- high: 75+
- medium: 45-74
- low: below 45

## Consequences

This model is easy to explain and debug. It will also produce imperfect
recommendations when title matching is too literal, when values differ widely,
or when a collector has sparse metadata. Those gaps are intentional learning
inputs for later AI-assisted ranking and value balancing.

Before offers ship, we should add public item detail for counterparty inventory
and a feedback action for dismissing weak recommendations.
