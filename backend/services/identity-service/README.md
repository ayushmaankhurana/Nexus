# Identity & Session Service

## Purpose

Owns student identity, account credentials, device bindings, and sessions.  
Ensures that each student has **one active device** at a time.

- Student accounts are created and managed by campus admins (`admin` role).
- Students do not self-register with personal emails; public signup is NOT supported.
- Students receive an email activation link to set their password.
- Login uses roll number + password (primary) or official campus email + password (secondary).

## Owns

- Student profile (roll no, name, program, batch, contact)
- Account credentials (password hash / SSO link / auth provider metadata)
- Device registrations and identifiers
- Device-to-student bindings
- Session tokens / refresh tokens

## Responsibilities

- Register new students into NEXUS
- Authenticate students for the mobile app
- Enforce one-active-device-per-student:
  - New device login can revoke or require admin approval
- Provide basic identity info to other services (via API/contract)
- Expose RBAC claims (roles: student, security, admin, staff)

## Not Responsible For

- Campus structure (buildings, rooms)
- Attendance logic
- Location or presence
- Reliability score calculation