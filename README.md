# NEXUS – Unified Campus Attendance & Security Platform

NEXUS is a unified platform that combines **student attendance**, **access verification**, and **campus security monitoring** into a single model.

- Students use a **mobile app** to:
  - Verify campus entry (QR / NFC / other credential methods)
  - Mark class attendance based on geolocation + BLE proximity
  - Verify parking access

- Campus security and admins use a **web dashboard** to:
  - Look up students by roll number and inspect their status
  - Monitor unusual locations and loitering
  - See suspicious activity hotspots driven by a reliability score
  - Create and manage security incidents and alerts

NEXUS v1 monitors **students only** (no staff/faculty schedule modeling).

---

## Product Model

### Core Ideas

- Every student has a **personal timetable** (classes with locations + times), plus campus events (festivals, talks, hackathons, etc.).
- Student accounts are **admin-provisioned** by campus staff, using roll number and official campus email (e.g., `.edu` or campus-issued domain).
- Students activate their account via in-email activation link and set their password; public self-signup is not supported.
- During a scheduled class, if no special event is defined, the student is expected to be inside that **classroom** (with a time buffer).
- **Access verification** (campus entry, parking) is tied to the student’s **ID / roll number** and a **single active device**.
- Login supports roll number + password (primary) and official campus email + password (secondary identifier).
- Location is inferred from:
  - GPS → which building / zone they are in
  - BLE mesh (phones) → local proximity, especially for future DOLN features
  - Fixed BLE beacons are the primary long-term indoor verification mechanism; phone-to-phone BLE mesh is an optional fallback/resilience layer.
- NEXUS maintains a **reliability score** per student based on behavior:
  - Fake attendance attempts
  - Frequent loitering during class hours
  - Excessive device switching
  - Turning off connectivity / BLE in suspicious patterns
  - Chronic skipping of scheduled classes

### Backend Stack Assumptions

- Node.js runtime
- TypeScript for type safety
- Fastify for HTTP/WebSocket framework
- MongoDB for document storage
- Redis for caching and session management

### v1 Limitations

- No installed BLE beacons; v1 relies on GPS for building/zone verification and phone-to-phone BLE mesh as available.
- Loitering detection is soft/low-confidence inference based on schedule mismatch, coarse zone presence, and behavior signals; no strong passive/background room-level tracking.
- Monitors students only; no staff/faculty schedule modeling.
- Campus-level policies (e.g., grace windows) are configurable for future productization.

---

## Bounded Contexts (Domain Modules)

NEXUS is designed as a **modular monolith** with domain-centric services under `backend/services`.

Each context owns its data and rules; other modules interact through APIs or events.

### 1. Identity & Session Management

- **Purpose:** Who the student is, which device they use, how they authenticate.
- **Owns:**
  - Student profile (roll no, name, program, batch)
  - Account credentials
  - Device registrations and bindings
  - Session tokens / refresh tokens
- **Key responsibilities:**
  - One active device session per student
  - Device binding & revocation
  - Authentication / authorization integration

### 2. Campus Operations

- **Purpose:** The physical and logical model of the campus.
- **Owns:**
  - Campuses
  - Zones (academic, residential, open, etc.)
  - Buildings (academic blocks, hostels, admin buildings)
  - Classrooms
  - Gates / entry points
  - Parking areas
  - Sports complex, lawns/open areas
  - Cafeterias / food outlets
- **Key responsibilities:**
  - Geofence definitions per zone/building
  - Room metadata (capacity, building mapping)
  - Policy metadata per zone (e.g., controlled vs open)

### 3. Schedule & Attendance

- **Purpose:** Student timetables, campus events, and attendance records.
- **Owns:**
  - Class schedules per student
  - Class sessions (course + room + timeslot)
  - Events (fests, talks, hackathons, etc.)
  - Attendance records
- **Key responsibilities:**
  - Expected location per student at any time
  - Grace windows around classes (default: 5 min before and 5 min after; campus-configurable)
  - Validation rules for marking attendance
  - Integration with location and access signals

### 4. Presence & Location

- **Purpose:** Where students/devices have been and where they are now.
- **Owns:**
  - Raw location events (GPS pings)
  - BLE sightings (phone-to-phone)
  - Offline relay batches (DOLN uploads)
  - Last-known presence state
  - Movement trails (reconstructed)
- **Key responsibilities:**
  - Ingesting and aggregating location signals
  - Reconstructing movement trails from events
  - Maintaining last-known location per student
  - Providing “where is this student now?” answers

### 5. Access Verification

- **Purpose:** Verifying entry to campus, parking, and other access points.
- **Owns:**
  - Access points (gates, parking entries, other checkpoints)
  - Access events (attempts and successes/failures)
- **Key responsibilities:**
  - Validating campus entry (QR / NFC / digital credential)
  - Validating parking access
  - Linking access events to student + device + time + location

### 6. Reliability & Risk

- **Purpose:** Behavioral reliability score and risk signals for students.
- **Owns:**
  - Reliability score per student
  - Risk signals and rule evaluations
- **Key responsibilities:**
  - Aggregating signals:
    - Fake attendance attempts
    - Loitering during class time
    - Frequent device switching
    - Connectivity/BLE tampering around key events
    - Skipping classes persistently
  - Producing a reliability score and simple risk categories
  - Feeding scores into alerting and hotspot detection

### 7. Security Incidents & Alerts

- **Purpose:** Turning signals into alerts and managed incidents.
- **Owns:**
  - Alerts
  - Incidents/cases
  - Incident status and assignments
  - Action log (who did what, when)
- **Key responsibilities:**
  - Creating alerts from anomalies and rules
  - Combining multiple related alerts into one incident
  - Providing workflows: acknowledge → assign → escalate → resolve
  - Keeping an audit trail for reviews

---

## Core Domain Events (First Pass)

Events are written in **past tense** and are emitted by the domain.

- `student_registered`
- `device_registered`
- `device_bound_to_student`
- `device_session_started`
- `device_session_revoked`
- `campus_zone_defined`
- `class_session_scheduled`
- `campus_event_scheduled`
- `gps_location_recorded`
- `ble_sighting_recorded`
- `relay_batch_uploaded`
- `presence_state_updated`
- `movement_trail_reconstructed`
- `attendance_mark_attempted`
- `attendance_marked`
- `attendance_mark_rejected`
- `access_attempted`
- `access_granted`
- `access_denied`
- `risk_signal_recorded`
- `reliability_score_updated`
- `alert_raised`
- `alert_acknowledged`
- `incident_created`
- `incident_assigned`
- `incident_escalated`
- `incident_resolved`

This list will evolve, but it anchors the event-driven parts of the system.

---

## Core User Flows

### 1. Student – Campus Entry

1. Student opens NEXUS mobile app (single active device).
2. Student authenticates.
3. At a campus gate/entry, student:
   - scans a QR code, or
   - taps NFC / mobile credential.
4. Access Verification validates:
   - student identity & active device
   - campus-level access rules
5. On success:
   - Campus entry event recorded (`access_granted`)
   - Presence updated (student “on campus”)
6. Student may then proceed to classes / parking.

### 2. Student – Class Attendance

1. Student has a class scheduled at time T in room R.
2. There is a grace window: `[T - 5 min, T + 5 min]` for entry and `[T_end - 5 min, T_end + 5 min]` for exit (configurable per campus).
3. Within that window, the app:
   - Confirms GPS location in the correct building
   - Uses BLE mesh (other phones / future beacons) to estimate proximity to room zone
4. Student taps “Mark Attendance”.
5. Schedule & Attendance:
   - Confirms schedule + no conflicting event
   - Confirms valid location signals
   - Records attendance (`attendance_marked`) or rejects (`attendance_mark_rejected`).
6. Reliability & Risk records signals for unusual patterns.

### 3. Student – Parking Access

1. Student drives/walks to a parking entry.
2. Uses NEXUS mobile app to scan/verify access.
3. Access Verification:
   - Checks parking permissions
   - Validates student + device
4. Records `access_granted` or `access_denied`.
5. Presence updated with parking zone location.

### 4. Security – Student Lookup

1. Security officer opens web dashboard.
2. Searches for a student by roll number.
3. Dashboard shows:
   - Current/last-known location
   - Today’s schedule and attendance status
   - Recent access events (entry/parking)
   - Reliability score and recent risk signals
   - Open incidents (if any) for that student.

### 5. Security – Hotspot and Loitering Monitoring

1. Presence & Location continuously updates location and trails.
2. Reliability & Risk runs rules:
   - Students in lawns/sports/cafeteria during their class window with no valid event.
   - Students repeatedly staying in open zones instead of scheduled classes.
3. Security dashboard receives:
   - Hotspot alerts for zones with intensifying suspicious activity
   - Lists of students contributing to those hotspots.
4. Security can inspect, create an incident, or ignore/close alerts.

### 6. Security – Incident Workflow

1. An alert or manual action creates an incident.
2. Incident has:
   - Linked student(s)
   - Linked zones/locations
   - Timeline of signals and actions
3. Security can:
   - Assign to an officer
   - Add notes
   - Escalate
   - Resolve
4. All actions are logged in the audit trail.

---

## API Contract

- See `backend/api-gateway/API-CONTRACTS.md` for finalized REST API endpoints, auth model, and token/session rules.
- Public self-signup is disallowed; only admin-provisioned student accounts are permitted.

## Architectural Ownership Rules

- Each bounded context owns its data; other modules **do not** access its DB tables/collections directly.
- `backend/services` contains the domain services for each context.
- `backend/ingestion` handles **raw event intake** (GPS, BLE, relay batches).
- `backend/realtime` pushes state and alerts to clients.
- `backend/ml-services` may consume events and produce scores, but **cannot own canonical domain state**.
- `backend/core` is for shared contracts, config, and cross-cutting utilities – **no business logic**.
- `backend/api-gateway` is the single HTTP/WebSocket entrypoint for mobile and web clients.
