# Facet CRM - Project Roadmap

**Status:** MVP Foundation Complete (~60% done)  
**Last Updated:** 2026-03-31  
**Repo:** https://github.com/FacetBaths/Facet-CRM

---

## Core Requirements (From Initial Discussion)

### Pain Points LEAP Had
- [x] Activity feed (notes were black holes)
- [x] Task workflows with assignments
- [x] Change order visibility
- [ ] Service calls separate from projects (schema ready, UI pending)
- [x] Payment milestone tracking (including payment plans)
- [x] Real-time Socket.io updates on Project Detail page (✅ Frontend complete - March 30)

### New Divisions
- [x] Facet Renovations (bathrooms) - FULL SUPPORT
- [ ] Facet Radiance (subscriptions) - SCHEMA READY, UI PENDING
- [ ] Facet Refinery (retail products) - SCHEMA READY, UI PENDING

### Major New Requirements (Added 2026-03-29)

#### Calendar/Scheduling System (Sales & Production)
**Purpose:** Replace LEAP's shared calendars with native CRM scheduling
**Current State (LEAP):** Sales appointments calendar → syncs to SalesPro for assigned rep; Production calendar → tracks installer schedules

**CRM Features:**
- [ ] Sales appointment scheduling linked to Projects/Customers
- [ ] Production calendar for installer scheduling
- [ ] Calendar view in CRM (month/week/day)
- [ ] Appointment notifications (reminders for reps/installers)
- [ ] Conflict detection (double-booking prevention)

**Schema Additions:**
```
calendar_events
├── title, description
├── type: enum[sales_appointment, install_slot, delivery, other]
├── projectId (ref - optional)
├── customerId (ref - optional)
├── assignedUserIds: [refs] (rep or installer)
├── startTime, endTime
├── location/address
├── status: enum[scheduled, confirmed, completed, cancelled, no_show]
└── source: enum[crm_created, imported]
```

**Nice to Have:** Google/Outlook calendar sync for contractor schedules

#### Email Integration (privateemail.com)
**Current State:** Private email hosted on privateemail.com, separate from CRM

**CRM Integration:**
- [ ] IMAP/SMTP connection to privateemail.com
- [ ] Email threads linked to Customers/Projects
- [ ] Send email directly from CRM (with templates)
- [ ] Email activity auto-logged to project feed
- [ ] File attachments stored in project files

**Features:**
- [ ] Email composer with contact auto-complete
- [ ] Templates for common communications (appointment confirmation, install notice, etc.)
- [ ] Email history per customer/project
- [ ] "Send and Log" button in project detail

**Schema Additions:**
```
emails
├── customerId (ref)
├── projectId (ref - optional)
├── threadId (for grouping conversations)
├── direction: enum[inbound, outbound]
├── subject, body (text + html)
├── from: {name, email}
├── to: [{name, email}]
├── cc, bcc
├── sentAt/receivedAt
├── status: enum[draft, sent, delivered, read, replied]
└── attachments: [{filename, url, size}]
```

---

## Completion Status

### Backend ✅ DONE
- [x] All 6 Mongoose models (Users, Customers, Vendors, Products, Projects, Subscriptions)
- [x] JWT auth with role-based access (admin, bdc, sales, design_consultant, production, contractor)
- [x] Complete REST API for all entities
- [x] Socket.io wired for real-time notifications
- [x] Activity feed API (POST /projects/:id/activities)
- [x] Task management API (POST/PUT /projects/:id/tasks)
- [x] Payment tracking API (POST /projects/:id/payments)
- [x] Change order API (POST /projects/:id/change-orders)
- [x] Payment milestone calculation (for those 2 nightmare projects)

### Frontend ✅ MVP FOUNDATION DONE
- [x] Glassmorphism aesthetic (matches stock_manager)
  - [x] Animated purple/green gradient background
  - [x] Glass-card components
  - [x] Tomorrow font family
  - [x] Responsive navbar
- [x] Login page with glassmorphism
- [x] Main layout with navigation
- [x] Dashboard with stats cards
- [x] Projects list with filters and create dialog
- [x] **PROJECT DETAIL PAGE** - The flagship feature
  - [x] Activity feed (chronological, color-coded by type)
  - [x] Task management (checkboxes, assignments, due dates)
  - [x] Payment progress bar with % paid
  - [x] Quick actions (Add Note/Task/Payment/Change Order)
  - [x] Customer info card
  - [x] Contract/balance display
- [x] Customers list with create dialog

### Frontend ✅ DONE (Recently Completed)
- [x] **Customer Detail Page** - View full customer, project history, communication log
- [x] **Socket.io integration** - Real-time updates when activities added
- [x] **Payment Edit/Void** - UI for correcting/voiding payments with audit trail

### Frontend ⏸️ PENDING
- [ ] Products catalog management (add/edit products with variants)
- [ ] Vendors management
- [ ] Subscriptions page (Radiance billing dashboard)
- [ ] **POS Frontend** - Retail checkout for Refinery products

---

## Priority Tasks (Next Session)

### HIGH PRIORITY

1. **Audit Trail / Change Tracking**
   - Add user attribution to all record changes (who + when)
   - Design: Clickable avatars with user initials next to changed fields
   - Show timestamp on hover/click of avatar
   - Apply to: Projects, Customers, Payments, Tasks, Change Orders
   - Store full audit history (not just latest change)

### COMPLETED RECENTLY (March 30-31)
- ✅ Socket.io Real-Time Updates - Frontend now listens for `project:activity`, `project:task`, `project:payment`, `project:changeOrder`, `customer:updated`, `project:updated`
- ✅ Customer Detail Page - Full customer profile with project history, activity feed sync working

### NEW HIGH PRIORITY (From 2026-03-29)

3. **Calendar System Backend**
   - Create `calendar_events` collection
   - REST API: GET/POST/PUT /calendar-events
   - Query by date range, user, project
   - Conflict detection logic

4. **Email Integration Backend**
   - Create `emails` collection
   - IMAP client for privateemail.com sync
   - REST API for send/receive
   - Webhook to auto-log emails to projects

5. **Calendar Views (Frontend)**
   - Calendar page with month/week/day views
   - Sales appointment scheduler
   - Production/installer scheduling
   - Drag-to-reschedule appointments

### MEDIUM PRIORITY
3. **Product Catalog Management**
   - Add products with variants (vanities with size/color options)
   - Set cost price vs retail price
   - Link to default vendor
   - Active/inactive toggle

4. **Payment Plan UI Enhancement**
   - Show milestone tracker for those 2 projects
   - Visual indicator: "47% paid - materials release at 50%"
   - Alert when approaching milestone

5. **Subscriptions Dashboard (Radiance)**
   - List active subscriptions
   - Upcoming renewal alerts
   - Service scheduling calendar

### LOWER PRIORITY
6. **PnL Reporting**
   - Per-project profit/loss view
   - Revenue vs expenses
   - Labor cost tracking

7. **File Uploads**
   - Attach contracts, photos to projects
   - Store in S3 or local

8. **POS Frontend**
   - Quick checkout for Refinery retail
   - Barcode scanning support

---

## Technical Architecture Reference

### Database Schema
```
users
├── role: enum[admin, bdc, sales, design_consultant, production, contractor]
├── email, passwordHash, firstName, lastName
└── isActive

customers
├── firstName, lastName
├── contacts: [{type, name, phone, email, address}]
└── referralSource, notes

vendors
├── name, type: enum[supplier, subcontractor, utility, other]
├── taxId, paymentTerms
└── contacts: [{type, name, phone, email}]

products
├── name, description
├── category: enum[materials, labor, service, package, retail]
├── type: enum[physical, service, package]
├── defaultVendorId (ref)
└── variants: [{sku, size, costPrice, retailPrice, isActive}]

projects (THE BIG ONE)
├── projectNumber (unique, indexed)
├── customerId (ref), type, status (pipeline enum)
├── title, description, address
├── assignedSalesId (ref), source, leadDate
├── lineItems: [{productId, description, qty, unitPrice, total, category}]
├── tasks: [{title, description, assignedTo, dueDate, status, completedAt}]
├── activities: [{type, userId, timestamp, content, metadata}]
├── changeOrders: [{description, reason, amount, status, requestedBy}]
├── paymentTerms: {type, total, milestones: [{percent, label, required, completed}]}
├── payments: [{amount, date, type, method, appliedToMilestone}]
└── expenses: [{vendorId, description, amount, date, category, invoiced, paid}]

subscriptions (for Radiance)
├── customerId, plan: enum[edge, apex], status
├── billingFrequency, monthlyAmount, annualAmount, nextBillDate
├── services: [{type, season, scheduledDate, completedDate, status}]
└── payments: [{amount, date, status, method}]
```

### API Endpoints
```
AUTH
POST /api/auth/login
POST /api/auth/register (admin only)

PROJECTS
GET    /api/projects              # List with filters
POST   /api/projects              # Create
GET    /api/projects/:id          # Detail (populates all refs)
PUT    /api/projects/:id          # Update
POST   /api/projects/:id/activities   # Add note/activity
POST   /api/projects/:id/tasks        # Add task
PUT    /api/projects/:id/tasks/:id    # Update task status
POST   /api/projects/:id/payments     # Record payment
POST   /api/projects/:id/expenses     # Add expense
POST   /api/projects/:id/change-orders # Create CO

CUSTOMERS
GET  /api/customers
POST /api/customers
GET  /api/customers/:id
PUT  /api/customers/:id

USERS
GET /api/users

PRODUCTS
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

VENDORS
GET    /api/vendors
POST   /api/vendors
PUT    /api/vendors/:id

SUBSCRIPTIONS
GET  /api/subscriptions
POST /api/subscriptions
GET  /api/subscriptions/dashboard/upcoming
```

### Socket.io Events (Backend Already Broadcasting)
```javascript
// When activity added
io.to(`project:${projectId}`).emit('project:activity', activity)

// When task updated
io.to(`project:${projectId}`).emit('project:task', { action: 'updated', task })

// When payment added
io.to(`project:${projectId}`).emit('project:payment', { amount, totalPaid, percentPaid })

// When change order created
io.to(`project:${projectId}`).emit('project:changeOrder', { action: 'created', changeOrder })
```

**Frontend needs:** Listen for these events in ProjectDetailPage.vue and update stores.

---

## Design System Reference

### Colors
- Primary: `#9945FF` (purple)
- Secondary: `#14F195` (green)
- Accent: `#9C27B0` (magenta)
- Dark: `#1D1D1D`
- Glass Light: `rgba(255, 255, 255, 0.25)`
- Glass Border: `rgba(255, 255, 255, 0.3)`

### Glass Card Pattern
```vue
<q-card class="glass-card">
  <!-- Content -->
</q-card>
```

### Pipeline Stage Groups (Like LEAP)
**Prospect** (blue)
- Lead → Appointment → Rehash/Multitouch → Contract Sent

**Customer** (orange)
- Contract Signed → Initial Funding Cleared → Deal Scrub In Progress → Change Order Needed → Deal Scrub Complete

**Production** (purple)
- Materials Ordered → Materials Released → Materials Received

**Install** (green)
- Contacted for Install → Install In Progress → Install Hung → Install Complete (Service Needed) → Install Complete

**Completed** (green)
- Funding Received

### Status Badge Colors
- Prospect stages: blue (#2196F3)
- Customer stages: orange (#FF9800)
- Production stages: purple (#9C27B0)
- Install stages: green (#14F195) with dark text
- Completed: green (#21BA45)
- Cancelled: red (#C10015)

### Activity Type Colors
- Note: purple (#9945FF)
- Status Change: green (#14F195)
- Task Complete: cyan (#31CCEC)
- Payment: green (#21BA45)
- Call: amber (#F2C037)

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET
npm run dev  # Port 3000
```

### Frontend
```bash
cd client
npm install
npm run dev  # Port 5173
```

---

## Environment Setup

### Server `.env`
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facet-crm
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
```

### Client `.env`
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Testing Checklist (Before Production)

- [ ] Create user and login
- [ ] Create customer
- [ ] Create project with line items
- [ ] Add activity/note (appears in feed)
- [ ] Add task and assign to user
- [ ] Mark task complete (auto-logs to activity)
- [ ] Record payment (progress bar updates)
- [ ] Create change order
- [ ] Verify activity feed shows all events chronologically
- [ ] Test real-time updates with two browser windows
- [ ] Test role-based access (contractor vs admin)
- [ ] Create subscription for customer
- [ ] Add product to catalog
- [ ] Create vendor

---

## Notes for Future Sessions

**When resuming work:**
1. Check `PROJECT_ROADMAP.md` for current status
2. Review `memory/YYYY-MM-DD.md` for recent context
3. Pick next task from HIGH PRIORITY section
4. Update this file when completing tasks

**Design Philosophy:**
- Activity feed is THE killer feature - make it visible and real-time
- Glassmorphism is required - all cards must have blur effect
- Purple/green gradient background on all pages
- Tomorrow font family
- Mobile-responsive is non-negotiable (contractors use phones on job sites)

**Business Context:**
- $17,500 average ticket
- 60% close rate
- 4-6 week lead times
- 1-3 day installs
- Currently manually tracking 2 payment plan projects
- Peter & Alex handle sales, Nick procurement, Rich production
- 11 contractors (1099)

---

## Questions to Ask User

1. **Hosting:** Where will this run? VPS? Railway? Heroku? Need to know for env config.

2. **File Storage:** Need S3/digital bucket for contracts/photos? Or local storage fine for MVP?

3. **Email Notifications:** Should task assignments trigger emails? Payment reminders?

4. **Integrations:** Still need Xero/SalesPro integration eventually, or full replacement?

5. **Mobile App:** Is mobile web enough, or need native app for contractors?

6. **Payment Processing:** Stripe/Square integration for taking payments directly?

### Calendar Integration Questions
7. **Data Migration:** Any historical calendar data from LEAP to import, or fresh start?
8. **Calendar Permissions:** Who can see/edit which calendars? (Sales vs Production access levels)
9. **Notifications:** Email/SMS reminders for appointments? How far in advance?

### Email Integration Questions
11. **privateemail.com Credentials:** Need SMTP/IMAP settings for Facet Renovations account
12. **Email Sharing:** Should all reps see all email threads, or only their assigned customers?
13. **Email Templates:** What standard emails do you send? (appointment confirmations, install reminders, etc.)
14. **Email Logging:** Auto-log all emails to CRM, or opt-in per email?
15. **Outbound Email:** Send from CRM using Facet domain, or individual rep emails?

---

*A luxurious look. A cut above.*
