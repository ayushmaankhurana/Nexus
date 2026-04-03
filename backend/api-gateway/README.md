# API Gateway

## Purpose

Single HTTP/WebSocket entrypoint for mobile apps and web dashboard.

### Auth model

- Admin-provisioned accounts only, no public self-service signup.
- Student logins are roll number + password primarily, with official campus email as a secondary identifier.
- Supports account activation via invite link and one-active-device session rules.

## Responsibilities

- Terminate HTTP(S) and WebSocket connections
- Handle authentication/authorization (via Identity service)
- Route requests to:
  - Domain services under `backend/services`
  - `backend/realtime` for live updates
- Aggregate data for high-level endpoints (e.g., "student overview" for dashboard)
- Enforce rate limits, basic request validation, and API versioning

## Not Responsible For

- Business logic
- Data storage
- Domain decisions (delegated to services)