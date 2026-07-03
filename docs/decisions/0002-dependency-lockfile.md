# ADR 0002: Dependency Lockfile Bootstrap

## Status

Accepted for Sprint 0 bootstrap

## Context

This local environment cannot access the npm registry, so dependency installation
and lockfile generation are blocked until a network-enabled environment runs
`pnpm install`.

## Decision

CI uses `pnpm install --no-frozen-lockfile` during Sprint 0 bootstrap. After the
first successful networked install, commit `pnpm-lock.yaml` and change CI back to
`pnpm install --frozen-lockfile`.

## Consequence

This is a temporary bootstrap compromise, not the desired long-term dependency
policy.
