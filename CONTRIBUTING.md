# Contributing to Collector Trade Network

Thank you for contributing to the Collector Trade Network. This guide covers everything you need to get started, work within the codebase, and submit changes.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)

---

## Development Setup

### Prerequisites

| Tool           | Version       |
| -------------- | ------------- |
| Node.js        | >= 20.11.0    |
| pnpm           | >= 11.0.0     |
| Docker Desktop | Latest stable |

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/mikeehahn21/collector-trade-network.git
cd collector-trade-network

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env

# Start local services (PostgreSQL + Redis)
docker compose up -d postgres redis

# Run all quality checks to confirm setup
pnpm typecheck
pnpm lint
pnpm test
```

---

## Branch Strategy

This repository uses a trunk-based branching model with the following branches:

| Branch      | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `main`      | Production-ready code. Protected. Requires PR + review.                          |
| `develop`   | Integration branch for sprint work. All feature branches merge here first.       |
| `feature/*` | New features and enhancements (e.g., `feature/trade-graph-v2`).                  |
| `hotfix/*`  | Urgent production fixes branched from `main` (e.g., `hotfix/auth-token-expiry`). |
| `release/*` | Release preparation branches (e.g., `release/v1.0.0`).                           |

### Workflow

1. Branch from `develop` for all feature work.
2. Open a PR into `develop` when ready for review.
3. `develop` is merged into `main` at release time via a `release/*` branch.
4. Hotfixes branch from `main` and are merged into both `main` and `develop`.

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are enforced by commitlint.

### Format

```
<type>(<scope>): <short description>
```

### Types

| Type       | When to Use                                            |
| ---------- | ------------------------------------------------------ |
| `feat`     | A new feature                                          |
| `fix`      | A bug fix                                              |
| `docs`     | Documentation changes only                             |
| `style`    | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code change that is neither a fix nor a feature        |
| `test`     | Adding or updating tests                               |
| `chore`    | Build process, dependency updates, tooling             |
| `perf`     | Performance improvements                               |
| `ci`       | CI/CD configuration changes                            |

### Examples

```
feat(mobile): add recommendation detail screen
fix(api): resolve wishlist pagination off-by-one error
docs(adr): add ADR-0005 for image storage strategy
chore(deps): upgrade expo to 52.0.0
```

---

## Pull Request Process

1. Ensure all quality checks pass locally before opening a PR.
2. Fill out the PR template completely.
3. Link the PR to the relevant issue.
4. Request a review from at least one team member when the team has more than one human contributor.
5. Address all review comments before merging.
6. Squash merge into `develop` to keep history clean.

---

## Code Quality Standards

All code must pass the following gates before merging:

```bash
pnpm format:check   # Prettier formatting
pnpm typecheck      # TypeScript strict mode
pnpm lint           # ESLint
pnpm test           # Unit tests
```

- TypeScript strict mode is enabled across all packages.
- No `any` types without explicit justification in a comment.
- All exported functions and types must have JSDoc comments.

---

## Testing Requirements

| Layer                  | Tool       | Requirement                          |
| ---------------------- | ---------- | ------------------------------------ |
| Unit tests             | Vitest     | Required for all business logic      |
| Integration tests      | Vitest     | Required for API routes              |
| E2E tests              | Playwright | Required for critical user flows     |
| Mobile component tests | Vitest     | Required for state and utility logic |

New features must include tests. Bug fixes must include a regression test.

---

## Documentation Standards

- Update `docs/sprint-X-deliverables.md` at the end of each sprint.
- Add an ADR to `docs/decisions/` for any significant architectural decision.
- Update `CHANGELOG.md` for every user-facing change.
- Keep `README.md` current with any setup or workflow changes.

---

## Questions?

Open an issue with the `documentation` label or reach out to the founding team.
