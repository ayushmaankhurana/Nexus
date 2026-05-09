# NEXUS — Open Questions for Clarification

> **Updated:** 2026-05-07 (round 3 — prior answers moved to Nexus Answers.md)  
> **Purpose:** Outstanding questions + comprehensive permissions matrix for role verification.

---

## Still Unanswered (Deferred or Pending)

### Access Control (Phase 2+ — deferred)

**Q1 — Gate hardware integration:**
How does the physical gate make an access decision? Does gate hardware call `/access/check` directly (near-real-time WebSocket required), or does a security officer manually consult the system? This determines whether Realtime Push (Phase 5) is a prerequisite for live access control.

**Q2 — RFID validation scope:**
Is RFID tag validation done by the backend or by gate hardware before the API call?

**Q3 — Parking zone access rules:**
Is the blanket STUDENT deny on PARKING geofence intentional, or will a vehicle registration / parking permit system allow specific students access?

### Incidents & Alerts (Phase 2+ — deferred)

**Q4 — Incident types:**
Closed enum (e.g., UNAUTHORIZED_ACCESS, LOITERING, MEDICAL, SAFETY_CONCERN) or freeform text?

**Q5 — Alert trigger sources:**
Which events should auto-generate an alert: 3+ access denials/60 min, attendance-geofence mismatch, GPS mismatch at scan time, reliability score drop?

**Q6 — Incident notification phase:**
Should assigned security officers receive push notifications for incident assignment? If so, which phase?

### Auth & Accounts

**Q24 — Account deletion data handling:**
When a student account is hard-deleted, what happens to attendance records, access events, presence data, and the change log? Options: cascading hard-delete, anonymize (null accountId), or archive to audit table.

### External Integration

**Q26 — ERP integration:**
What is the ERP system? One-way import (ERP → NEXUS for onboarding) or bidirectional (attendance → ERP too)? Or just a future placeholder?

**Q27 — ERP student ID format:**
Is the student roll number the external ID? Does it need a separate `externalStudentId` field, or is `rollNumber` sufficient as the join key?

---

## New Questions (Round 3)

### Auth & Sessions

**Q28 — Web session cap overflow behavior:**
Max 2 concurrent web sessions is confirmed. When a user already has 2 active web sessions and tries to log in on a third browser, what should happen?
- Option A: The oldest session is automatically revoked (FIFO), and the new login succeeds.
- Option B: The login is rejected with a message like "You have reached the maximum number of active sessions. Please log out of another device."

Option B with a button option to do option A

### Attendance & Alerts

**Q29 — Alert delivery channel:**
What is the delivery mechanism for the attendance alerts (student weekly, faculty weekly, admin on-demand)?
- In-app notification only
- Email only
- Both in-app and email
- All of the above + SMS

In app notification + email but this should be configurable for faculty and admin. 

**Q30 — Excuse reason categories:**
What are the valid reason categories for excuse requests? Please confirm or adjust:
- Medical / Health
- Family Emergency
- Official University Event
- Religious Observance
- Other (requires written explanation)

Yes all these. 

**Q31 — Document upload storage:**
Supporting documents for excuse requests need to be stored somewhere. Which approach?
- Cloud object storage (S3 / Cloudflare R2)
- Database blob (not recommended for large files)
- File system on the server

Not sure. 

What file types are accepted (PDF, JPG, PNG only?) and what is the maximum file size?

PDF JPG PNG Docx

**Q32 — Threshold alert: "below threshold" definition:**
Does the weekly alert go to a student only when they are currently below 75%, or does it go to all students every week (informational) regardless of threshold? Same question for faculty — is the weekly alert only triggered when students in their sections are at risk, or is it a universal weekly digest?

Only when they are at risk. the alert should be a single alert that contains information about all the thresholds they are failing. 

### Academic Structure

**Q33 — Faculty mentor section:**
Q20's answer introduced the concept of a "mentor section" (faculty receives a weekly alert for students in their mentor section). Is this a formal assignment — one faculty member designated as the mentor/advisor for a specific student group — or is "mentor section" the same as their primary teaching section? This needs a schema entity if it is separate from `FacultyAssignment`.

Each faculty MAY be assigned a specific class section that they mentor. on top of that they may teach one or more courses to different class sections that they are assigned to. 

**Q34 — Per-course threshold: retroactive?**
When an admin changes the attendance threshold for a course mid-semester (e.g., from 75% to 90%), does it apply retroactively to past sessions (recalculate who is now at risk), or only to future sessions?

retroactive.

---

## Permissions & Access Matrix

The following tables capture the intended access control for every feature and data entity in NEXUS. Please review each section and flag anything that needs correction. Entries marked ❓ are either ambiguous from the current spec or need your confirmation.

---

### Legend

| Symbol | Meaning |
|---|---|
| ✅ | Allowed |
| ❌ | Denied — returns 403 |
| 🔒 Own only | Allowed, but scoped to own data only |
| 📋 Scoped | Allowed, but scoped (see note) |
| ❓ | Needs confirmation |
| — | Not applicable |

---

### 1. Auth & Session Management

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ |
| Logout (own session) | ✅ | ✅ | ✅ | ✅ |
| Refresh access token | ✅ | ✅ | ✅ | ✅ |
| Request password reset | ✅ | ✅ | ✅ | ✅ |
| Reset password (invalidates all sessions) | ✅ | ✅ | ✅ | ✅ |
| List own active sessions | ✅ | ✅ | ✅ | ✅ |
| Revoke own specific session | ✅ | ✅ | ✅ | ✅ |
| Revoke another user's session | ❌ | ❌ | ❌ | ✅ |
| Force-reset another user's password | ❌ | ❌ | ❌ | ✅ |
| Max concurrent web sessions | 2 | 2 | 2 | 2 |
| Max concurrent mobile sessions | 1 | ❓ | ❓ | ❓ |

all users have max 1 concurrent mobile session

> **Note on mobile sessions for non-students:** The 1-device limit is confirmed for students. Is it the same for faculty, security, and admin on mobile? ❓

---

### 2. Account & Profile Management

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile (limited fields) | ✅ | ✅ | ✅ | ✅ |
| View any student profile | ❌ | ❌ | ✅ (read-only) | ✅ |
| View any faculty profile | ❌ | ❌ | ❓ | ✅ |
| Create student account | ❌ | ❌ | ❌ | ✅ |
| Create faculty account | ❌ | ❌ | ❌ | ✅ |
| Create security account | ❌ | ❌ | ❌ | ✅ |
| Activate account (own, via token) | ✅ | ✅ | ✅ | ✅ |
| Suspend account | ❌ | ❌ | ❌ | ✅ |
| Reactivate suspended account | ❌ | ❌ | ❌ | ✅ |
| Delete account (multi-confirm) | ❌ | ❌ | ❌ | ✅ |
| Update RFID tag | ❌ | ❌ | ❌ | ✅ |
| Bulk import students | ❌ | ❌ | ❌ | ✅ |
| Assign faculty to sections | ❌ | ❌ | ❌ | ✅ |
| Assign faculty mentor section | ❌ | ❌ | ❌ | ✅ |

faculty can view student profile for their course students and students in the section they mentor if any, and other faculty profile

---

### 3. Timetable & Academic Structure

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| View own enrolled courses/sections | ✅ | — | — | ✅ |
| View assigned teaching sections | — | ✅ | — | ✅ |
| View all courses/sections | ❌ | ❌ | ❌ | ✅ |
| Create/edit Course | ❌ | ❌ | ❌ | ✅ |
| Create/edit Section | ❌ | ❌ | ❌ | ✅ |
| Create/edit StudentGroup | ❌ | ❌ | ❌ | ✅ |
| Enroll student in group | ❌ | ❌ | ❌ | ✅ |
| Create/edit ClassSessionTemplate | ❌ | ❌ | ❌ | ✅ |
| Cancel a class session | ❌ | ✅ (assigned sessions only) ❓ | ❌ | ✅ |
| Create one-off substitute FacultyAssignment | ❌ | ❌ | ❌ | ✅ |
| Configure per-course attendance threshold | ❌ | ❌ | ❌ | ✅ |
| Configure faculty attendance edit window | ❌ | ❌ | ❌ | ✅ |

> **Confirm:** Can faculty cancel a class session for their own assigned sessions, or is that admin-only? ❓

yes they can 

---

### 4. Attendance Records

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| Mark own attendance (BLE auto) | ✅ | — | — | — |
| Mark own attendance (QR scan) | ✅ | — | — | — |
| Generate QR code for a session | ❌ | ✅ (assigned sessions, within window) | ❌ | ✅ |
| Manually mark/override attendance | ❌ | ✅ (assigned sections, within edit window) | ❌ (never) | ✅ (any, any time) |
| Mark attendance as EXCUSED | ❌ | ❌ | ❌ | ✅ |
| View own attendance history | ✅ | ✅ (own, as a person) | ✅ (own) | ✅ |
| View attendance for own enrolled courses | ✅ | — | — | ✅ |
| View attendance for assigned sections | ❌ | ✅ (assigned only) | ❌ | ✅ (all) |
| View campus-wide attendance records | ❌ | ❌ | ❌ | ✅ |
| View AttendanceChangeLog for a session | ❌ | ✅ (assigned sections) | ❌ | ✅ |
| Export attendance (CSV/PDF) | ❌ | ✅ (assigned sections) | ❌ | ✅ |
| Submit excuse request | ✅ (own absences) | ❌ | ❌ | — |
| View own excuse request status | ✅ | — | — | — |
| View pending excuse request queue | ❌ | ❌ | ❌ | ✅ |
| Approve/reject excuse request | ❌ | ❌ | ❌ | ✅ |
| View session summary (present/late/absent counts) | ❌ | ✅ (assigned) | ❌ | ✅ |

---

### 5. Presence & Location

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| Push own GPS location | ✅ | ✅ | ✅ | ✅ |
| Push GPS location for another user | ❌ | ❌ | ✅ | ✅ |
| Report own BLE detection | ✅ | ✅ | ✅ | ✅ |
| Batch upload own location history | ✅ | ✅ | ✅ | ✅ |
| Batch upload another user's locations | ❌ | ❌ | ✅ | ✅ |
| Check geofence for own location | ✅ | ✅ | ✅ | ✅ |
| Check geofence for another user | ❌ | ❌ | ✅ | ✅ |
| View own current presence state | ✅ | ✅ | ✅ | ✅ |
| View own presence trail (movement history) | ❌ *(confirmed: students cannot)* | ✅ (own) ❓ | ✅ | ✅ |
| View any student's current presence | ❌ | ✅ (assigned sections only) | ✅ (campus-wide) | ✅ (campus-wide) |
| View any student's presence trail | ❌ | ✅ (any student) | ✅ | ✅ |
| View campus presence overview | ❌ | 📋 Assigned sections only | ✅ Campus-wide | ✅ Campus-wide |
| Configure presence freshness thresholds | ❌ | ❌ | ❌ | ✅ |
| Configure PresenceLocation retention period | ❌ | ❌ | ❌ | ✅ |

> **Confirm Q about faculty own trail:** The PRD says students cannot see their own trail but faculty can see any student's trail. Can faculty also see their own movement history? ❓  
yes
> **Confirm:** Can faculty see any student's trail (campus-wide) or only students in their assigned sections? The PRD says "any student" but this seems broader than the section-scoping principle. ❓

only trail for students in section they mentor if any 

---

### 6. Access Control (Campus Gates)

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| View own access event history (entry/exit logs) | ✅ | ✅ *(confirmed)* | ✅ | ✅ |
| View another user's access events | ❌ | ❌ | ✅ (campus-wide) | ✅ |
| View campus-wide access event log | ❌ | ❌ | ✅ | ✅ |
| Perform gate access check (entry/exit/deny) | ❌ | ❌ | ✅ | ✅ |
| Override an access denial | ❌ | ❌ | ✅ ❓ | ✅ |

> **Confirm:** Can a security officer manually override an access denial in the system, or only the gate hardware does that? ❓

Unsure

---

### 7. Incidents & Alerts (Phase 2+)

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| View own alert notifications | ✅ | ✅ | ✅ | ✅ |
| View campus incident list | ❌ | ❌ | ✅ | ✅ |
| Create incident report | ❌ | ❌ | ✅ | ✅ |
| Update incident status | ❌ | ❌ | ✅ | ✅ |
| Assign incident to another officer | ❌ | ❌ | ✅ | ✅ |
| Close incident | ❌ | ❌ | ✅ | ✅ |
| Receive incident assignment notification | ❌ | ❌ | ✅ ❓ | ✅ ❓ |
| View system-wide alerts | ❌ | ❌ | ✅ | ✅ |
| Create manual system alert | ❌ | ❌ | ✅ ❓ | ✅ |
| Receive weekly attendance alert | ✅ (own) | ✅ (mentor + teaching sections) | ❌ | ❌ |
| Request on-demand attendance report | ❌ | ❌ | ❌ | ✅ |

---

### 8. System Configuration

| Action | STUDENT | FACULTY | SECURITY | ADMIN |
|---|---|---|---|---|
| Configure attendance edit window (per section) | ❌ | ❌ | ❌ | ✅ |
| Configure per-course attendance threshold | ❌ | ❌ | ❌ | ✅ |
| Configure presence freshness (per geofence type) | ❌ | ❌ | ❌ | ✅ |
| Configure PresenceLocation retention (30/60/90 days) | ❌ | ❌ | ❌ | ✅ |
| Manage geofences (create/edit/delete) | ❌ | ❌ | ❌ | ✅ |
| Trigger demo reset (`/dev/demo/reset`) | ❌ | ❌ | ❌ | ✅ (dev env only) |
| View system health (`/health`) | ✅ | ✅ | ✅ | ✅ |

---

### 9. DEPT_ADMIN (Phase 4+ — Planned)

| Action | DEPT_ADMIN |
|---|---|
| View all sections within their department | ✅ |
| View student profiles within their department | ✅ (read-only) |
| View attendance records for their department | ✅ (read-only) |
| View faculty profiles within their department | ✅ (read-only) |
| Create/edit any account or timetable entity | ❌ |
| Manage faculty assignments | ❌ |
| Request on-demand attendance report for their dept | ✅ |
| Access other departments' data | ❌ |

---

### Summary of Key Scoping Rules

| Role | Data scope |
|---|---|
| **STUDENT** | Own data only. No presence trail. No access to any other student's records. |
| **FACULTY** | Own data (attendance history, access events). Teaching data scoped to `FacultyAssignment` (sections/groups). Presence overview scoped to assigned students. Can view any student's trail (❓ confirm). QR generation and manual mark for assigned sessions within edit window. Cannot mark EXCUSED. Cannot override attendance at security level. |
| **SECURITY** | Campus-wide read on access events and presence. Gate check and access denial (no attendance write). No academic data access. |
| **ADMIN** | Full access to all domains. Configures system settings. Only role that can mark EXCUSED. Only role that creates accounts. Destructive operations require multi-confirm. |
| **DEPT_ADMIN** *(planned)* | Read-only, department-scoped. No writes. |
