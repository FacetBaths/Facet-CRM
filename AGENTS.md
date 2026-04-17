# AGENTS.md — Facet CRM

Facet CRM is an internal full-stack CRM + POS replacement for Facet Renovations, replacing LEAP and SalesPro. It is an **internal tool** used by employees, sales reps, contractors, and admins. Average ticket value is $17,500 with a 60% close rate.

---

## Git Workflow

- **Never commit directly to `master`**
- Always create a feature branch before making changes: `omc-feat/<description>` or `omc-fix/<description>`
- Do not open PRs or push to `master` without explicit instruction from the user

### Commit Frequency — REQUIRED

Commit **after every discrete, working unit of change**. Do not accumulate work across multiple files or features before committing. Examples of commit triggers:
- A new component or page is complete and renders without errors
- A new API endpoint is wired up and returning correct responses
- A Pinia store is created and connected to its page
- A bug is fixed
- A schema field is added with all compatibility changes applied
- Any refactor that leaves the build in a passing state

**If you have been working for more than ~15 minutes without committing, stop and commit what works.**

### Commit Message Format — REQUIRED

Use the conventional commit format: `type(scope): short summary`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`

The body is **mandatory** — never commit with just a subject line. Every commit body must answer:
1. **What** changed (list the files and what each does)
2. **Why** it was changed or what problem it solves
3. Any **caveats** — incomplete wiring, known issues, follow-up needed

**Good example:**
```
feat(subscriptions): Radiance billing dashboard

- SubscriptionsPage.vue — filterable list of active/paused/cancelled
  subscriptions; upcoming renewal alerts for next 7 days highlighted
- SubscriptionCard.vue — plan, billing frequency, next bill date,
  service history, payment status
- subscriptionStore.ts — Pinia store for GET/POST/PUT /api/subscriptions
  and /dashboard/upcoming renewal alerts endpoint

Covers priority item #6 from PROJECT_ROADMAP.md.
```

**Bad examples (do not do this):**
```
git commit -m "updates"
git commit -m "WIP"
git commit -m "fix stuff"
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Quasar Framework + TypeScript + Pinia |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Realtime | Socket.io |
| Auth | JWT (7d expiry, stored in localStorage) |
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

**Required env — copy `.env.example` to `.env` and fill in values:**
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server `.env.example`:**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facet-crm
JWT_SECRET=replace-with-a-random-string-min-32-chars
CLIENT_URL=http://localhost:5173
```

**client `.env.example`:**
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

**Validate your changes before committing:**
```bash
# TypeScript build (server) — must exit 0
cd server && npm run build

# Lint (both workspaces)
cd server && npm run lint
cd client && npm run lint
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

**Backend `AuthRequest` pattern** — every route handler must use `AuthRequest` (not `Request`) so `req.user` is typed:
```typescript
import { AuthRequest, requireRole } from '../middleware/auth';

router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id; // typed, safe
});
```

**`filterByUserRole` pattern** — all list and detail endpoints must filter by role. This is **not** a shared middleware file; it is defined as an inline async middleware function at the top of each route file. Copy the pattern from `server/src/routes/projects.ts` or `customers.ts` when adding new list endpoints:
```typescript
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.roles?.includes('admin')) return next(); // admins see all
  (req as any).roleFilter = { /* scope to req.user._id */ };
  next();
};

router.get('/', filterByUserRole, async (req: AuthRequest, res: Response) => {
  const query = { ...(req as any).roleFilter };
  // ...
});
```

`requireRole(...roles)` guards write/admin-only endpoints. Always preserve both patterns — do not bypass.

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
- Socket.io listeners on Project Detail\n- PnL Reporting — per-project profit/loss

### 🚧 Frontend — Pending (Priority Order)\n\n1. **Audit Trail full history UI** — store + display full change log (backend ready)\n2. **Calendar System** — sales appointment scheduling + production scheduling\n   - Month/week/day views, conflict detection, drag-to-reschedule\n   - Schema: `calendar_events` collection (see `PROJECT_ROADMAP.md`)\n3. **Email Integration** — IMAP/SMTP with privateemail.com\n   - Link threads to Customers/Projects, auto-log to activity feed\n4. **Products Catalog Management** — add/edit products with variants\n5. **Vendors Management** page\n6. **Subscriptions Dashboard** — Radiance billing, renewal alerts\n7. **POS Frontend** — retail checkout for Facet Refinery\n8. **File Uploads** — attach contracts/photos (S3 or local)

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
| `SCHEMA_AUDIT.md` | Field-level frontend compatibility audit — check before adding/removing fields |
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
- Always use `AuthRequest` (not `Request`) — imported from `../middleware/auth`
- Always set `createdBy` / `updatedBy` from `req.user._id` on mutations
- Activity log entries must include `userId` and `timestamp`
- Apply `filterByUserRole` inline middleware to all list and detail endpoints (see pattern in RBAC section above)
- After making changes, run `cd server && npm run build` to confirm TypeScript compiles

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
