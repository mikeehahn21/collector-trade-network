# Sprint 11 Deliverables: Trust and Safety Verification

## Summary

Sprint 11 adds proof-of-life item verification and gates public item visibility behind successful AI review. Items can still be drafted and published internally, but they do not appear in public item detail, recommendations, item conversations, or trade creation until verification is successful.

## Implemented

- Added item verification database fields:
  - `verification_video_url`
  - `verification_status`
  - `verification_failed_reason`
  - `verified_at`
  - `ai_metadata`
- Added shared types for item verification status, AI metadata, video upload input, and AI review webhook input.
- Added validation for:
  - 5-30 second verification videos
  - 4-digit verification codes
  - AI review webhook results
- Added API contracts and routes for:
  - `POST /v1/items/:itemId/verification-video`
  - `GET /v1/items/:itemId/verification-status`
  - `POST /v1/webhooks/ai-review`
- Added owner-only enforcement for verification video submission and status polling.
- Added optional `AI_REVIEW_WEBHOOK_SECRET` support for internal webhook protection.
- Added verified-before-public enforcement in:
  - public item detail lookup
  - Trade Graph recommendation dataset
  - trade creation item lookup
  - item conversation creation
- Added mobile guided verification workflow:
  - dynamic 4-digit code
  - recording guide: front, back, tag, flaws, rotate
  - camera video capture via Expo image picker
  - duration validation before upload
  - guided overlay screen
- Added item detail verification states:
  - CTN Verified
  - Review in progress
  - Verification failed with re-verify action
- Added CTN Verified badge to public item detail.

## Technical Notes

- The repository uses an `items` table rather than `tradeable_items`; Sprint 11 fields were added to `items`.
- Multipart/S3 upload is represented by a placeholder `videoUrl` API payload in this sprint because the current workspace does not include a multipart parser or storage adapter. The route is isolated so a production S3/R2 multipart implementation can replace the placeholder without changing the mobile flow.
- AI review is webhook-driven. The mock integration updates verification status and stores extracted metadata, but does not run real video analysis yet.

## Quality Gate Status

Local package checks are still blocked in this sandbox by npm registry `EACCES` during dependency restore. Manus or GitHub Actions should run:

- `pnpm install --frozen-lockfile`
- `pnpm format`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Recommended QA Before Sprint 12

- Create a tradeable item.
- Confirm public item detail returns 404 while verification is pending.
- Submit a 4-second video and verify the app blocks it.
- Submit a 12-second video and verify status becomes pending.
- Send an AI review webhook result with `verified`.
- Confirm public item detail shows the CTN Verified badge.
- Confirm the item appears in recommendations only after verification.
- Send an AI review webhook result with `failed`.
- Confirm item detail shows the failure reason and re-verify action.
