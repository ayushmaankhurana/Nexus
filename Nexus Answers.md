1. **Multi-role accounts:** Can one person hold more than one role (e.g., a PhD student who is also a teaching assistant/faculty)? If so, does a single `Account` row support multiple roles, or are separate accounts expected?

Answer: One person would usually not hold multiple roles, so they would be awarded different accounts. 

2. **FACULTY access history:** Should faculty members be able to view their own campus access events (entry/exit logs)? Currently `/access` is STUDENT-only and `/admin/access` is ADMIN/SECURITY — faculty have no self-view.

Answer: Yes faculty members should be able to view their entry exit logs, presence trail etc. 

3. **Sub-admin roles:** Should there be a concept of a "department admin" who can only manage students and timetables within their department, vs. a "system admin" who can manage everything? Or is a single flat ADMIN role sufficient?

Answer: there should be a sub admin role for Department admin who has view access for all sections under that department. 

4. **SECURITY attendance override:** Should a security officer ever be allowed to mark or override attendance? For example, if a student was physically prevented from entering a building due to a security lockdown.

Answer: Never

5. **FacultyAssignment removal mid-semester:** If a faculty assignment is revoked, what happens to attendance records they previously created? Are they preserved with attribution intact, or does the foreign key gap become a problem (currently `markedByFacultyId` is a raw string, not a relation)?

Answer: Attendance records should remain intact

6. **Session token invalidation on password change:** Currently, resetting a password invalidates the active session. Should it also invalidate all refresh tokens across all devices, or only the current device?

Answer: Yes

---

### Timetable & Attendance

7. **QR code generation:** Who generates and displays the QR code that students scan? Does the faculty member trigger it from the dashboard (displayed on a projector screen), or does the system automatically start a QR session at the `ClassSessionTemplate.startTime`? This affects whether we need a "start session" action in the faculty UI.

Answer: Faculty member teaching that class projects QR code at the end of class

8. **Offline attendance sync window:** The 45-second QR TTL prevents offline QR scanning. Is there a separate offline attendance path (e.g., faculty manually marks everyone after the session), or will offline resilience only apply to presence tracking (GPS/BLE batch upload)?

Answer: Yes, default is using the classroom BLE Beacon, QR code can override that (i.e. a student absent by ble beacon but present by QR code is present) and Faculty can manually mark attendance that overrides any other method. Also it should be noted that Admins should have a provision to set the amount of time faculty has to edit attendance for a specific class session. 

Also any attendance changes made my faculty, or admin need to be saved along with the attendance data for that date in a full log

9. **Auto-generating ABSENT records:** Should the system automatically create `ABSENT` attendance records for all enrolled students who haven't marked attendance after the LATE window closes? Or is absence implied by the absence of a record, and only explicitly created on manual faculty mark?

Answers: Students who are not marked by any of the 3 methods are automatically marked absent. The default state should be absent. 

10. **Cross-listed sections:** If CS101 and MATH201 share a room and timeslot, and a student is enrolled in both, which session's QR does the app present? Is cross-listing expected to be handled in the initial timetable model?

Answers: 2 Courses may share a room or a timeslot but never the same room AND timeslot. There should be a conflic that should be raised during initial seeding when timetables and room and faculty assignments are being uploaded. 

11. **Cancelled class workflow:** How should a cancelled class be represented? Does it prevent attendance expectations from being generated? Should enrolled students see "Class Cancelled" rather than "Absent" for that date?

Answer: Attendance for cancelled classes should be unmarked and not be taken into consideration for final course attendance calculation.

12. **Substitute faculty:** If Faculty A is substituting for Faculty B for one session, does Faculty A need a one-off `FacultyAssignment` for that date? Or is there a separate substitute/delegation model?

Answer: Yes, they should have a one off faculty assignment for that date. 

13. **Attendance export:** Is there a requirement for attendance records to be exportable (CSV, PDF) for grade submission or external compliance reporting?

Answer: Yes

---

### Location & Presence

14. **BLE beacon hardware:** Does the campus already have BLE beacons physically installed in classrooms, or is hardware procurement part of this project's scope? The schema design (`bleBeaconId` on ClassSessionTemplate) depends on knowing the beacon format.

Answer: No, hardware procurement is part of the project scope.

15. **GPS-disabled devices:** If a student has GPS location services disabled (privacy settings), can they still mark attendance using BLE beacon detection alone? Or is GPS mandatory and BLE is supplementary?

Answer: Yes, BLE beacon location can override GPS location. attendance is only marked by the classroom ble beacon, not geolocation. geolocation is only for supplementary student presence tracking.

16. **Location push frequency:** At what interval should the mobile app push GPS coordinates? Continuous push is battery-intensive and will flood the `PresenceLocation` table. What is the acceptable tradeoff between freshness and resource cost?

Answer: for GPS push it could be once every 60-90 seconds and on app startup/attendance page refresh? unsure about this right now tho. 

17. **Presence freshness threshold:** The 15-minute freshness constant is hardcoded. Should this be configurable per geofence (e.g., a classroom zone might need 2-minute freshness to be meaningful, while a parking lot zone could use 30 minutes)?

Answer: Should be configurable but we should have defaults set up for classroom beacons, staircase beacons, parking lot beacons, cafeteria beacons, etc. 

18. **Student visibility of own trail:** Should students be able to see their own movement trail in the web dashboard, or is the presence trail admin/faculty-only? The current student dashboard has no presence trail page.

Answer: Students cannot see their presence trail, only view attendance records and entry exit logs. 

---

### Access Control

DO NOTE THAT ACCESS CONTROL IS NOT INCLUDED IN PHASE 1 AND SHOULD ONLY HAVE CODE AND ENDPOINTS THAT ALLOW FOR FUTURE DEVELOPMENT AND INTEGRATION. UNSURE ABOUT THESE ANSWERS RIGHT NOW

19. **Gate hardware integration:** How does the physical gate make an access decision? Does gate hardware call `/access/check` directly (requiring near-real-time WebSocket feedback), or does a security officer manually check the system? This determines whether Realtime Push (Step 5) is actually a prerequisite for live access control.

20. **RFID validation scope:** Is RFID tag validation done by the backend (compare submitted tag against `StudentProfile.rfidTag`) or by hardware before the API call? The current access service accepts an optional `credentialValue` but the validation logic is minimal.

21. **Parking zone access rules:** The access service currently denies STUDENT on PARKING geofence by default. Is there a vehicle registration or parking permit system that should allow specific students access to parking, or is the blanket deny intentional?

---

### Incidents & Alerts

DO NOTE THAT INCIDENTS AND ALERTS IS NOT INCLUDED IN PHASE 1 AND SHOULD ONLY HAVE CODE AND ENDPOINTS THAT ALLOW FOR FUTURE DEVELOPMENT AND INTEGRATION. UNSURE ABOUT THESE ANSWERS RIGHT NOW

22. **Incident types:** What are the valid incident types? The schema uses a plain `String` field. Are these freeform (any description), or should they be a closed enum (e.g., UNAUTHORIZED_ACCESS, LOITERING, MEDICAL, SAFETY_CONCERN)?

23. **Alert trigger sources:** What events should automatically generate an alert? Candidates include: 3+ access denials in 60 min, student not seen within a session's geofence despite attendance mark, attendance marked outside geofence, reliability score drop below threshold. Which of these are in scope?

24. **Incident assignment:** When a security officer creates an incident and assigns it to another officer (`assignedTo` field), should the assigned officer receive a notification? This requires either push notifications or the realtime layer — which phase does incident notification belong to?

---

---

## CLAUDE Questions.md — Round 2 (answered 2026-05-07)

### Attendance

**Q7 — BLE beacon attendance window:**
For BLE-based attendance: at what point during the class session is BLE detection checked? Is detection valid at any point during the session (open window), or only within the same PRESENT/LATE time windows used for QR scanning?

Answer: 5 scans per session — 3 in the first 10 minutes (PRESENT window), 2 in the 10–30 minute window (LATE window). A student needs to be detected in at least 2 scans to be marked present.

**Q8 — QR code timing:**
Should there be any restriction on when during a session faculty can generate the QR?

Answer: Faculty discretion is sufficient. QR code should be generatable from the time class starts to 5 minutes after it ends. The QR code may not be generated at all for some sessions.

**Q9 — Attendance edit window defaults:**
What should the default faculty attendance edit window be before an admin customizes it?

Answer: 48 hours is the default but can be set by admin.

**Q10 — Attendance percentage threshold:**
Is there a minimum attendance percentage that students must maintain per course?

Answer: Yes, there is a minimum attendance threshold of 75% per course and 75% overall. Courses can have sessions for both groups in a class section, or for one of the groups — the denominator must account for which sessions each student's group was required to attend.

**Q11 — Excused absences:**
Who can mark an absence as excused — only ADMIN, or also FACULTY? Is there a workflow?

Answer: Only admin. Admin can do it directly, but there should also be a student-initiated approval workflow.

---

### Location & Presence

**Q12 — BLE beacon types and identifiers:**
What beacon format should the schema prepare for?

Answer: It should be possible to prepare for both iBeacon and Eddystone formats.

**Q13 — GPS push on app open:**
Should there be a debounce to prevent a burst of pushes if a student opens the app repeatedly in quick succession?

Answer: Max push of 3 times in 90 seconds rolling window.

---

### Auth & Accounts

**Q14 — Multi-device session list:**
Should there be an endpoint to see all active sessions (devices) and revoke individual ones?

Answer: Yes, but mobile app sessions can only be one device at a time. Web app sessions can have multiple sessions.

**Q15 — Account deactivation vs. deletion:**
Is suspension reversible? Is there a permanent deletion state?

Answer: There should be a suspension state, a deletion option that needs to have multiple ARE YOU SURE confirmations and must not be readily accessible.

---

### Scope

**Q16 — External system integrations (LMS/ERP):**
Is there any existing campus system NEXUS would need to integrate with?

Answer: There is a student ERP but no LMS.

**Q17 — DEPT_ADMIN scope definition:**
Is "department" a field on FacultyProfile/Course, or a separate entity?

Answer: Yes, department is an overarching field (on FacultyProfile and Course — not a separate entity).

---

### Scope & Product

25. **Multi-campus support:** Is NEXUS designed for a single campus or multiple campuses? The current `Geofence` model has no building/campus hierarchy. If multi-campus, the schema needs a `Campus` or `Building` parent model before the timetable work begins.

Answer: Nexus is designed in mind for a single university campus. Even if it is to be deployed in other universities, the functionalities would be altered based on their requirements. 

26. **Mobile app platform:** Is the student mobile app expected to be a React Native cross-platform app, a native iOS/Android app, or a Progressive Web App (PWA)? This affects how BLE access and background GPS work, which in turn affects the attendance verification design.

Answer: It would be a React Native cross-platform app

27. **Data retention policy:** How long should `PresenceLocation` records be retained? GPS pings at any reasonable frequency will generate significant volume. Is there a retention window (e.g., 90 days rolling) or is indefinite retention expected?

Answer: 60 days rolling but admin can edit that between 30, 60 and 90.

28. **External system integrations:** Are there planned integrations with existing campus systems — LMS (Moodle, Canvas), student ERP, RFID hardware controllers, or building management? These could affect the data model and auth strategy.

Answer: Possibly

29. **Seed account for FACULTY demo:** The demo runbook lists student and security seed accounts but does not document a FACULTY seed account. Does one exist in `seed.ts`, and if so, what are the credentials? The FACULTY routing fix (Step 1) needs this to be verifiable.

Answer: NO

30. **Deadline / demo date:** Is there a specific demo or submission deadline that the Phase 1 + Phase 2 work needs to hit? This would inform prioritization within Step 1 (security fixes vs. role routing vs. both).

Answer: Not yet.

---

## CLAUDE Questions.md — Round 3 (answered 2026-05-07)

**Q18 — BLE LATE status:**
If a student accumulates ≥2 BLE detections only from the LATE-window scans, should BLE result in a LATE status?

Answer: Yes, BLE results in a LATE status. However, LATE is cosmetic only for faculty/admin viewing (e.g., to flag late arrivals for possible follow-up). A LATE status counts as PRESENT in all attendance percentage calculations.

**Q19 — Attendance threshold configurability:**
Should the 75% threshold be a fixed constant or admin-configurable per course?

Answer: Default is 75% for everything but admins may want to change thresholds per course.

**Q20 — Threshold alert recipients:**
Who gets alerted when a student falls below the threshold?

Answer: Alerts are sent at different intervals to different roles:
- **Students:** Weekly attendance updates — course-wise + overall attendance percentage.
- **Faculty:** Weekly attendance overview for students in their mentor section (if they have one), plus a consolidated course-wise attendance overview for each assigned teaching section.
- **Admin / Department heads:** Consolidated reports on-demand only (not automatic).

**Q21 — Excused absence request detail:**
What information does the student provide? Does admin get a push notification?

Answer: Reason category + written reason + supporting document upload. Yes, admin receives a push notification when a new excuse request is pending.

**Q22 — Threshold calculation timing:**
When is the attendance percentage calculated and when are threshold alerts triggered?

Answer: Attendance percentage is calculated constantly (updated in real-time as records change). Threshold-based alerts follow the schedule above (weekly for students/faculty, on-demand for admin/dept heads).

**Q23 — Web session limit:**
Does the oldest session auto-expire or can sessions accumulate without bound?

Answer: Max session cap of 2 web app devices.

**Q24 — Account deletion data handling:**
What happens to associated records when a student account is hard-deleted?

Answer: Unsure yet.

**Q25 — Suspension behavior:**
When an account is SUSPENDED, are active sessions invalidated immediately?

Answer: Active sessions are invalidated immediately.

**Q26 — ERP integration direction and system:**
What is the ERP system and what direction is the integration?

Answer: Unsure right now, need to ask department admin.

**Q27 — ERP student ID format:**
What format is the external student ID?

Answer: The student roll number (and possibly email) can be global fields but do not take this as final.
