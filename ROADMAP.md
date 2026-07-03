# Collector Trade Network — Product Roadmap

This document describes the high-level product roadmap. It is a living document and will be updated as priorities evolve. Specific sprint details are tracked in the GitHub project board and in `docs/sprint-X-deliverables.md`.

---

## Guiding Principles

The Collector Trade Network is **trade-first, not marketplace-first**. Every feature decision is evaluated against the product north star:

> Help serious collectors complete trusted trades that improve their collections.

The following constraints are permanent product boundaries:

- No cash-only marketplace behavior.
- No unrestricted direct messaging. Communication must remain contextual: item, trade, or system.
- Recommendations must be deterministic and explainable.
- Trust is built through the network, not through anonymous ratings.

---

## Completed Milestones

| Milestone                     | Status   | Summary                                                        |
| ----------------------------- | -------- | -------------------------------------------------------------- |
| Sprint 0 — Foundation         | Complete | Monorepo, CI, shared packages, API, mobile, admin shells       |
| Sprint 1 — Onboarding         | Complete | Invite-only access, account creation, onboarding preferences   |
| Sprint 2 — Collection Engine  | Complete | Inventory management, item lifecycle, photo management         |
| Sprint 3 — Wishlist & Grails  | Complete | Wishlist, Grail limits, demand-side data model                 |
| Sprint 4 — Auth & Persistence | Complete | Server-side user model, repository structure, auth hardening   |
| Sprint 5 — Clerk & Sync       | Complete | Clerk integration, authenticated sync, protected routes        |
| Sprint 6 — Trade Graph Engine | Complete | Deterministic recommendation engine, scoring, mobile dashboard |

---

## Active Milestone

### Sprint 7 — Public Item Detail + Recommendation Feedback

**Goal:** Enable collectors to inspect a counterparty's item before any offer can be credible, and collect feedback on weak recommendations to improve the engine.

**Rationale:** Offers should not start until collectors can inspect matched counterparty items. Recommendation feedback is the first signal loop for improving match quality.

Proposed scope:

- Public read-only item detail screen for counterparty items
- Recommendation feedback mechanism (thumbs up / thumbs down with reason)
- Feedback persistence in the trade graph repository
- Basic recommendation quality metrics in the admin dashboard

---

## Upcoming Milestones

### Future Beta

Invite-only beta with a small cohort of verified vintage T-shirt collectors.

Focus areas: trade proposal flow, contextual messaging (item and trade scoped), trust signals, and collection completeness scoring.

### Private Beta

Expanded invite pool. Introduction of trade execution, shipping coordination, and dispute resolution foundations.

### Public Beta

Open registration with invite throttling. Full trade lifecycle, push notifications, and social proof signals.

### MVP / Version 1.0

Production-hardened release. Full trade lifecycle, verified collector profiles, category expansion beyond vintage T-shirts.

---

## Out of Scope (Current Phase)

The following are explicitly deferred until after MVP:

- Cash-only marketplace or buy-it-now pricing
- Unrestricted direct messaging
- Automated trade valuation
- Third-party authentication beyond Clerk
- Native iOS/Android app store distribution (Expo Go / EAS Build first)

---

_Last updated: 2026-07-03_
