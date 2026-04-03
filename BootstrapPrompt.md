You are helping me work on my NEXUS project.

NEXUS is a unified campus attendance + security platform with:
- A student mobile app (campus entry, attendance, parking access)
- A security/admin web dashboard (student lookup, hotspots, incidents)
- A modular Node/TypeScript backend, organized by bounded contexts

Step 1 (planning) is ALREADY DONE inside this repo.
Before you do ANYTHING else, I want you to read the architecture docs in this codebase so you have the full context.

Do this first:
1. Scan the ROOT README:
   - Read: README.md at repo root
2. Scan backend architecture:
   - Read: backend/api-gateway/README.md
   - Read: backend/core/README.md
   - Read: backend/ingestion/README.md
   - Read: backend/realtime/README.md
   - Read: backend/ml-services/README.md
   - Read: backend/services/identity-service/README.md
   - Read: backend/services/campus-service/README.md
   - Read: backend/services/schedule-attendance-service/README.md
   - Read: backend/services/presence-service/README.md
   - Read: backend/services/access-service/README.md
   - Read: backend/services/reliability-service/README.md
   - Read: backend/services/incident-service/README.md
3. Scan frontend architecture:
   - Read: frontend/mobile-app/README.md
   - Read: frontend/web-dashboard/README.md
   - Read: frontend/shared/README.md

After you read ALL of these files, respond with:
- A 5–8 bullet summary of NEXUS (what it is and core modules)
- The list of bounded contexts and what each owns
- The main user flows (student and security)
- HOW the repo is structured (which folders map to which services)

Then WAIT for my next instruction.
Do NOT start designing APIs or writing code until I explicitly ask.


5–8 bullet summary of NEXUS
NEXUS is a unified campus attendance + security platform with student mobile app + security/admin web dashboard.
Student app handles campus entry (QR/NFC), attendance (schedule + location), and parking access.
Security web dashboard handles student lookup, hotspots/loitering alerts, incident workflows.
Backend is modular Node/TypeScript with domain services in services, plus ingestion, realtime, and optional ML services.
Bounded contexts are implemented as independent backend services with data ownership and event APIs.
api-gateway is single HTTP/WebSocket entrypoint; core has shared types/config.
ingestion handles raw location and device events; realtime pushes live state to clients.
ml-services is planned for scoring/predictions, not owning state.
Bounded contexts and ownership
identity-service
Student profile, credentials, device registration/binding, sessions, RBAC.
campus-service
Physical/logical campus model (campus/zones/buildings/rooms/gates/parking), geofences, policy metadata.
schedule-attendance-service
Timetable, class sessions, events, attendance records, attendance validation.
presence-service
GPS/BLE/relay intake, last-known location, movement trails, presence state.
access-service
Gate/parking access rules/events, access verification flow (grant/deny).
reliability-service
Reliability score, risk signals for behavior anomalies (fake attendance, loitering, device-switch, skipping).
incident-service
Alerts/incidents lifecycle, assignment, escalation, audit logs.
Main user flows
Student campus entry: authenticate → scan/tap at gate → access verification → record access_granted/denied → update presence.
Student attendance: schedule lookup → validate location + grace window → mark attendance → attendance_marked/rejected.
Student parking: verify entitlement → record parking access.
Security student lookup: search roll number → view location, schedule, attendance, access history, reliability score, incidents.
Security monitoring: map/hotspots from presence + risk signals → raise alerts, create incidents.
Incident workflow: alert → incident create/assign/escalate/resolve → audit log.
Repo structure mapping to services
README.md root: product vision, model, flows, domain events.
api-gateway: HTTP/WebSocket entrypoint, routing, auth.
core: shared types/DTOs/events/config/logging utilities.
ingestion: raw event intake and validation, forwarding.
realtime: push live updates (presence, alerts, incidents) to clients.
ml-services: optional scoring/predictions, event consumer.
backend/services/*: per bounded context domain services:
identity-service
campus-service
schedule-attendance-service
presence-service
access-service
reliability-service
incident-service
mobile-app: student app features.
web-dashboard: security/admin features.
shared: shared frontend types/components/design tokens.
