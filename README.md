# Collector Trade Network

> AI-powered trusted social trading network for collectors. MVP wedge: Vintage T-shirts.

[![CI](https://github.com/mikeehahn21/collector-trade-network/actions/workflows/ci.yml/badge.svg)](https://github.com/mikeehahn21/collector-trade-network/actions/workflows/ci.yml)

---

## Product North Star

Help serious collectors complete trusted trades that improve their collections.

This platform is **trade-first, not marketplace-first**. Collectors discover potential trades through a deterministic, explainable recommendation engine — not through a public marketplace feed.

---

## Repository Layout

| Path                     | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `apps/mobile`            | Expo React Native mobile application              |
| `apps/api`               | Node.js TypeScript modular monolith API (Fastify) |
| `apps/admin`             | Next.js internal admin dashboard                  |
| `apps/e2e`               | Playwright end-to-end test suite                  |
| `packages/types`         | Shared domain types                               |
| `packages/validation`    | Shared Zod validation schemas                     |
| `packages/constants`     | Shared application constants                      |
| `packages/api-contracts` | Shared API request/response contracts             |
| `packages/utils`         | Shared utility functions                          |
| `infra/`                 | Infrastructure notes and deployment preparation   |
| `docs/`                  | Sprint deliverables, ADRs, and product documents  |
| `.github/`               | CI workflows, issue templates, and PR template    |

---

## Prerequisites

| Tool           | Version       |
| -------------- | ------------- |
| Node.js        | >= 20.11.0    |
| pnpm           | >= 11.0.0     |
| Docker Desktop | Latest stable |

---

## Local Setup

```bash
# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env

# Start local services
docker compose up -d postgres redis

# Start all apps in development mode
pnpm dev
```

---

## Quality Gates

Run these before every pull request:

```bash
pnpm format:check   # Prettier
pnpm typecheck      # TypeScript strict mode
pnpm lint           # ESLint
pnpm test           # Unit tests (Vitest)
pnpm test:e2e       # E2E tests (Playwright)
pnpm build          # Production build
```

---

## Branch Strategy

| Branch      | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `main`      | Production-ready code. Protected.                      |
| `develop`   | Sprint integration branch.                             |
| `feature/*` | Feature branches (e.g., `feature/public-item-detail`). |
| `hotfix/*`  | Urgent production fixes.                               |
| `release/*` | Release preparation.                                   |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

---

## Sprint History

| Sprint   | Focus                                        | Status   |
| -------- | -------------------------------------------- | -------- |
| Sprint 0 | Monorepo foundation, CI, shared packages     | Complete |
| Sprint 1 | Invite-only onboarding                       | Complete |
| Sprint 2 | Collection Engine (inventory)                | Complete |
| Sprint 3 | Wishlist & Grails                            | Complete |
| Sprint 4 | Auth & persistence hardening                 | Complete |
| Sprint 5 | Clerk integration & server sync              | Complete |
| Sprint 6 | Trade Graph Engine v1                        | Complete |
| Sprint 7 | Public Item Detail + Recommendation Feedback | Planned  |

Full sprint details are in [`docs/`](./docs/).

---

## Architecture Decisions

Key architectural decisions are documented as ADRs in [`docs/decisions/`](./docs/decisions/):

- [ADR-0001](./docs/decisions/0001-architecture-foundation.md) — Architecture Foundation
- [ADR-0002](./docs/decisions/0002-dependency-lockfile.md) — Dependency Lockfile Strategy
- [ADR-0003](./docs/decisions/0003-auth-sync-strategy.md) — Auth and Sync Strategy
- [ADR-0004](./docs/decisions/0004-trade-graph-v1-scoring.md) — Trade Graph v1 Scoring

---

## Product Boundaries

The following are permanent product constraints:

- No cash-only marketplace behavior.
- No unrestricted direct messaging. Communication is contextual: item, trade, or system.
- Recommendations are deterministic and explainable.
- No offers, trade execution, shipping, or disputes have been implemented yet.

---

## Documentation

| Document                | Location                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| Roadmap                 | [ROADMAP.md](./ROADMAP.md)                                           |
| Changelog               | [CHANGELOG.md](./CHANGELOG.md)                                       |
| Contributing            | [CONTRIBUTING.md](./CONTRIBUTING.md)                                 |
| Security                | [SECURITY.md](./SECURITY.md)                                         |
| Product Source of Truth | [docs/product/source-of-truth.md](./docs/product/source-of-truth.md) |
| Infrastructure          | [infra/README.md](./infra/README.md)                                 |
