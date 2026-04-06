What is NEXUS?
NEXUS is a Unified Campus Intelligence Platform designed to consolidate campus attendance tracking, access control, and security monitoring into one system. It targets campus administrators and security teams, replacing manual roll calls and siloed systems with a single real-time platform.

Repository Structure
Code
Nexus/
├── backend/
│   ├── api-gateway/          # Main HTTP API server (Fastify, TypeScript)
│   │   ├── src/
│   │   │   ├── app.ts        # Fastify app factory (CORS, JWT, routes)
│   │   │   ├── server.ts     # Entry point
│   │   │   ├── routes/       # REST endpoint handlers
│   │   │   ├── plugins/      # Auth plugin (JWT middleware)
│   │   │   ├── services/     # Business logic layer
│   │   │   ├── stores/       # In-memory data stores (temporary)
│   │   │   ├── schemas/      # Zod validation schemas
│   │   │   └── types/        # TypeScript types
│   │   └── prisma/
│   │       └── schema.prisma # PostgreSQL data model (Prisma ORM)
│   ├── core/                 # Shared utilities/types (npm workspace package)
│   ├── services/             # Future microservices (all stubs/empty):
│   │   ├── identity-service
│   │   ├── access-service
│   │   ├── presence-service
│   │   ├── incident-service
│   │   ├── reliability-service
│   │   ├── schedule-attendance-service
│   │   └── campus-service
│   ├── ml-services/          # Placeholder for ML/scoring
│   ├── ingestion/            # Placeholder for data ingestion
│   └── realtime/             # Placeholder for WebSocket layer
├── frontend/
│   ├── web-dashboard/        # React + Vite web app (TypeScript)
│   │   └── campus-guardian-dashboard-main/
│   │       └── src/
│   │           ├── pages/    # Student & Admin views + Auth pages
│   │           ├── components/
│   │           ├── contexts/ # Auth context (localStorage persistence)
│   │           ├── services/ # API call layer
│   │           ├── mocks/    # Mock data for unimplemented routes
│   │           └── hooks/
│   ├── mobile-app/           # Placeholder (not started)
│   └── shared/               # Shared frontend utilities
├── docker-compose.yml        # PostgreSQL 15 database container
├── package.json              # Root npm workspaces config
└── tsconfig.base.json        # Shared TypeScript config
Key Technologies
Layer	Technology
Backend API	Fastify (Node.js), TypeScript
Auth	@fastify/jwt (JWT), bcrypt (password hashing)
Database	PostgreSQL 15 via Docker, Prisma ORM
Validation	Zod
Frontend	React 18, Vite, TypeScript
UI Components	Radix UI primitives + shadcn/ui, Tailwind CSS
State/Data	TanStack Query, React Hook Form
Charts	Recharts
Routing	React Router v6
Testing	Vitest (unit), Playwright (E2E)
Monorepo	npm workspaces (@nexus/core, @nexus/api-gateway)
Containerization	Docker Compose (database only)
Architecture
The architecture is monolithic API gateway today, with a planned microservices future:

Code
Browser/Mobile
     │
     ▼
[React Frontend] ←→ [API Gateway :3000] (Fastify)
                          │
                    ┌─────┴──────┐
                    │  Plugins   │  JWT Auth, CORS
                    │  Routes    │  /auth, /students, /attendance, /access, /presence, /incidents
                    │  Services  │  Business logic
                    │  Stores    │  In-memory (temp)
                    └─────┬──────┘
                          │
                    [PostgreSQL] (via Prisma)
Database Schema
The Prisma schema defines these models:

Account — Core identity (rollNumber, email, password, role: STUDENT/ADMIN/SECURITY, status: PENDING/ACTIVE)
Session — Device binding + tokens (enforces one-device-per-account at DB level)
StudentProfile — Extended student data (firstName, lastName, RFID tag)
Geofence — Physical locations (buildings, classrooms, parking)
AttendanceRecord — Class attendance logs
AccessEvent — Gate entry/exit/denial events
Incident — Security incidents
What's Complete vs. In Progress
✅ Working:

Auth flows: account activation, login (email or roll#), logout, device switching
JWT-protected routes for /students, /attendance, /access
Frontend: full login flow, auth context, protected routes, all dashboard UI pages (Student + Admin views)
CORS for local development
⏳ Stubbed/Not started:

Attendance/access/presence/incidents business logic (routes return placeholders)
Database persistence (currently in-memory stores)
Real JWT signing (uses UUID tokens for now, @fastify/jwt is wired)
Mobile app, WebSocket/real-time layer, ML scoring services
Running Locally
Start the database: docker-compose up -d
Start the backend: npm run dev (from root — runs @nexus/api-gateway)
Start the frontend: npm run dev (from frontend/web-dashboard/campus-guardian-dashboard-main/)
Backend runs on :3000, frontend on :5173 or :8080