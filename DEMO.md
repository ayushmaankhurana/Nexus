# Nexus Demo — University Administration & Security Team

## Accounts

| Login | Password | Role |
|---|---|---|
| ADM1001 | secure123 | Admin |
| SEC1001 | secure123 | Security |
| FAC1001 | secure123 | Faculty |
| CS21002 | pass123 | Student (Anjali — good attendance) |
| CS21003 | pass123 | Student (Rohan — flagged, 62.5%) |

---

## Pre-Demo Checklist

- [ ] Backend running on `:3000` → `npm run dev` in `backend/api-gateway`
- [ ] Frontend running on `:5173` → `npm run dev` in `frontend/web-dashboard/campus-guardian-dashboard-main`
- [ ] Logged out / fresh browser (or incognito)
- [ ] Reset to clean data if needed:
  ```bash
  curl -X POST http://localhost:3000/dev/demo/reset -H "x-demo-secret: nexus-demo-2026"
  ```
- [ ] Zoom browser to 90% for more screen real estate

---

## Demo Flow

### 1. Admin Login & Command Center (~2 min)

**Login:** `ADM1001 / secure123`

**Show:** Admin Dashboard stat cards — Active Students, Present Today, Access Events Today, Open Incidents.

> "This is the operations centre for campus administration. Everything you see is live from the database — 200 students, real access events from this week, real attendance across the last four weeks."

---

### 2. Student Account Lifecycle (~3 min)

**Navigate to:** `/admin/students`

**Show:**
- List of 200 students with status badges (ACTIVE / PENDING)
- Click any student → side drawer → tabs: Overview, Attendance, Access
- **Create a new student** → fill name, email, roll number → submit
  - Point to terminal: *"In production this activation link is emailed. Right now it logs to the terminal."*
- Find the new PENDING student → **Suspend** → status flips instantly
- **Reactivate** → status restored

> "Suspend is immediate — it revokes every active session across all devices the moment you click it. Useful if a student's device is lost or access needs to be cut off urgently."

---

### 3. Attendance Tracking (~4 min)

**Navigate to:** `/admin/attendance`

**Show:**
- Stat cards: Present / Absent / Late / Flagged
- **Anomalies section** — students flagged below threshold (Rohan 62.5%, Priya 50%, Kabir 62.5%)
- Click **Mark Excused** on an absent record → status updates live
- Scroll through the full records table — mixed PRESENT / LATE / ABSENT / EXCUSED statuses

**Explain the three marking methods (backend-ready, no need to demo live):**
- QR Code: faculty projects QR → student scans → auto-marked LATE if 10–30 min after start
- BLE Beacon: classroom beacons detect student devices passively as a verification layer
- Manual Override: faculty or admin marks directly — what we just demonstrated

**Switch to Faculty view** → open new tab → login `FAC1001 / secure123` → `/admin/attendance`

> "Dr. Kapoor is assigned to Section A only. She cannot see or modify any other section's records. This scope is enforced at the API level — not just hidden in the UI."

---

### 4. Access Control & Gate Management (~4 min)

**Back in admin tab → navigate to:** `/admin/access`

**Show:**
- Stat cards: Total Events, Allowed, Denied, Students Seen
- Access events table — entries, exits, denials with reason codes across the week

**Run Live Access Check section:**

1. Select any ACTIVE student + Main Campus Gate + ENTRY → **Run Check** → `ALLOW`
2. Click quick scenario **"Deny parking"** → `DENY` (reason: UNAUTHORIZED_AREA)
3. Select **CS21001 (Rahul, PENDING)** + any gate + ENTRY → **Run Check** → `DENY` (reason: INACTIVE_ACCOUNT)

> "Every check is logged in real time. The moment a student is suspended, every subsequent gate check shows DENY with the exact reason. The security team has full read access to this log."

---

### 5. Presence Intelligence & Campus Map (~4 min)

**Navigate to:** `/admin/presence`

**Show:**
- Stat cards: Active Signals, No Signal / Missing, Checkpoints Seen
- Last Known Positions list — student names, last geofence, timestamp
- **Click Anjali (CS21002)** → map highlights her position → trace timeline appears on the right
  - Full day trail: Main Gate → CS Building → CS-101 → Library → Canteen → CS-102 → Library → Main Gate (exit)
- Point to map: geofence circles, colour-coded dots (green = active, amber = stale, grey = no signal)
- Use **Simulate Location Update** to move a student between geofences → watch map update live

**Switch to Security view** → login `SEC1001 / secure123` → `/admin/presence`

> "Security officers see the full presence map and access log, but they have no access to attendance records or student account management. Completely separate permissions enforced at the server."

---

### 6. Role-Based Access — Sidebar Comparison (~2 min)

Quick side-by-side using the sidebar across three tabs:

| Role | Sidebar |
|---|---|
| ADMIN | Dashboard, Students, Attendance, Access, Incidents, Presence, Alerts, Activity |
| SECURITY | Dashboard, Access, Presence only |
| FACULTY | Dashboard, Attendance, Presence (own section only) |
| STUDENT | My Attendance, Access Status, Alerts, Account |

> "Role separation is enforced twice — the UI only renders what your role allows, and the API rejects any request that doesn't match your role or data scope even if someone hits the endpoint directly."

---

### 7. Student Self-Service (~2 min)

**Login:** `CS21002 / pass123` (Anjali)

**Show:**
- Student Dashboard: attendance rate %, account status, recent alerts, recent activity
- `/attendance` → own records with PRESENT / LATE / ABSENT, searchable
- `/access` → own gate entry/exit history with success rate
- `/alerts` → computed alerts (late-to-class pattern, access denials)

> "Students have a completely self-contained view — only their own data. They can track their attendance rate, see every gate event, and get alerts if something needs their attention."

---

## Phase 2 Teaser

These are built or partially built — mention them as coming next:

- **Attendance threshold alerts** — automated flag + notification when a student drops below 75% (data is already in the system, alert dispatch is Phase 2)
- **Incident management** — link security incidents to specific students and geofences, visible on the presence map
- **Push notifications** — real-time alerts to student devices for access denials or attendance warnings
- **Timetable management UI** — admin interface to create courses, sections, and class schedules without touching the database
- **Audit trail** — chronological activity log of every admin/faculty action for compliance

---

## What NOT to Show

| Page | Why |
|---|---|
| `/admin/incidents` | Empty — "Planned Feature" banner |
| `/admin/alerts` | Empty — "Planned Feature" banner |
| `/admin/activity` | Empty — "Planned Feature" banner |
| "Present Today" stat on Admin Dashboard | Shows 0 (attendance data is from April, not today) |

---

## If Something Goes Wrong

**Stale session / white screen after reset:**
1. Go to `http://localhost:5173/login` directly
2. Or: DevTools → Application → Local Storage → clear → reload

**Reset to clean demo data at any point:**
```bash
curl -X POST http://localhost:3000/dev/demo/reset -H "x-demo-secret: nexus-demo-2026"
```

**Backend crash — restart:**
```bash
cd backend/api-gateway && npm run dev
```
