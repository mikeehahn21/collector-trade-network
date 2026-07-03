# Sprint 10 Deliverables: Trade Execution

## Summary

Sprint 10 adds the post-acceptance lifecycle for trades: shipping, receipt confirmation, final completion, and disputes.

## Implemented

- Added trade execution migration with:
  - proposer and counterparty shipping status
  - proposer and counterparty tracking numbers
  - proposer and counterparty carriers
  - completed timestamp
  - disputed timestamp
  - dispute reason
- Added `disputed` trade status.
- Added shared types for shipping status, carriers, shipping sides, ship input, and dispute input.
- Added Zod validation for shipping and dispute payloads.
- Added API contracts for:
  - `PATCH /v1/trades/:tradeId/ship`
  - `PATCH /v1/trades/:tradeId/receive`
  - `PATCH /v1/trades/:tradeId/complete`
  - `POST /v1/trades/:tradeId/dispute`
- Hardened the old generic trade status endpoint so `completed` is no longer accepted there.
- Added repository logic for:
  - shipping only the current user's own side
  - confirming receipt only after the counterparty side has shipped
  - completing only after both sides are delivered
  - opening disputes from active execution states
- Added trade conversation system events for shipped, received, completed, and disputed states.
- Enhanced mobile Trade Detail with:
  - shipping tracker for both sides
  - tracking number input
  - carrier selector
  - external tracking links
  - receipt confirmation
  - completion button gated by both delivered statuses
  - dispute reason input and report action

## Security Notes

- The server derives proposer/counterparty ownership from the trade record.
- Clients cannot choose which side to update.
- Completion cannot occur until both `proposerShipping.status` and `counterpartyShipping.status` are `delivered`.
- Generic status updates no longer support `completed`.

## Verification

Local package-based checks are still blocked in this sandbox by npm registry `EACCES` during dependency restore. Manus or GitHub Actions should run:

- `pnpm install --frozen-lockfile`
- `pnpm format`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Recommended QA Before Sprint 11

- Accept a trade as the counterparty.
- Proposer ships with tracking.
- Counterparty sees tracking and confirms receipt.
- Counterparty ships with tracking.
- Proposer sees tracking and confirms receipt.
- Complete Trade appears only after both sides are delivered.
- Open Trade Conversation and verify system events were posted.
- Attempt to complete early and confirm the API rejects it.
- Attempt to ship the same side twice and confirm the API rejects it.
