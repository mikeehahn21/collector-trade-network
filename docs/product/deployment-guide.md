# Konnesor Deployment Guide

This guide covers the production deployment process for the Konnesor platform, including the API backend and the mobile app.

## 1. Environment Variables

### API (`apps/api/.env`)

```env
APP_ENV=production
API_PORT=4000
API_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
REDIS_URL=redis://:pass@host:6379
LOG_LEVEL=info
CLERK_SECRET_KEY=sk_live_...
CLERK_ISSUER=https://clerk.konnesor.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
AI_REVIEW_WEBHOOK_SECRET=...
SENTRY_DSN=https://...
```

### Mobile App (EAS Secrets)

Set these in the Expo dashboard under project secrets, or pass them during build:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.konnesor.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_SENTRY_DSN=https://...
EXPO_PUBLIC_POSTHOG_API_KEY=phc_...
EXPO_PUBLIC_ONESIGNAL_APP_ID=...
```

## 2. Database Provisioning & Backups

1. Provision a PostgreSQL 15+ database (e.g., AWS RDS, Supabase, Neon).
2. Provision a Redis instance for BullMQ background jobs.
3. **Backups:** Configure automated daily snapshots with a 7-day retention period. Enable Point-In-Time Recovery (PITR) if supported by your provider.
4. Run migrations before starting the API:
   ```bash
   pnpm --filter @ctn/api db:migrate
   ```

## 3. API Deployment

The API is a Fastify Node.js application. It can be deployed to any container-based platform (Railway, Render, Fly.io, AWS ECS).

1. Build the monorepo:
   ```bash
   pnpm turbo build --filter=@ctn/api
   ```
2. Start the server:
   ```bash
   pnpm --filter @ctn/api start
   ```
3. Ensure the health check endpoint (`/health`) is configured in your load balancer to monitor both HTTP response and database connectivity.

## 4. Mobile App Build (EAS)

The mobile app is built using Expo Application Services (EAS).

### iOS (TestFlight / App Store)

```bash
cd apps/mobile
eas build --platform ios --profile production
```

Once the build completes, you can submit it to App Store Connect:

```bash
eas submit -p ios
```

### Android (Play Store / APK)

```bash
cd apps/mobile
eas build --platform android --profile production
```

## 5. Monitoring & Observability

- **Errors:** Sentry is configured for both the API and the mobile app. Check the Sentry dashboard for unhandled exceptions and crashes.
- **Performance:** Sentry tracing is enabled (20% sample rate in production).
- **Logs:** The API outputs structured JSON logs via Pino. In production, pipe these logs to a centralized logging service (e.g., Datadog, CloudWatch).
- **Rate Limiting:** The API enforces a strict rate limit of 100 requests per minute per IP in production to prevent abuse.
