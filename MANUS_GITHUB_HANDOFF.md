# Manus GitHub Handoff

## Objective

Push the Collector Trade Network codebase to GitHub in an organized first
repository commit.

Do not start Sprint 7. This handoff is only for repository setup, commit
organization, and GitHub upload.

## Current State

This workspace currently contains the app monorepo, but the local `.git`
directory is not valid. Running `git status` reports:

```text
fatal: not a git repository (or any of the parent directories): .git
```

The workspace root also contains unrelated webinar/media artifacts. Be careful
not to commit those files into the startup repository.

## Product Context

The project is an invite-first, trust-first collector trading network. The MVP
wedge is Vintage T-shirts. The app is trade-first, not marketplace-first.

Approved product boundaries:

- No cash-only marketplace behavior.
- No unrestricted direct messaging.
- Communication must remain contextual: item, trade, or system.
- Recommendations in Sprint 6 are deterministic and explainable.
- No offers, trade execution, shipping, disputes, or contextual messaging have
  been implemented yet.

## Recommended Repository Name

Use one of:

- `collector-trade-network`
- `trade-graph`
- the final company name if already decided

## Files And Folders To Commit

Commit these project files and folders:

- `.github/`
- `.husky/`
- `apps/`
- `docs/`
- `infra/`
- `packages/`
- `.editorconfig`
- `.env.example`
- `.gitignore`
- `.prettierignore`
- `.prettierrc.json`
- `commitlint.config.cjs`
- `docker-compose.yml`
- `eslint.config.mjs`
- `lint-staged.config.cjs`
- `package.json`
- `pnpm-workspace.yaml`
- `README.md`
- `tsconfig.base.json`
- `turbo.json`
- `MANUS_GITHUB_HANDOFF.md`

## Files And Folders Not To Commit

Do not commit unrelated webinar/media artifacts:

- `assets/`
- `facebook-assets/`
- `facebook-video-frames/`
- `facebook-video-frames-winrt/`
- `thumb-check/`
- `thumb-check-final/`
- `extract-facebook-video-frames.mjs`
- `First-Time-Homebuyer-Webinar-*.pptx`
- `*.inspect.ndjson`

Do not commit dependency caches or local tool state:

- `.agents/`
- `.codex/`
- `.pnpm-store/`
- `node_modules/`

## Suggested Git Setup

Because `.git` is invalid, either remove the broken `.git` directory and
initialize a fresh repo, or create a clean folder and copy only the committed
project files listed above.

Recommended approach:

1. Create a clean repository folder.
2. Copy only the project files and folders from the commit list.
3. Initialize Git in the clean folder.
4. Commit as `chore: initialize collector trade network foundation`.
5. Push to GitHub.

## Suggested Initial Commit Message

```text
chore: initialize collector trade network foundation
```

## What Has Been Built

### Sprint 0

- Monorepo foundation.
- Expo React Native mobile app.
- Fastify Node/TypeScript API.
- Next.js admin shell.
- PostgreSQL migration structure.
- Shared packages for types, validation, constants, contracts, and utilities.
- CI, linting, formatting, and test scaffolding.

### Sprint 1

- Premium invite/access/onboarding flow.
- Welcome, login, create account, invite, application, waitlist, verification,
  pending approval, onboarding preferences, and first Home screen.

### Sprint 2

- Collection engine.
- Inventory home, add/edit/detail, photo manager, condition, trade preferences,
  communication settings, draft/publish/archive/delete flows.
- Item database schema and item API foundation.

### Sprint 3

- Wishlist and Grails.
- Wishlist home/detail/edit/archive/save.
- Grail limits and demand-side data model.
- Home counts for tradeable items, wishlist, and Grails.

### Sprint 4

- Server-side user/access model.
- Auth and persistence hardening.
- User, item, and wishlist repository structure.

### Sprint 5

- Clerk integration path.
- Authenticated user identity mapped to internal user records.
- Server-first inventory and wishlist sync path.
- Mobile API client, sync bootstrap, protected routes, and image picker
  foundation.

### Sprint 6

- Deterministic Trade Graph Engine v1.
- Authenticated recommendation APIs.
- Explainable recommendation scoring.
- Home recommendation dashboard.
- Recommendation detail screen.

## Important Technical Notes

The app is not fully verified yet because package installation is blocked in
the current Codex environment. Pnpm tries to resolve registry packages and fails
because network access is unavailable and the local pnpm cache is incomplete.

Known verification status:

- JSON/config syntax check passed.
- Sprint 6 file presence check passed.
- Full typecheck, lint, tests, and mobile build have not run successfully yet.

After GitHub push, run these in a normal development environment:

```text
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Current CTO Warnings

Before Sprint 7, the biggest product gap is public read-only item detail for a
counterparty item. Recommendation discovery now exists, but collectors need to
inspect the other collector's item before offers can be credible.

Do not build offers before item inspection is solved.

## Suggested GitHub Repository Setup

Create these branch protections after the first push:

- Require pull requests into `main`.
- Require typecheck, lint, and tests once CI is running.
- Disallow force-pushes to `main`.
- Require at least one approving review when there is more than one human
  contributor.

Create these GitHub secrets later, not during this initial push:

- `CLERK_SECRET_KEY`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `SENTRY_DSN`
- `POSTHOG_KEY`
- `OPENAI_API_KEY`

## Recommended Next Sprint

After the GitHub repository is clean and dependencies are installable, Sprint 7
should probably be:

`Public Item Detail + Recommendation Feedback`

Reason: offers should not start until collectors can inspect matched
counterparty items and give feedback on weak recommendations.
