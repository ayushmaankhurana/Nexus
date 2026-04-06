# Demo How To

## 1. Purpose of this document

This file is the practical runbook for showing NEXUS in a short demo.

It has two goals:

1. Give you a reliable, step-by-step way to run the product and show the shortlisted flows.
2. Capture, in one place, the major changes completed during this session so you know what is real, what is wired, and what is still presentation-only.

## 2. What is actually demo-ready

The strongest demo path in the current repo is:

1. Student lookup
2. Access control
3. Attendance / QR-NFC-adjacent attendance operations
4. Presence / maps / movement trace
5. Incidents as a UI and workflow preview, with the important caveat that this slice was not fully converted to the same real backend depth as the others

The most important framing for the demo is this:

1. The backend is real for auth, student roster/profile lookups, access history and live checks, attendance history and manual override, and presence overview/trace/location updates.
2. The frontend is wired live for the demo-critical student lookup, access, attendance, and presence pages.
3. Incidents should be presented honestly as the least-finished shortlisted area. You can still show the screen and workflow concept, but do not oversell it as being as backend-complete as the other slices.

## 3. Before you start the demo

Open two terminals.

### Backend terminal

From the repository root:

```bash
npm run dev --workspace=@nexus/api-gateway
```

Expected result:

1. The API gateway starts successfully.
2. It listens on port `3000`.

### Frontend terminal

From the dashboard folder:

```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev
```

Expected result:

1. Vite starts successfully.
2. The dashboard is available on port `5173`.

### Open the app

Open:

```text
http://localhost:5173
```

## 4. Reset demo data before every run

Do this before every serious demo pass.

### Preferred method: use the UI

1. Go to the login page.
2. In the top-left corner, click `Reset Demo Data`.
3. Wait for the success message that says the demo data was reset and sessions were cleared.

This is the safest method for a live presentation because it guarantees:

1. Fresh seeded attendance data
2. Fresh seeded access history
3. Fresh seeded presence history
4. Cleared active sessions, which avoids device-binding/session problems during repeated demos

### Fallback method: use the API directly

If the UI reset button is unavailable for any reason, run:

```bash
curl -X POST http://localhost:3000/dev/demo/reset
```

Expected response shape:

```json
{
  "success": true,
  "message": "Demo data reset successfully. Sessions have been cleared."
}
```

## 5. Demo credentials

Use these credentials by typing them manually.

Important note: the small quick-fill buttons on the login screen are legacy placeholders and do not reflect the currently seeded accounts. For the demo, type the credentials yourself.

### Admin account

1. Email: `admin1@campus.edu`
2. Password: `secure123`

### Security account

1. Email: `security1@campus.edu`
2. Password: `secure123`

### Faculty account

1. Email: `faculty1@campus.edu`
2. Password: `secure123`

### Student accounts

All seeded student accounts use:

1. Password: `pass123`

Useful students to mention during the demo:

1. `cs21002@campus.edu` / CS21002 / Anjali Verma
2. `cs21003@campus.edu` / CS21003 / Rohan Mehta
3. `cs21004@campus.edu` / CS21004 / Priya Nair
4. `cs21005@campus.edu` / CS21005 / Meera Joshi
5. `cs21006@campus.edu` / CS21006 / Kabir Malhotra

One intentionally useful edge-case account:

1. `cs21001@campus.edu` / CS21001 / Rahul Sharma
2. This account is seeded as `PENDING`, which makes it useful for showing denied access behavior.

## 6. Recommended demo order

If you only have 8 to 10 minutes, use this order:

1. Reset demo data
2. Log in as admin
3. Show Operations dashboard briefly
4. Show Student lookup
5. Show Access Control with one allow and one deny scenario
6. Show Attendance Monitoring and mark one absence as excused
7. Show Presence Intel, movement trace, simulate a location update, then pan/zoom the map
8. Show Incidents last, as a workflow preview and remaining roadmap item

This order works because it starts broad, then moves through the most credible live backend slices, and ends with the one area that still needs deeper backend completion.

## 7. Detailed step-by-step demo script

## 7.1 Login and environment reset

1. Open the login page.
2. Click `Reset Demo Data` in the top-left.
3. Wait for the confirmation message.
4. Log in as the admin account using `admin1@campus.edu` and `secure123`.
5. Explain that the reset clears stale sessions and reloads deterministic seeded data so every demo begins from a known state.

Suggested speaking point:

`Before every demo we reseed the system and clear active sessions, so the attendance, access, and presence slices all start from a known clean state.`

## 7.2 Operations dashboard

1. After login you land on `Operations`.
2. Briefly point out that the dashboard is now a mix of live and seeded operational widgets, not just static placeholders.
3. Call attention to the access and attendance-related numbers and cards because those are backed by the real slices wired in this session.

Do not spend too long here. This page is best used as a 20 to 30 second framing screen.

## 7.3 Student lookup

Go to `Students` in the sidebar.

What to do:

1. Use the table search to look up `CS21002` or `Anjali`.
2. Click the student row to open the right-hand drawer.
3. Show the `Overview` tab first.
4. Point out the live profile fields: name, email, roll number, account status, RFID tag.
5. Switch to the `Attendance` tab and show the student-specific attendance history.
6. Switch to the `Access` tab and show the student-specific access events.
7. Mention that the student drawer is pulling real attendance and access history for the selected student from the backend.

Suggested speaking point:

`This is no longer a fake lookup modal. The roster is live, and when I open a student, the drawer fans into real profile, attendance history, and access history for that specific account.`

Important caveat to mention if you open it:

1. The `Incidents` tab inside the student drawer is not wired yet.
2. It explicitly says incident history will connect once the incidents backend slice is implemented.

## 7.4 Access control

Go to `Access Control` in the sidebar.

This page is one of the best live demo pages because it combines existing seeded history with real write-through decisions.

What to show first:

1. The top stats: total events, allowed, denied, students seen.
2. The `Access Events` table below, which loads real event history.

Then show the live action area:

1. In `Run Live Access Check`, use the `Quick Demo Scenarios` buttons.
2. Click `Allow entry` and then click `Run Check` if needed after the selectors fill.
3. Show that the result comes back as `ALLOW` and a real access event is written.
4. Then click `Deny inactive account` and run it.
5. Explain that Rahul Sharma is intentionally seeded as not fully active, so this predictably demonstrates a deny path.
6. If you want a second deny example, use `Deny parking`.
7. Point to the `Last Result` panel and the refreshed history table to show that the decision was persisted.

Suggested speaking point:

`This page is not simulating a toast only. The live check writes a real access event, refreshes the history, and surfaces the decision and rule outcome immediately.`

If you want to make the story stronger:

1. Mention that access-request approvals are deliberately not being demoed because that workflow is not fully implemented server-side yet.
2. The live part being emphasized here is actual decisioning and event history.

## 7.5 Student-side access view

Optional, if you have time.

1. Sign out.
2. Log in as `cs21002@campus.edu` with `pass123`.
3. Go to `Access Status`.
4. Show that the student sees their own real access history and current account status.
5. Mention that student self-history is wired live, while approval/request workflows are still intentionally deferred.

This is useful if someone asks whether the data is only real on the admin side.

## 7.6 Attendance monitoring

Sign back in as admin if you switched users, then go to `Attendance`.

What to show:

1. The top summary cards: present, absent, late, flagged.
2. The `Anomalies` section.
3. Pick one absent student row that has a `Mark Excused` button.
4. Click `Mark Excused`.
5. Wait for the success toast.
6. Point out that the anomaly list refreshes and the state is corrected instead of creating a duplicate conflicting record.
7. Show the `All Records` table and explain that this page is now loading real attendance data rather than mock records.

Suggested speaking point:

`This is a real manual attendance override path. We fixed the underlying duplicate-row bug, so an excused override updates the existing session record correctly instead of leaving the old absence behind.`

This is the right place to mention the attendance story:

1. Attendance data is live on both admin and student pages.
2. Summary numbers are computed from backend rows.
3. Flagging now behaves correctly and does not keep excused records marked as anomalies.

## 7.7 Student-side attendance view

Optional, if you have time.

1. Sign in as `cs21002@campus.edu` with `pass123`.
2. Go to `My Attendance`.
3. Show the attendance rate and history table.
4. Explain that this page is now wired to the real backend attendance endpoint and no longer depends on the mock dataset.

## 7.8 Presence intel and maps

Sign back in as admin if needed, then go to `Presence Intel`.

This is the strongest visual page in the demo right now.

What to show in order:

1. Start with the top stat cards and explain they are derived from the live overview route.
2. In `Last Known Positions`, click a student such as Anjali Verma.
3. Show the `Trace` panel on the right, which reconstructs the selected student’s movement from stored presence points.
4. Scroll to `Simulate Location Update`.
5. Click one of the known checkpoints such as `Main Campus Gate`, `CS-103 Lab`, or `Parking Zone A`.
6. Wait for the success toast.
7. Point out that the selected student’s checkpoint updates live and the trace grows.
8. Move to the `Movement Map` section.
9. Drag the map to pan.
10. Use the zoom buttons or mouse wheel to zoom in and out.
11. Click `Reset View` to recenter the map.
12. Explain that the map is based on real seeded campus coordinates and not a static screenshot.

Suggested speaking point:

`This page now has a real presence overview route, real historical movement points, a live location simulation write, and a map layer that supports selection, zoom, and pan without needing a full external map SDK.`

Important details to mention:

1. The seed was enriched with more students and denser movement history so the map looks alive.
2. The points were scattered intentionally so the locations do not appear unnaturally linear.
3. A fresh reset gives you a consistent starting map every time.

## 7.9 Incidents

Go to `Incidents` in the sidebar.

Show it honestly.

What to do:

1. Show the incidents list.
2. Open `New Incident` to show the intended operator workflow.
3. Explain that this is the remaining shortlisted slice that still needs deeper backend completion to reach the same standard as student lookup, access, attendance, and presence.

Suggested speaking point:

`We kept incidents in the shortlisted story because it is part of the full product vision, but the heaviest backend wiring this session went into lookup, access, attendance, and presence. So I present incidents today as the next slice to harden, not the most mature one.`

That is the correct framing. It keeps the demo credible.

## 8. Suggested short talking track

If you want a compact narrative:

1. `We start every demo from a clean reset state.`
2. `Admin operators can search students and see live profile, attendance, and access history.`
3. `Access control decisions are real and immediately written back into event history.`
4. `Attendance monitoring is real, including manual excused overrides.`
5. `Presence intelligence has a live overview, per-student trace, and simulated movement updates on a pannable, zoomable map.`
6. `Incidents is the next slice to deepen, but the core operational flows above are already wired through the backend.`

## 9. Optional API smoke checks before the audience arrives

If you want to verify the backend in one minute before the demo, these are the most useful checks.

### Reset

```bash
curl -X POST http://localhost:3000/dev/demo/reset
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin1@campus.edu","password":"secure123","deviceId":"demo-device"}'
```

### Presence overview

Use the returned bearer token:

```bash
curl http://localhost:3000/presence/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Simulate a location update

```bash
curl -X POST http://localhost:3000/presence/update-location \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"STUDENT_UUID","lat":28.40908,"lng":77.31766}'
```

These checks are optional because the login-page reset button and the live UI are usually enough.

## 10. Overview of changes made in this session

This section summarizes the meaningful product work completed across the session.

## 10.1 Auth and platform consistency fixes

The first block of work was foundational cleanup so the rest of the demo would stop breaking for avoidable reasons.

What changed:

1. Role handling was aligned end to end so the backend, JWT payloads, route guards, and frontend checks all use consistent uppercase role values such as `ADMIN`, `SECURITY`, `FACULTY`, and `STUDENT`.
2. Frontend API error handling was fixed so nested backend error envelopes are parsed correctly and surfaced as human-readable messages.
3. The app shell was adjusted so authenticated users see their proper display name in the sidebar and header instead of raw email-only identity in key places.

Why it mattered:

1. Without this, protected routes and role-gated admin pages were unreliable.
2. It removed an entire class of confusing auth and permissions bugs before the demo-specific slices were wired.

## 10.2 Demo reset and repeatability improvements

The next major improvement was making the demo operationally repeatable.

What changed:

1. A dev-only reset endpoint was added to reseed the demo database.
2. The login page got a visible `Reset Demo Data` button in the top-left corner.
3. The seed logic was centralized so resets re-establish the same core dataset and clear stale sessions.
4. A frontend request bug around empty-body `POST` and `PATCH` calls was fixed so operational actions could complete cleanly.

Why it mattered:

1. It made repeated demos possible without device-binding/session issues.
2. It gave you a one-click way to get back to a known state before showing access, attendance, or presence behavior.

## 10.3 Student lookup slice

This was the first major live demo slice completed.

What changed:

1. A real admin student roster endpoint was added on the backend.
2. The admin students page was rewired off mocks and onto live roster data.
3. Selecting a student now loads real profile details, real attendance history, and real access history.
4. The student drawer was turned into an actual investigation panel instead of a placeholder.

Why it mattered:

1. It gives the demo a credible operational entry point.
2. It lets you pivot from a student identity directly into supporting evidence across other slices.

## 10.4 Access control slice

The access slice was upgraded into a strong backend-backed demo path.

What changed:

1. The admin access page was rewired to live access history.
2. A real live access-check action was wired through the backend.
3. The admin dashboard access widgets were switched to live data.
4. The student access page was rewired to show real self-history.
5. Predictable seeded allow and deny scenarios were made easy to replay from the UI.

Why it mattered:

1. This is one of the clearest examples in the product where an operator action produces a persisted operational event immediately.
2. It is easy to understand in a short demo and gives visible proof that backend writes are happening.

## 10.5 Attendance slice

Attendance was turned from a mostly static screen into a real operational slice.

What changed:

1. Student dashboard attendance widgets were connected to live backend data.
2. The student attendance page was rewired to the live attendance history endpoint.
3. The admin attendance page was rewired to real records and anomalies.
4. A real `Mark Excused` admin action was added.
5. The attendance summary logic on the frontend was updated to derive totals from backend records.

Then two real issues were fixed:

1. A duplicate-row problem in the manual override path was fixed by normalizing the scheduled attendance date to the session start time before upsert.
2. An anomaly-flagging problem was fixed so excused records do not continue to show up as anomalies just because geofence validation was false.

Why it mattered:

1. Attendance now behaves like a real system, not a one-way display.
2. Manual corrections work cleanly and visibly in front of an audience.

## 10.6 Presence and maps slice

This was the final major slice completed and then enriched.

What changed in the first phase:

1. A real backend presence overview route was added.
2. The backend presence service and store were extended so the admin page could fetch the current student overview plus geofences.
3. Per-student presence trace data was wired through with latitude and longitude.
4. The admin presence page was rewired off mocks and onto live overview plus live trace data.
5. A lightweight custom coordinate map replaced the previous placeholder visualization.

What changed in the enrichment phase:

1. The demo seed was expanded to include more students in the presence story.
2. Presence history was made denser and more scattered so the map looks more believable.
3. A real `simulate location update` action was added to the admin presence page.
4. That action writes a real backend location update and then refreshes the overview and trace.
5. The map gained pan, zoom in, zoom out, and reset-view behavior.

Why it mattered:

1. This turned the presence page into a strong visual payoff for the demo.
2. It demonstrates both historical reconstruction and live state mutation.

## 10.7 What was not fully completed in the shortlisted set

The main remaining gap is incidents.

Current reality:

1. The incidents pages still exist and can be shown.
2. The incidents slice did not receive the same backend-hardening and live frontend rewiring depth as lookup, access, attendance, and presence.
3. Some incident-related UI remains mock-backed or explicitly not wired yet.

Why this is still acceptable in the demo:

1. The product story remains coherent if you present incidents as the next slice to deepen.
2. The more important demo-critical proof points, namely real operational reads and writes, are already demonstrated by the other completed slices.

## 10.8 Best way to describe the session overall

The most accurate summary is:

1. This session turned NEXUS from a partially mocked campus dashboard into a much more credible demo build centered around real auth, real student lookup, real access operations, real attendance operations, and real presence intelligence.
2. The work prioritized backend truth and frontend wiring over cosmetic expansion.
3. The end result is a demo that now has multiple real operator workflows instead of only static screens.

## 11. Final presenter notes

Keep the presentation honest and narrow.

The highest-confidence claims you can make are:

1. `We can reset the demo to a known state at any time.`
2. `Student lookup is live and linked to real attendance and access history.`
3. `Access decisions are evaluated and written back live.`
4. `Attendance anomalies and manual excused overrides are real.`
5. `Presence overview, trace, and simulated location updates are real.`

The claim you should soften is:

1. `Incidents is part of the shortlisted product story, but it is not yet as mature as the slices above.`

That framing will make the overall demo stronger, not weaker.