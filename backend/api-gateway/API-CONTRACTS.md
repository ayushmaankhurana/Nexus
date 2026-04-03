# API Contracts

## Overview

NEXUS external API is a REST-first contract served by `backend/api-gateway`. It exposes secure endpoints for mobile and web clients to interact with bounded contexts in the platform.

Key principles:
- Admin-provisioned student accounts only (no public self-signup)
- Single active device session per student
- Explicit auth flows and token lifecycle management
- Fast read/aggregated views for dashboard flows
- Event-driven side effects for downstream services

## Authentication Model

- Students and admins authenticate using credentials provisioned by the campus admin.
- Public signup is NOT supported.
- Primary student login factor: roll number + password.
- Secondary login factor: official campus email (e.g., `.edu`, campus-issued domain) + password.
- Admin accounts are created by system initialization or campus administration workflows.
- Account activation is via email invite with one-time activation link.

### Token model

- `access_token` (JWT): short-lived token for resource access, included as `Authorization: Bearer <token>`.
- `refresh_token` (opaque): long-lived token used by `/auth/refresh` to obtain a new access token.
- `revoked` tokens are persisted to prevent reuse after logout/replace device.

### One-active-device rule

- Every student can have at most one active mobile device session.
- When a new device logs in, previously active session is revoked.
- `POST /auth/device/switch` triggers replace/revoke flow for a student.

## Role Model

- `student`: access to student dashboard and attendance/entry endpoints.
- `security`: access to monitoring, alerts and incident management.
- `admin`: access to user provisioning and global configuration.

## Endpoint groups

### Auth and session management

- `POST /auth/login` - login with `rollNumber` or `email` and `password`.
- `POST /auth/refresh` - rotate token pair.
- `POST /auth/logout` - revoke current session.
- `POST /auth/activate` - activate account via invite code.
- `POST /auth/device/switch` - replace single active device session.

### Admin student management

- `POST /admin/students` - provision a new student.
- `POST /admin/students/bulk-import` - bulk create students.
- `POST /admin/students/{studentId}/send-activation` - resend activation email.

### Student / attendance

- `GET /students/{studentId}` - student profile.
- `GET /students/{studentId}/schedule` - timetable.
- `POST /students/{studentId}/attendance` - mark class attendance.
- `GET /students/{studentId}/attendance` - fetch attendance history.

### Access

- `POST /access/check` - validate campus/parking entry.
- `GET /access/{studentId}` - access history.

### Presence

- `GET /presence/{studentId}` - current location/presence.
- `GET /presence/{studentId}/trail` - movement trail.

### Reliability & risk

- `GET /reliability/{studentId}` - current reliability score.
- `GET /reliability/{studentId}/signals` - risk signal history.

### Alerts & incidents

- `GET /alerts` - active alerts.
- `POST /alerts/{alertId}/acknowledge` - acknowledge alert.
- `GET /incidents` - incident list.
- `POST /incidents` - create incident.
- `PATCH /incidents/{incidentId}` - update status (assign/escalate/resolve).

## Request / response examples

### 1) Login

#### Request

```http
POST /auth/login
Content-Type: application/json

{
  "identifier": "S12345", 
  "password": "strongpassword"
}
```

#### Response

```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "b8dc8421-...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user": {
    "id": "student::S12345",
    "role": "student",
    "rollNumber": "S12345",
    "email": "student@campus.edu"
  }
}
```

### 2) Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "b8dc8421-..."
}
```

### 3) Activate

```http
POST /auth/activate
Content-Type: application/json

{
  "code": "invite-abc-123",
  "password": "newpassword!"
}
```

### 4) Device switch

```http
POST /auth/device/switch
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "mobile:iPhone-15-pro",
  "deviceMetadata": {
    "os": "iOS",
    "osVersion": "18.4"
  }
}
```

### 5) Admin create student

```http
POST /admin/students
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "rollNumber": "S12345",
  "name": "Nexus Student",
  "email": "student@campus.edu",
  "program": "BTech",
  "batch": "2026"
}
```

#### Response

```json
{
  "id": "student::S12345",
  "status": "pending_activation",
  "inviteCode": "invite-abc-123"
}
```

## Security notes

- Public self-registration is explicitly forbidden.
- Only campus-admin-provisioned accounts can use login/activation flows.
- All auth endpoints require TLS.
- Refresh tokens are rotated and stored with revocation support.
- One active device per student is enforced at the auth service layer.
