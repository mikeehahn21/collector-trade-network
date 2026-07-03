# Sprint 7 Deliverables - Public Item Detail + Recommendation Feedback

## Summary

Sprint 7 added the missing inspection and feedback layer between recommendations
and future offers. Collectors can now open a read-only item detail screen from a
recommendation, and they can mark a recommendation as helpful or not relevant.

This sprint intentionally does not add offers, trade execution, contextual
messaging, shipping, or disputes.

## GitHub Issues Covered

- #9: Public read-only item detail endpoint
- #10: Public item detail screen for counterparty items
- #11: Recommendation feedback endpoint
- #12: Recommendation feedback UI
- #13: `recommendation_feedback` database migration
- #14: Recommendation quality metrics dashboard

## API

New endpoints:

- `GET /v1/public/items/:itemId`
- `POST /v1/recommendations/:recommendationId/feedback`
- `GET /v1/admin/recommendation-feedback/metrics`

Public item detail still requires an authenticated user. In this product,
"public" means read-only visibility inside the approved collector network, not
anonymous web access.

Recommendation feedback is accepted only for recommendations that the current
Trade Graph can regenerate for the authenticated user.

## Database

Added migration:

- `1720000000002_recommendation_feedback.ts`

The table stores one feedback record per user and recommendation. Re-submitting
feedback updates the existing row.

## Mobile

Added:

- read-only public item detail screen
- recommendation feedback buttons
- API client methods for public item detail and feedback submission

The recommendation detail screen now opens the counterparty item first when one
exists.

## Admin

The admin home page now includes recommendation quality metrics:

- total feedback
- helpful count
- not relevant count
- helpful rate
- top negative reasons

The API metrics endpoint is admin-protected. Until admin token forwarding is
fully wired, the admin page displays a graceful unavailable state if metrics
cannot be fetched.

## CTO Notes

This creates the minimum credible bridge from discovery to future offers.
Collectors can inspect the other side of a match and the platform can learn
which deterministic recommendations are weak.

Before implementing offers, the next risk to address is item trust quality:
photos, measurements, flaws, and owner reputation must be sufficiently visible
to make a trade offer feel safe.
