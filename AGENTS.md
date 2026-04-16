# AGENTS.md — Facet CRM

Facet CRM is an internal full-stack CRM + POS replacement for Facet Renovations, replacing LEAP and SalesPro. It is an **internal tool** used by employees, sales reps, contractors, and admins. Average ticket value is $17,500 with a 60% close rate.

---

## Git Workflow

- **Never commit directly to `master`**
- Always create a feature branch before making changes: `omc-feat/<description>` or `omc-fix/<description>`
- Commit frequently with descriptive messages
- Do not open PRs or push to `master` without explicit instruction from the user
- Include meaningful commit messages that explain *why*, not just *what*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Quasar Framework + TypeScript + Pinia |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Realtime | Socket.io |
| Auth | JWT (24h expiry, stored in localStorage) |
| HTTP Client | Axios |
| Security | Helmet.js, bcryptjs, rate limiting (100 req/15min) |

**Dev Ports:** Backend → `3000`, Frontend → `5173`

---

## Project Structure

```
facet-crm/
├── server/src/
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express route handlers
│   ├── middleware/   # Auth, role filtering
│   └── index.ts      # Entry point
├── client/src/
│   ├── pages/        # Vue page components
│   ├── stores/       # Pinia stores
│   ├── components/   # Reusable components
│   └── boot/         # App initialization (axios, socket)
├── docs/
│   ├── TECHNICAL_SPECS.md   # Full schema + architecture reference
│   ├── API_REFERENCE.md     # Complete API docs
│   └── USER_GUIDE.md
├── PROJECT_ROADMAP.md       # Completion status + priority tasks
└── TODO.md                  # Granular task list
```

---

## Running the Project

```bash
# Backend (port 3000)
cd server && npm install && npm run dev

# Frontend (port 5173)
cd client && npm install && npm run dev
```

**Required env — server `.env`:**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facet-crm
JWT_SECRET=<min 32 chars>
CLIENT_URL=http://localhost:5173
```

**Required env — client `.env`:**
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Design System — STRICT RULES

All UI must adhere to this system. Do not deviate.

### Visual Identity
- **Font:** Tomorrow (already imported globally)
- **Background:** Animated purple/green gradient on every page
- **Cards:** Glassmorphism — `backdrop-filter: blur`, `rgba(255,255,255,0.25)` background, `rgba(255,255,255,0.3)` border
- **Component:** Use `<q-card class="glass-card">` — this class is already defined globally

### Color Palette
```
Primary (purple):    #9945FF
Secondary (green):   #14F195
Accent (magenta):    #9C27B0
Dark:                #1D1D1D
Glass background:    rgba(255, 255, 255, 0.25)
Glass border:        rgba(255, 255, 255, 0.3)
```

### Status Badge Colors (Pipeline Stage Groups)
- **Prospect** (Lead → Contract Sent): blue `#2196F3`
- **Customer** (Signed → Deal Scrub): orange `#FF9800`
- **Production** (Materials flow): purple `#9C27B0`
- **Install** stages: green `#14F195` with dark text
- **Completed** (Funding Received): green `#21BA45`
- **Cancelled**: red `#C10015`

### Activity Feed Colors
- Note: purple `#9945FF`
- Status Change: green `#14F195`
- Task Complete: cyan `#31CCEC`
- Payment: green `#21BA45`
- Call: amber `#F2C037`

### Mobile-First
- Contractors use phones on job sites — all UI must be responsive
- Test every new page/component at mobile width

---

## Role-Based Access Control

| Role | Access |
|------|--------|
| `admin` | Full access to everything |
| `manager` | All data in assigned markets |
| `sales` | Own customers + projects only |
| `bdc` | Lead management + commission view |
| `design_consultant` | Design appointments + measurements |
| `production` | Production schedule + task updates |
| `warehouse` | Inventory + materials |
| `installer` | Install scheduling + task updates |
| `contractor` | View/update own tasks only |

**Frontend role check pattern:**
```typescript
const isAdmin = user.roles.includes('admin');
const isSales = user.roles.includes('sales');
```

**Backend:** `filterByUserRole` middleware auto-filters list endpoints. `requireRole(...roles)` guards sensitive endpoints. Always preserve this — do not bypass.

---

## Database Key Concepts

- **Projects are the central entity** — activities, tasks, payments, expenses are all embedded sub-documents
- **Project number format:** `PR{YY}{MM}{####}` (e.g., `PR26030001`)
- **Employee ID format:** `{MARKET}-{ROLE}{SEQUENCE:4}` (e.g., `IL-FRS0001`)
- **Notifications** are in-memory (lost on restart) — acceptable for MVP, migrate to MongoDB for production
- See `docs/TECHNICAL_SPECS.md` for full schema definitions

### Embed vs Reference Decision
- **Embed:** activities, tasks, payments, expenses, change orders (project sub-documents)
- **Reference:** Users, Customers, Products, Vendors, Markets, Teams

---

## Socket.io Events

Backend already broadcasts these — frontend must listen:

```javascript
// Join/leave rooms in ProjectDetailPage
socket.join(`project:${projectId}`)

// Events to handle
'project:activity'     → append to activity feed
'project:task'         → { action: 'updated', task } → update task list
'project:payment'      → { amount, totalPaid, percentPaid } → update payment bar
'project:changeOrder'  → { action: 'created', changeOrder }
'customer:updated'     → refresh customer data
'project:updated'      → refresh project data
```

---

## Current State (as of April 2026)

### ✅ Backend — Complete
- All 6 Mongoose models (Users, Customers, Vendors, Products, Projects, Subscriptions)
- Markets + Teams models (April 2026)
- Full REST API for all entities
- JWT auth with role-based access + filtering middleware
- Socket.io wired and broadcasting
- Audit trail on all records (createdBy, updatedBy, activity attribution)
- Commission calculation with split support
- Payment void/correction with audit trail

### ✅ Frontend — Complete
- Glassmorphism design system
- Login page
- Dashboard with role-based stats
- Projects list (filters + create dialog)
- **Project Detail Page** (flagship): activity feed, tasks, payments, change orders, real-time updates
- Customer list + Customer Detail Page
- Socket.io listeners on Project Detail

### 🚧 Frontend — Pending (Priority Order)

1. **Audit Trail full history UI** — store + display full change log (backend ready)
2. **Calendar System** — sales appointment scheduling + production scheduling
   - Month/week/day views, conflict detection, drag-to-reschedule
   - Schema: `calendar_events` collection (see `PROJECT_ROADMAP.md`)
3. **Email Integration** — IMAP/SMTP with privateemail.com
   - Link threads to Customers/Projects, auto-log to activity feed
4. **Products Catalog Management** — add/edit products with variants
5. **Vendors Management** page
6. **Subscriptions Dashboard** — Radiance billing, renewal alerts
7. **POS Frontend** — retail checkout for Facet Refinery
8. **PnL Reporting** — per-project profit/loss
9. **File Uploads** — attach contracts/photos (S3 or local)

---

## Developer Documentation

Agents are responsible for **creating and maintaining developer docs** as work progresses. Do not defer this — docs must be updated in the same commit as the code change.

### What to document

**Schema changes** — Any time a field is added, renamed, removed, or its type changes on a Mongoose model, the doc must include a change impact table:

```
Field added: Project.marketId (ObjectId, ref: Market)

Compatibility checklist:
- server/src/models/Project.ts       → add field to IProject interface + schema
- server/src/routes/projects.ts      → add to populate() calls where needed
- server/src/middleware/auth.ts      → update filterByUserRole if access logic affected
- docs/TECHNICAL_SPECS.md           → update schema definition
- docs/API_REFERENCE.md             → update request/response examples
- client/src/stores/projectStore.ts  → update TypeScript interface
- client/src/pages/ProjectDetail*    → update UI if field is user-visible
```

**New API endpoints** — Every new route must be documented in `docs/API_REFERENCE.md` with:
- Method + path
- Auth requirement and minimum role
- Request body shape (with field types)
- Response shape (with field types)
- Error responses

**New Socket.io events** — Document in `docs/TECHNICAL_SPECS.md` under the Socket.io section with event name, payload shape, and which page/component should listen.

**Business logic** — Any non-obvious calculation (commission splits, milestone triggers, payment plan logic) must have an inline comment block explaining the *why*, not just the *what*.

**Cross-cutting changes** — If a change touches both frontend and backend (e.g. a new field flows from DB → API → Pinia store → UI), add a one-paragraph "Data flow" note in the relevant doc.

### Where docs live

| Document | Purpose |
|----------|---------|
| `docs/TECHNICAL_SPECS.md` | Full schema definitions, architecture, design decisions |
| `docs/API_REFERENCE.md` | Every endpoint: method, auth, request, response, errors |
| `docs/USER_GUIDE.md` | Feature descriptions for non-technical stakeholders |
| `AGENTS.md` | Agent context, conventions, and current state |
| `PROJECT_ROADMAP.md` | Completion status and priority order |

### Style rules
- **Concise over comprehensive** — one clear sentence beats three vague ones
- Use concrete examples, not abstract descriptions
- Keep `TECHNICAL_SPECS.md` schema blocks in sync with actual Mongoose models
- After any significant feature addition, update the **Current State** section in this file

---

## Coding Conventions

### TypeScript
- Always type API responses — do not use `any`
- Use `interface` for data shapes, `type` for unions/utility types
- Prefer Composition API (`<script setup>`) in all Vue components

### Vue / Quasar
- Use Quasar components (`q-btn`, `q-input`, `q-card`, etc.) — do not bring in external UI libraries
- All cards use `glass-card` class
- Page-level components go in `client/src/pages/`
- Reusable components go in `client/src/components/`
- State lives in Pinia stores (`client/src/stores/`)

### Backend
- All routes require auth middleware unless explicitly public
- Always set `createdBy` / `updatedBy` from `req.user._id` on mutations
- Activity log entries must include `userId` and `timestamp`
- Apply `filterByUserRole` to all list and detail endpoints

### API Conventions
- Auth header: `Authorization: Bearer <token>`
- All endpoints prefixed `/api/`
- Errors return `{ message: string }` with appropriate HTTP status

---

## Business Context

- **Facet Renovations** — bathroom renovations (~$17,500 avg ticket, 4–6 week lead time, 1–3 day installs)
- **Facet Radiance** — subscription cleaning/maintenance service (Edge + Apex plans)
- **Facet Refinery** — retail products (POS needed)
- **Team:** Peter & Alex (sales), Nick (procurement), Rich (production), 11 contractors (1099)
- **Replacing:** LEAP (project/pipeline mgmt) + SalesPro (sales tracking/POS Project Builder and estimator)
- **Key pain points solved:** activity feed, task workflows, change order visibility, payment milestone tracking

---

## Security — Non-Negotiable

- **Never commit secrets, API keys, passwords, or tokens** to git under any circumstances
- **Never commit `.env` files** — they are in `.gitignore` and must stay there
- If a new environment variable is needed, add it to `.env.example` with a placeholder value only
- Never hardcode credentials, connection strings, or JWT secrets in source code
- Never log sensitive values (tokens, passwords, full request bodies with auth headers)

---

## Do Not

- Do not break the glassmorphism design — it is a core brand requirement
- Do not bypass role-based access filtering middleware
- Do not use `any` types in TypeScript
- Do not add new npm packages without checking if Quasar already provides the functionality
- Do not push to `master`
- Do not persist notifications to MongoDB yet (in-memory is intentional for MVP)

---

*A luxurious look. A cut above.*
