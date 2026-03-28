# Facet CRM - Project Roadmap

**Status:** MVP Foundation Complete (45% done)  
**Last Updated:** 2026-03-22  
**Repo:** https://github.com/FacetBaths/Facet-CRM

---

## Core Requirements (From Initial Discussion)

### Pain Points LEAP Had
- [x] Activity feed (notes were black holes)
- [x] Task workflows with assignments
- [x] Change order visibility
- [ ] Service calls separate from projects (schema ready, UI pending)
- [x] Payment milestone tracking (including payment plans)
- [x] Real-time Socket.io updates on Project Detail page

### New Divisions
- [x] Facet Renovations (bathrooms) - FULL SUPPORT
- [ ] Facet Radiance (subscriptions) - SCHEMA READY, UI PENDING
- [ ] Facet Refinery (retail products) - SCHEMA READY, UI PENDING

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

### Frontend ⏸️ PENDING
- [ ] **Customer Detail Page** - View full customer, project history, communication log
- [ ] **Socket.io integration** - Real-time updates when activities added
- [ ] Products catalog management (add/edit products with variants)
- [ ] Vendors management
- [ ] Subscriptions page (Radiance billing dashboard)
- [ ] **POS Frontend** - Retail checkout for Refinery products

---

## Priority Tasks (Next Session)

### HIGH PRIORITY
1. **Socket.io Real-Time Updates**
   - Currently: Activity feed requires refresh
   - Should: Auto-update when someone adds note/task/payment
   - Location: `client/src/pages/ProjectDetailPage.vue` - add socket listener
   - Backend already broadcasts: `io.to(`project:${id}`).emit('project:activity', activity)`

2. **Customer Detail Page**
   - Full customer profile view
   - List of all their projects
   - Communication history
   - Payment history across all projects
   - File: `client/src/pages/CustomerDetailPage.vue`

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

---

*A luxurious look. A cut above.*
