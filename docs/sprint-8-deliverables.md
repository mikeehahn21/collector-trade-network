# Sprint 8 Deliverables - Trade Offer Flow

## Summary

Sprint 8 adds the first transaction layer for Collector Trade Network. Users can
propose item-for-item trades, review incoming and sent offers, accept or decline
incoming offers, cancel sent offers, submit counter offers, and mark accepted
trades completed.

This sprint intentionally does not add payments, shipping labels, disputes,
authentication centers, or unrestricted messaging.

## Database

Added migration:

- `1720000000003_trades.ts`

The `trades` table records proposer, counterparty, both item IDs, status,
participant notes, and timestamps.

Trade statuses:

- `pending`
- `accepted`
- `declined`
- `countered`
- `cancelled`
- `completed`

Accepted trades reserve the involved items. Completed trades mark the involved
items as traded.

## API

Added authenticated trade endpoints:

- `POST /v1/trades`
- `GET /v1/trades`
- `GET /v1/trades/:tradeId`
- `PATCH /v1/trades/:tradeId/status`
- `POST /v1/trades/:tradeId/counter`

The API validates all trade payloads with Zod and enforces participant-level
authorization for accept, decline, cancel, complete, and counter actions.

Notification integration is a placeholder logger call in Sprint 8. It is shaped
so OneSignal can be wired without changing the route contracts.

## Shared Packages

Updated:

- `@ctn/types`
- `@ctn/validation`
- `@ctn/api-contracts`

New trade entities include `Trade`, `TradeStatus`, `CreateTradeInput`,
`CounterTradeInput`, `UpdateTradeStatusInput`, and trade response contracts.

## Mobile

Added:

- trade proposal screen
- trade list screen
- trade detail screen
- accepted trade confirmation panel
- counter-offer item selection

The Sprint 7 public item detail screen now has a functional `Propose Trade`
button.

## Tests

Added coverage for:

- trade API route constants
- trade validation schemas
- trade status permission logic

## Verification Notes

Local quality commands could not complete in this Codex sandbox because package
installation attempts to download npm dependencies and network access is
blocked. The lockfile is present and unchanged.

Run in GitHub Actions or a normal local development environment:

- `pnpm install --frozen-lockfile`
- `pnpm format`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
