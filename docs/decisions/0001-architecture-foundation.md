# ADR 0001: Sprint 0 Architecture Foundation

## Status

Accepted

## Decision

Use a TypeScript monorepo with:

- Expo React Native for mobile.
- Next.js for admin.
- Fastify-based Node.js API as a modular monolith.
- PostgreSQL as the system of record.
- Shared packages for domain types, validation, constants, utilities, and API
  contracts.

## Rationale

The product needs fast iteration, strong typing, and clear module boundaries
without the operational complexity of microservices. A modular monolith is the
right starting point because the platform needs coherent trade, trust,
conversation, recommendation, and admin workflows before independent services are
justified.

## Constraints

- No feature tables in Sprint 0.
- No unrestricted messaging architecture.
- Conversations must be contextual when implemented: item, trade, or system.
- Cash-only buying/selling must not become a first-class product behavior.

## Consequences

The backend can evolve into service boundaries later, but early development keeps
transactional logic and observability in one deployable unit.
