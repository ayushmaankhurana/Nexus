# NEXUS Installation Guide

This guide provides step-by-step instructions for setting up NEXUS locally after cloning the repository.

## Table of Contents

- [System Requirements](#system-requirements)
- [What's Not in Remote Repository](#whats-not-in-remote-repository)
- [Quick Start](#quick-start)
- [Detailed Installation Steps](#detailed-installation-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Project Structure After Installation](#project-structure-after-installation)

---

## System Requirements

### Required

- **Node.js**: v18.0.0 or later
  - Download from https://nodejs.org/
  - Verify: `node --version`
- **npm**: v9.0.0 or later (comes bundled with Node.js)
  - Verify: `npm --version`
- **Git**: For cloning the repository
  - Verify: `git --version`

### Recommended

- **VS Code**: For IDE integration and REST Client extension
- **REST Client Extension**: VS Code extension for testing API endpoints
- **Terminal/Shell**: bash, zsh, or PowerShell

### Optional

- **Docker**: If you plan to containerize the application (future)
- **MongoDB/PostgreSQL**: For database persistence (future; currently in-memory only)

---

## What's Not in Remote Repository

The `.gitignore` file in the root directory excludes the following from version control. **You will need to generate these after cloning:**

### Generated Directories (Created by npm during installation)

```
node_modules/
  ↳ Root workspace dependencies
  ↳ Backend dependencies
  ↳ Frontend dependencies
  ↳ All transitive dependencies (~1000+ packages)

package-lock.json
  ↳ Dependency lock file (created after npm install)

dist/
  ↳ Backend compiled JavaScript (generated after npm run build)
  ↳ Location: backend/core/dist/
  ↳ Location: backend/api-gateway/dist/

frontend/web-dashboard/campus-guardian-dashboard-main/dist/
  ↳ Frontend production build (generated after npm run build)
  ↳ ~1.1 MB HTML, CSS, JavaScript bundles

frontend/web-dashboard/campus-guardian-dashboard-main/node_modules/
  ↳ Frontend-specific dependencies (~500+ packages)
```

### Environment Files (Must be created manually)

```
.env
  ↳ Local environment variables (not committed for security)
  ↳ Contains: PORT, NODE_ENV, database URLs, API keys
```

### Cache & Temporary Files (Ignored automatically)

```
.cache/
.turbo/
.parcel-cache/
.pnpm-store/
coverage/
logs/
*.log
test-results/
playwright-report/
```

---

## Quick Start

If you already have Node.js v18+ installed:

```bash
# 1. Clone the repo
git clone https://github.com/your-org/nexus.git
cd nexus

# 2. Install all dependencies
npm install

# 3. Build the backend
npm run build

# 4. In terminal 1: Start backend
npm run dev

# 5. In terminal 2: Start frontend
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev

# 6. Open browser
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

---

## Detailed Installation Steps

### Step 1: Verify Prerequisites

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
git --version     # Should be installed
```

If any fail, download Node.js from https://nodejs.org/

### Step 2: Clone Repository

```bash
git clone https://github.com/your-org/nexus.git
cd nexus

# Verify you're in the right place
ls -la  # Should see: README.md, package.json, backend/, frontend/, etc.
```

### Step 3: Install Root Dependencies

```bash
cd /path/to/nexus
npm install
# This installs: root + backend (core + api-gateway) packages
# Takes 2-5 minutes on first run
```

**What gets installed:**
- Root devDependencies: TypeScript, Node types
- @nexus/core: Shared backend utilities
- @nexus/api-gateway: HTTP server and plugins
- Creates: node_modules/, backend/core/node_modules/, backend/api-gateway/node_modules/

### Step 4: Install Frontend Dependencies

```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm install
cd ../../../  # Back to root
```

**What gets installed:**
- React, Vite, Tailwind CSS, shadcn/ui, React Router
- TanStack React Query, Zod, TypeScript
- Testing and build tools
- Creates: frontend/.../node_modules/

### Step 5: Create Environment File

```bash
cd /path/to/nexus

cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
EOF

# Verify it was created
cat .env
```

### Step 6: Build Backend

```bash
npm run build
# Compiles TypeScript to JavaScript
# Creates: backend/core/dist/ and backend/api-gateway/dist/
```

### Step 7: Verify Installation

```bash
# Check build artifacts exist
ls -la backend/core/dist/
ls -la backend/api-gateway/dist/

# Check node_modules installed
ls -la node_modules/ | head -20
ls -la frontend/web-dashboard/campus-guardian-dashboard-main/node_modules/ | head -10
```

---

## Running the Application

### Terminal 1: Start Backend Server

```bash
cd /path/to/nexus
npm run dev

# Expected output:
# > @nexus/api-gateway dev
# [timestamp] AuthRoute: Plugin registered
# Fastify server listening on port 3000

# Server accessible at: http://localhost:3000
# Press Ctrl+C to stop
```

### Terminal 2: Start Frontend Dev Server

In a **new terminal window/tab**:

```bash
cd /path/to/nexus/frontend/web-dashboard/campus-guardian-dashboard-main
npm run dev

# Expected output:
# vite v5.4.19 dev server running at:
# ➜  Local:   http://localhost:8080/
# ➜  press h + enter to show help

# Frontend accessible at: http://localhost:8080
# Press Ctrl+C to stop
```

**Note**: If port 8080 is in use, Vite will use 8081, 8082, etc.

---

## Verification

### 1. Backend Health Check

```bash
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-04-03T14:30:00.000Z"}
```

### 2. Frontend Access

- Open http://localhost:8080 in browser
- Should see login page
- No console errors in DevTools (F12)

### 3. Test Backend API

Using curl or VS Code REST Client:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "CS21002",
    "password": "pass456",
    "deviceId": "test-device-local-dev"
  }'

# Expected: Returns tokens and user object
```

Test credentials:
- Roll: CS21002, Password: pass456 (ready to login)
- Roll: CS21001, Password: pass123 (needs activation)

See API-CONTRACTS.md for full credential list.

---

## Troubleshooting

### Issue: "npm: command not found"

**Cause**: Node.js not installed

**Fix**:
1. Download Node.js from https://nodejs.org/
2. Restart terminal
3. Verify: `node --version`

### Issue: "Port 3000 already in use"

**Cause**: Another service using port 3000

**Fix** (Option 1):
```bash
# macOS/Linux
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Windows (PowerShell as admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force
```

**Fix** (Option 2): Use different port
```bash
PORT=3001 npm run dev
```

### Issue: "Cannot find module '@nexus/core'"

**Cause**: Dependencies not installed or build failed

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
npm run dev
```

### Issue: "EACCES: permission denied, open '.env'"

**Cause**: File permissions issue

**Fix**:
```bash
chmod 644 .env
```

### Issue: "Cannot find 'vite' command"

**Cause**: Frontend dependencies not installed

**Fix**:
```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm install
npm run dev
```

### Issue: Frontend shows blank page after login

**Cause**: AppSidebar.tsx missing import (known issue)

**Fix**: Add to `src/components/layout/AppSidebar.tsx`:
```typescript
import { getDisplayName, getUserInitials } from "@/lib/utils";
```

### Issue: "CORS error: Access-Control-Allow-Origin not present"

**Cause**: Frontend and backend not on expected ports

**Verify**:
- Backend running at http://localhost:3000? (check Terminal 1)
- Frontend running at http://localhost:8080? (check Terminal 2)
- Browser console showing which request is blocked?

**Note**: CORS is pre-configured for localhost:8080 and localhost:5173

### Issue: "Login fails with DEVICE_ALREADY_BOUND"

**Cause**: Account has active session on another device (by design)

**Fix**:
1. Logout from first device, or
2. Use `/auth/device/switch` endpoint (see API-CONTRACTS.md)

---

## Project Structure After Installation

```
nexus/
├── .env                          # Local config (you create this)
├── .git/
├── .gitignore
├── README.md
├── API-CONTRACTS.md
├── HowToInstall.md              # This file
├── BootstrapPrompt.md
│
├── node_modules/                 # Created by: npm install (root)
├── package.json
├── package-lock.json             # Created by: npm install
├── tsconfig.base.json
├── tsconfig.json
├── test.http
│
├── backend/
│   ├── core/
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── index.ts
│   │   │   ├── logger.ts
│   │   │   ├── config/
│   │   │   ├── logger/
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── dist/                 # Created by: npm run build
│   │   │   ├── index.js
│   │   │   ├── index.d.ts
│   │   │   ├── config.js
│   │   │   └── ... (compiled files)
│   │   ├── node_modules/         # Created by: npm install
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── server.ts         # Entry point
│   │   │   ├── app.ts            # Fastify app
│   │   │   ├── plugins/
│   │   │   │   └── auth.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── students.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── access.ts
│   │   │   │   ├── presence.ts
│   │   │   │   └── incidents.ts
│   │   │   ├── services/
│   │   │   │   └── auth-service.ts
│   │   │   ├── stores/
│   │   │   │   └── mock-auth-store.ts
│   │   │   ├── schemas/
│   │   │   │   └── auth.ts
│   │   │   └── types/
│   │   │       └── fastify.d.ts
│   │   ├── dist/                 # Created by: npm run build
│   │   │   ├── server.js
│   │   │   ├── app.js
│   │   │   └── ... (compiled files)
│   │   ├── node_modules/         # Created by: npm install
│   │   ├── API-CONTRACTS.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── services/                 # Future: microservices
│   ├── ingestion/                # Future: event pipeline
│   ├── realtime/                 # Future: WebSocket service
│   ├── ml-services/              # Future: scoring
│   ├── docker/
│   └── scripts/
│
└── frontend/web-dashboard/campus-guardian-dashboard-main/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── config/
    │   │   └── env.ts
    │   ├── services/
    │   │   ├── authApi.ts
    │   │   ├── apiClient.ts
    │   │   └── dataApi.ts
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   ├── lib/
    │   │   └── utils.ts
    │   ├── mocks/
    │   │   └── data.ts
    │   ├── components/
    │   ├── pages/
    │   └── types/
    ├── public/
    ├── dist/                     # Created by: npm run build
    │   ├── index.html
    │   ├── assets/
    │   │   ├── index.css
    │   │   └── index.js
    │   └── ...
    ├── node_modules/             # Created by: npm install
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── eslint.config.js
    ├── playwright.config.ts
    ├── index.html
    ├── package.json
    ├── README.md
    └── bun.lockb
```

---

## Commands Reference

### Root Level: `/nexus`

```bash
npm install                # Install all dependencies
npm run build              # Build all backend packages
npm run build:core         # Build @nexus/core only
npm run build:gateway      # Build @nexus/api-gateway only
npm run dev                # Start backend dev server (watch mode)
npm run start              # Start backend production server
npm run lint               # Lint all TypeScript files
npm run test               # Run tests (not yet implemented)
```

### Backend Core: `/nexus/backend/core`

```bash
npm run build              # Compile TypeScript to JavaScript
npm run clean              # Remove dist/ directory
```

### Backend Gateway: `/nexus/backend/api-gateway`

```bash
npm run build              # Compile TypeScript to JavaScript
npm run start              # Run compiled server (production)
npm run dev                # Run with ts-node (development with auto-reload)
npm run watch              # Run with nodemon (alternative watch mode)
```

### Frontend: `/nexus/frontend/web-dashboard/campus-guardian-dashboard-main`

```bash
npm run dev                # Start Vite dev server
npm run build              # Build for production
npm run build:dev          # Build for development
npm run preview            # Preview production build locally
npm run lint               # Lint code
npm run test               # Run Vitest tests
npm run test:watch        # Run tests in watch mode
```

---

## What Gets Created During Installation

| Item | Where | Created By | Size |
|------|-------|------------|------|
| node_modules (root) | `./node_modules/` | `npm install` | ~200 MB |
| node_modules (core) | `backend/core/node_modules/` | `npm install` | ~100 MB |
| node_modules (gateway) | `backend/api-gateway/node_modules/` | `npm install` | ~150 MB |
| node_modules (frontend) | `frontend/.../node_modules/` | `npm install` | ~500 MB |
| package-lock.json | `./package-lock.json` | `npm install` | ~500 KB |
| dist (core) | `backend/core/dist/` | `npm run build` | ~2 MB |
| dist (gateway) | `backend/api-gateway/dist/` | `npm run build` | ~3 MB |
| dist (frontend) | `frontend/.../dist/` | `npm run build` | ~1 MB |
| .env | `./.env` | You (manual) | <1 KB |

**Total disk space needed**: ~1 GB (mostly for node_modules)

---

## What's NOT in Remote Repository (in .gitignore)

These files/directories are generated locally and never committed to git:

```
node_modules/              # All npm packages
package-lock.json         # Dependency lock (actually committed)
dist/                     # Compiled output
.env                      # Environment variables
.cache/                   # Build cache
logs/                     # Log files
*.log                     # Log files
coverage/                 # Test coverage reports
test-results/            # Test results
.DS_Store                # macOS files
Thumbs.db                # Windows files
.idea/                   # IDE files
.turbo/                  # Turbo cache
.pnpm-store/            # Package manager cache
```

**Why**:
- `node_modules/` takes ~1 GB; npm install regenerates it
- `dist/` is build output; easily regenerated
- `.env` contains local config/secrets; not shared
- IDE files are personal preferences
- Cache files are temporary

---

## Documentation

- **Project Overview**: [README.md](./README.md)
- **API Specification**: [API-CONTRACTS.md](./backend/api-gateway/API-CONTRACTS.md)
- **Backend Core**: [backend/core/README.md](./backend/core/README.md)
- **Test Requests**: [test.http](./test.http)

---

**Last updated**: April 3, 2026
**Compatible with**: Node.js v18+, npm v9+
