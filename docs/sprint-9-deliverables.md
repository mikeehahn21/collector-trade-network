# Sprint 9 Deliverables: Contextual Trade Conversations

## Summary

Sprint 9 adds contextual messaging for the Collector Trade Network. Conversations are not generic direct messages. A conversation must be tied to an item, a trade, or a reserved system context.

## Implemented

- Added database infrastructure for `conversations`, `messages`, and `conversation_participants`.
- Added archive triggers so item and trade conversations are archived if the underlying context is deleted.
- Added shared conversation, message, participant, typing, and read receipt types.
- Added Zod validation for conversation creation, sending messages, read receipts, and typing events.
- Added API contracts for conversation routes.
- Added Fastify routes for:
  - `POST /v1/conversations`
  - `GET /v1/conversations`
  - `GET /v1/conversations/:conversationId`
  - `GET /v1/conversations/:conversationId/messages`
  - `POST /v1/conversations/:conversationId/messages`
  - `PATCH /v1/messages/:messageId/read`
  - `POST /v1/conversations/typing`
- Added API repository and service layers for contextual conversation authorization.
- Added mobile conversation list and chat detail screens.
- Added `Contact Owner` from public item detail.
- Added `Open Trade Conversation` from trade detail.
- Added a `Messages` home navigation entry.
- Added baseline polling every 5 seconds in the chat view.
- Added typing heartbeat support and read receipt display.
- Added validation and API contract test coverage for the new boundary.

## Product Guardrails

- Users cannot create system conversations from the client.
- Users cannot create person-to-person conversations without an item or trade context.
- Item conversations derive participants from the public item owner and current viewer. Each contacting collector gets a separate item-context conversation.
- Trade conversations derive participants from trade proposer and counterparty. Each trade has one shared trade-context conversation.
- Message send, read receipt, and typing endpoints all require conversation participation.

## Technical Notes

- Realtime chat is intentionally polling-based for V1. The API shape can later support WebSockets without changing mobile screen ownership.
- Image messages are accepted as a message type, but upload/storage is still a placeholder until the image pipeline is fully wired.
- Read receipts are stored as message-level `read_at` plus participant-level `last_read_*`. This is acceptable for two-party V1 conversations but should become per-recipient if group contexts are ever added.

## Verification

Local `pnpm typecheck` and `pnpm lint` were attempted, but this sandbox cannot restore packages from npm. The commands timed out after repeated `EACCES` registry errors. GitHub Actions or Manus should run the full quality gate with network access:

- `pnpm install --frozen-lockfile`
- `pnpm format`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Recommendation Before Sprint 10

Before moving to shipping/disputes, verify the conversation flow in a seeded two-user environment:

- User A contacts User B from an item.
- User A proposes a trade.
- Both users can open the trade conversation.
- Messages remain inaccessible to non-participants.
- Read receipts and unread counts behave correctly after polling.
