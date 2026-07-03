# Security Policy

## Supported Versions

This project is in active pre-release development. Security fixes are applied to the latest version on `main` only.

| Version         | Supported |
| --------------- | --------- |
| Latest (`main`) | Yes       |
| Older commits   | No        |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a security vulnerability, contact the founding team directly. Include as much detail as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any proof-of-concept code or screenshots
- Your suggested fix, if you have one

You will receive an acknowledgment within 48 hours and a resolution timeline within 7 days.

---

## Security Practices

### Secrets Management

- All secrets are stored as GitHub repository secrets and injected at runtime.
- No secrets, API keys, or credentials are committed to the repository.
- The `.env` file is gitignored. Only `.env.example` files with placeholder values are committed.

### Authentication

- User authentication is handled by Clerk. No passwords are stored in the application database.
- Internal user records are linked to Clerk user IDs, not to raw credentials.

### API Security

- All API routes that access user data require a valid Clerk session token.
- The API validates and decodes tokens server-side before processing any request.

### Database

- The database is not publicly accessible. It is only reachable from the API service.
- All database queries use parameterized statements via the repository layer.

### Dependencies

- Dependencies are pinned via `pnpm-lock.yaml`.
- Dependabot alerts are monitored and addressed promptly.

---

## GitHub Secrets Required for Production

The following secrets must be configured in the repository before deploying to any environment:

| Secret                              | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `CLERK_SECRET_KEY`                  | Clerk server-side authentication |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk mobile client key          |
| `DATABASE_URL`                      | PostgreSQL connection string     |
| `STRIPE_SECRET_KEY`                 | Payment processing (future)      |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`       | Object storage access            |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`   | Object storage secret            |
| `SENTRY_DSN`                        | Error monitoring                 |
| `POSTHOG_KEY`                       | Product analytics                |
| `OPENAI_API_KEY`                    | AI features                      |
