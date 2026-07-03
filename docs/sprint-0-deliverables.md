# Sprint 0 Deliverables

## Repository Structure

```text
apps/
  admin/   Next.js internal operations dashboard
  api/     Node.js TypeScript modular monolith
  e2e/     Playwright E2E harness
  mobile/  Expo React Native app
packages/
  api-contracts/
  constants/
  types/
  utils/
  validation/
docs/
  decisions/
  product/
infra/
  README.md
```

## Technology Decisions

- TypeScript monorepo managed by pnpm workspaces and Turborepo.
- Expo Router for mobile navigation foundation.
- Fastify for the API modular monolith.
- PostgreSQL for durable storage.
- Redis and BullMQ for background jobs.
- Next.js App Router for admin.
- Zod for validation boundaries.
- Vitest for unit and integration test harnesses.
- Playwright for web/admin E2E.
- ESLint, Prettier, Husky, lint-staged, and conventional commits for quality.

## Product Constraints Captured

- No feature tables in Sprint 0.
- No unrestricted direct messaging.
- Future conversations must be contextual: item, trade, or system.
- Trade-first behavior must remain distinct from cash-only marketplace behavior.

## Verification Status

Completed locally:

- Repository structure check.
- JSON syntax validation for package/config files.
- Static review of product constraints.

Blocked locally:

- Dependency installation.
- Type checking.
- Linting.
- Tests.
- Builds.

Reason: this environment cannot access the npm registry. `pnpm install` fails
with `EACCES` while fetching packages.

## Required Follow-Up

In a network-enabled environment:

1. Run `pnpm install`.
2. Commit `pnpm-lock.yaml`.
3. Run `pnpm typecheck`.
4. Run `pnpm lint`.
5. Run `pnpm test`.
6. Run `pnpm test:e2e`.
7. Run `pnpm build`.
8. Change CI install back to `pnpm install --frozen-lockfile`.
