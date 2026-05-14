# 14th May Updates - Person 5 Work Report

## Summary

Completed the Person 5 scope for DevOps setup verification, demo reset repeatability, Leaflet map migration, dead code cleanup, and bonus Student Support cleanup. Work was done on the `khushi` branch after pulling the latest code from `ayushmaan`.

## Branch Workflow

- Pulled latest changes from `origin/ayushmaan`.
- Switched back to `khushi`.
- Merged the latest `ayushmaan` work into `khushi`.
- Kept Person 5 changes on `khushi`.
- Did not push changes yet.

## Files Created

### `scripts/setup-check.sh`

Created a setup verification script that checks:

- Docker is running and `nexus-db` appears in `docker ps`.
- `backend/api-gateway/.env` exists and contains `JWT_SECRET`, `DATABASE_URL`, and `DEMO_SECRET`.
- Prisma migrations report that the database schema is up to date.
- Backend health endpoint responds on `http://localhost:3000/health`.
- Frontend dev server responds on `http://localhost:5173`.

The script prints pass/fail status for every item and ends with a summary such as `3/5 checks passed`.

### `scripts/reset-demo.sh`

Created a demo reset helper script that:

- Reads `DEMO_SECRET` from the current environment if exported.
- Falls back to reading `DEMO_SECRET` from `backend/api-gateway/.env`.
- Calls `POST http://localhost:3000/dev/demo/reset`.
- Prints `Demo reset succeeded.` on HTTP 200.
- Prints `Reset failed — is backend running?` on failure.

### `backend/api-gateway/.env.example`

Added an example backend env file containing:

- `DATABASE_URL`
- `JWT_SECRET`
- `DEMO_SECRET`

## Files Updated

### `backend/api-gateway/.env`

Created/updated the local ignored env file with:

- `DATABASE_URL`
- `JWT_SECRET`
- `DEMO_SECRET="nexus-demo-2026"`

This file is ignored by git and is for local development only.

### `HOW_TO_TEST.md`

Added references for:

- `scripts/setup-check.sh`
- `scripts/reset-demo.sh`
- `DEMO_SECRET`

This makes the setup and demo reset workflow easier for teammates to repeat.

### `DEMO.md`

Added a one-line reference to `scripts/reset-demo.sh` in the pre-demo reset checklist.

### `frontend/web-dashboard/campus-guardian-dashboard-main/package.json`

Added map dependencies:

- `leaflet`
- `react-leaflet`

Note: `react-leaflet@4.2.1` was used because this project runs React 18. The latest `react-leaflet@5` requires React 19 and failed dependency resolution.

### `frontend/web-dashboard/campus-guardian-dashboard-main/package-lock.json`

Updated automatically by npm after installing Leaflet dependencies.

### `frontend/web-dashboard/campus-guardian-dashboard-main/src/main.tsx`

Added Leaflet CSS import at the top:

```ts
import "leaflet/dist/leaflet.css";
```

This is required for Leaflet controls, popups, and map UI to render correctly.

### `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminPresence.tsx`

Replaced the old custom SVG map with a real Leaflet map.

Implemented:

- OpenStreetMap tile layer.
- Geofence circles using existing geofence latitude, longitude, and radius data.
- Student location markers using `CircleMarker`.
- Selected student movement trace using `Polyline`.
- Popups for geofences and student markers.
- Explicit map height of `500px` so the map does not render at zero height.

Removed:

- `buildMapProjection()`.
- SVG map rendering.
- zoom/pan state.
- drag handlers.
- manual zoom control buttons.
- old coordinate projection logic.

### `backend/api-gateway/src/dev/demo-reset.ts`

Did not replace seeded coordinates because final real campus coordinates were not confirmed.

Added a clear TODO:

```ts
// TODO: replace with validated campus coordinates once the team confirms the real campus map points.
```

This follows the instruction to keep coordinate replacement separate until confirmed values are available.

### `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentSupport.tsx`

Bonus cleanup completed.

Replaced mock-backed support form/history UI with a Coming Soon placeholder matching the style of planned feature pages.

Removed from this page:

- mock support issue import.
- fake submit timer.
- mock support history table.
- toast-based fake success behavior.

## Files Reviewed / Visited

- `PLAN_real_map.md`
- `HOW_TO_TEST.md`
- `DEMO.md`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/main.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminPresence.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/package.json`
- `frontend/web-dashboard/campus-guardian-dashboard-main/package-lock.json`
- `backend/api-gateway/src/dev/demo-reset.ts`
- `backend/api-gateway/.env`
- `backend/api-gateway/.env.example`
- `scripts/setup-check.sh`
- `scripts/reset-demo.sh`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/student/StudentSupport.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/components/shared/StateComponents.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminIncidents.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/mocks/data.ts`

## Files Intentionally Not Changed

- `backend/api-gateway/src/services/presence/utils.ts`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/services/dataApi.ts`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/mocks/data.ts`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminIncidents.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminAlerts.tsx`
- `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminActivity.tsx`

These were left alone because the task brief explicitly said not to remove mock flags, mock data, or planned feature banners.

## Verification Completed

Ran frontend verification:

```bash
npm run build
npx tsc --noEmit
```

Both passed.

Restarted frontend dev server on:

```text
http://localhost:5173
```

Ran setup script:

```bash
scripts/setup-check.sh
```

Current result:

```text
3/5 checks passed
```

Passing:

- `.env` required keys.
- Backend health endpoint.
- Frontend dev server.

Failing due to local environment:

- Docker `nexus-db` container is not running/healthy.
- Prisma migrations cannot be verified because the database is unavailable.

## Current Blockers

Docker/Postgres is not fully running on this machine. Docker Desktop starts, but pulling `postgres:15-alpine` failed with a Docker registry/network error. Because of that:

- `docker compose up -d` did not start `nexus-db`.
- `npx prisma migrate dev` could not complete.
- demo reset endpoint reaches backend but fails when trying to access the database.

This is an environment/runtime blocker, not a code blocker.

## Handoff Notes

- Use `scripts/setup-check.sh` before demos or testing.
- Use `scripts/reset-demo.sh` after backend and database are running.
- Leaflet map migration is complete and does not use default Leaflet marker icons, so no Vite marker PNG fix is required.
- Campus coordinate replacement is pending confirmed real campus coordinates from the team.
- Changes are currently local on `khushi` and have not been pushed.
