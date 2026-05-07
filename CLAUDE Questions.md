# NEXUS — Open Questions for Clarification

> **Updated:** 2026-05-07 (round 2 — prior answers moved to Nexus Answers.md)  
> **Purpose:** Outstanding questions that need answers before the affected implementation begins.

---

## Previously Unanswered (Deferred Domains — Phase 2+)

These cover Access Control and Incidents & Alerts, which are not in Phase 1 scope. Answers needed before Phase 2/3 work on those domains begins.

### Access Control

**Q1 — Gate hardware integration:**
How does the physical gate make an access decision? Does the gate hardware call `/access/check` directly (requiring near-real-time WebSocket feedback), or does a security officer manually consult the system at each gate? This determines whether Realtime Push (Phase 5) is a prerequisite for live access control, or whether Phase 2 can ship access without it.

**Q2 — RFID validation scope:**
Is RFID tag validation done by the backend (compare submitted tag against `StudentProfile.rfidTag`) or by gate hardware before the API call? The current access service accepts an optional `credentialValue` but the validation logic is minimal.

**Q3 — Parking zone access rules:**
The access service currently denies STUDENT on PARKING geofence by default. Is there a vehicle registration or parking permit system that should allow specific students parking access, or is the blanket deny intentional for all students?

---

### Incidents & Alerts

**Q4 — Incident types:**
What are the valid incident types? Should they be a closed enum (e.g., UNAUTHORIZED_ACCESS, LOITERING, MEDICAL, SAFETY_CONCERN) or freeform text? A closed enum allows consistent filtering, reporting, and alerting logic.

**Q5 — Alert trigger sources:**
Which of the following events should automatically generate an alert?
- 3+ access denials for the same student within 60 minutes
- Student's attendance is marked PRESENT but they are not detected in the session's geofence
- Attendance marked from outside the session's geofence (GPS mismatch)
- Reliability score drops below a configurable threshold

**Q6 — Incident notification:**
When a security officer creates an incident and assigns it to another officer (`assignedTo` field), should the assigned officer receive a push notification? This requires either push notifications or the realtime layer. Which phase should incident notification belong to?

---

## New Questions (Round 2)

These arose while incorporating the round 2 answers into the PRD and roadmap.

### Attendance

**Q18 — BLE LATE status:**
The 5-scan schedule spans two windows (3 in 0–10 min PRESENT, 2 in 10–30 min LATE). If a student accumulates ≥2 detections but only from the LATE-window scans (i.e., they arrived after the first 10 minutes), should BLE result in a LATE status — or does BLE only produce PRESENT/ABSENT regardless of which window the detections fall in?

BLE results in a LATE status but keep in mind that the LATE status is only for cosmetic viewing by faculty and admin in case they want to mark late students absent later. A LATE status should count as PRESENT in attendance percentage calculations. 

**Q19 — Attendance threshold configurability:**
The confirmed threshold is 75% per course and 75% overall. Should this 75% be a fixed system constant, or should admins be able to configure the threshold per course (e.g., a lab course might require 90%, a lecture course 75%)? This affects whether we need a per-course threshold config model.

Default would be 75% for everything but yes admins might want to change thresholds per course. 

**Q20 — Threshold alert recipients:**
When a student falls below 75% attendance in a course or overall, who gets alerted? Options:
- Student only
- Faculty of that specific course
- Admin only
- All of the above

Alerts would be sent out at different intervals throughout the semester to different people. Students should get weekly attendance updates regarding their course + overall attendance. Faculty should get an attendance overview alert every week for the overall and coursewise attendance of the students in their mentor section (if they have one), and their coursewise overview for each section consolidated into one alert. 

Admin and department heads should get consolidated reports but only when they request generation. 

**Q21 — Excused absence request detail:**
In the student-initiated excuse request workflow, what information does the student provide? For example: written reason only, or also supporting document upload? Does admin receive a push notification when a new request is pending?

Reason category + Written reason + supporting document upload. yes admin gets a push notification. 

**Q22 — Threshold calculation timing:**
When is the 75% threshold checked and the alert triggered — after every session closes (rolling), once per day (batch), or only on-demand when an admin or faculty views the report?

attendance percentage is calculated constantly as attendance is updated, but the threshold based alerts happen according to the schedule above. 

---

### Auth & Accounts

**Q23 — Web session limit:**
When a user is already logged into the web app on multiple browsers and logs in again, does the oldest session auto-expire (FIFO cap), or can sessions accumulate without bound until the user revokes them or they expire naturally (7-day refresh token TTL)?

Max session cap of 2 web app devices. 

**Q24 — Account deletion data handling:**
When a student account is hard-deleted, what happens to their associated records — attendance history, access events, presence data, and the attendance change log? Options:
- Hard-delete all associated data (cascading delete)
- Anonymize (null out `accountId`, keep aggregate data)
- Archive to a separate audit table before deletion

Unsure yet. 

**Q25 — Suspension behavior:**
When an account is SUSPENDED, are all their active sessions immediately invalidated (like password reset), or do existing tokens remain valid until they expire naturally?

Active sessions are invalidated. 

---

### External Integration

**Q26 — ERP integration direction and system:**
You mentioned there is a student ERP. What is the ERP system (e.g., SAP, Oracle, a custom system)? Is the integration expected to be one-way (ERP → NEXUS for student data import during onboarding), bidirectional (attendance records → ERP as well), or just a future placeholder for now?

UNSURE right now, need to ask department admin

**Q27 — ERP student ID format:**
The `externalStudentId` field being added to `StudentProfile` needs a format assumption. Is the ERP student ID a numeric string, a specific format like `YYYY-NNNN`, or free-form? Does it need to be globally unique or only unique within a year/department?

The student roll no. (and possibly student email fields) can be global fields but DO NOT take this answer as final. 
