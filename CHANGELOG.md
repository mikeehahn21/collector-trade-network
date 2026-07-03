# Changelog

All notable changes to the Collector Trade Network are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Sprint 6: Deterministic Trade Graph Engine v1
- Authenticated recommendation APIs
- Explainable recommendation scoring
- Home recommendation dashboard
- Recommendation detail screen

---

## [0.6.0] — 2026-07-03

### Added

- Trade Graph Engine v1 with deterministic, explainable scoring
- `trade-graph.repository.ts` for graph data persistence
- `match-generation.ts` for candidate pair generation
- `scoring.ts` with weighted multi-factor scoring algorithm
- `recommendation-engine.ts` orchestration layer
- `recommendations.routes.ts` — authenticated REST endpoints
- Mobile recommendation state management (`recommendation-state.tsx`)
- `recommendation-card.tsx`, `recommendation-summary.tsx`, `reason-list.tsx` components
- `recommendation-display.ts` utility library
- ADR-0004: Trade Graph v1 Scoring Strategy

---

## [0.5.0] — 2026-07-02

### Added

- Clerk integration path for authentication
- Authenticated user identity mapped to internal user records
- Server-first inventory and wishlist sync path
- Mobile API client and sync bootstrap
- Protected routes in mobile app
- Image picker foundation
- ADR-0003: Auth and Sync Strategy

---

## [0.4.0] — 2026-07-02

### Added

- Server-side user and access model
- Auth and persistence hardening
- User, item, and wishlist repository structure
- PostgreSQL migration: `1719999999999_users_access.ts`

---

## [0.3.0] — 2026-07-02

### Added

- Wishlist and Grails feature
- Wishlist home, detail, edit, archive, and save flows
- Grail limits and demand-side data model
- Home counts for tradeable items, wishlist, and Grails
- PostgreSQL migration: `1720000000001_wishlist_grails.ts`

---

## [0.2.0] — 2026-07-02

### Added

- Collection Engine (inventory management)
- Inventory home, add, edit, detail, photo manager screens
- Condition, trade preferences, and communication settings flows
- Draft, publish, archive, and delete item flows
- Item database schema and item API foundation
- PostgreSQL migration: `1720000000000_collection_engine.ts`

---

## [0.1.0] — 2026-07-02

### Added

- Premium invite, access, and onboarding flow
- Welcome, login, create account, invite, application, waitlist screens
- Verification, pending approval, onboarding preferences flows
- First Home screen

---

## [0.0.0] — 2026-07-02

### Added

- Monorepo foundation with Turborepo
- Expo React Native mobile application (`apps/mobile`)
- Fastify Node.js TypeScript API (`apps/api`)
- Next.js admin dashboard shell (`apps/admin`)
- PostgreSQL migration structure
- Shared packages: `types`, `validation`, `constants`, `api-contracts`, `utils`
- CI pipeline with GitHub Actions
- Linting, formatting, and test scaffolding
- Husky pre-commit hooks with commitlint
- ADR-0001: Architecture Foundation
- ADR-0002: Dependency Lockfile Strategy

[Unreleased]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mikeehahn21/collector-trade-network/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/mikeehahn21/collector-trade-network/releases/tag/v0.0.0
