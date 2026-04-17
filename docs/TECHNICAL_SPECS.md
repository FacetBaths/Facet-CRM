# Facet CRM - Technical Specifications

## Overview
Facet CRM is a unified replacement for LEAP and SalesPro, designed specifically for Facet Renovations' workflow.

---

## Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Quasar SPA    │────▶│  Express API     │────▶│   MongoDB       │
│   (Vue 3 + TS)  │◀────│  (Node + TS)   │◀────│   (Mongoose)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       │                         │
       │                  ┌──────┴──────┐
       │                  │  Socket.io  │
       └─────────────────▶│  (Real-time)│
                          └─────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Vue 3 | UI framework with Composition API |
| Quasar Framework | Component library + build tooling |
| TypeScript | Type safety |
| Pinia | State management |
| Socket.io Client | Real-time updates |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web framework |
| TypeScript | Type safety |
| Socket.io | Real-time bidirectional communication |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Mongoose | MongoDB ODM |
| Helmet | Security headers |
| CORS | Cross-origin handling |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB | Document store |
| Mongoose | Schema modeling + validation |

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  firstName: String,
  lastName: String,
  avatar: String,           // URL to avatar image
  bio: String,
  phone: String,
  phoneExtension: String,
  
  // Employment
  employeeId: String (unique, sparse),
  employmentType: Enum['full_time', 'part_time', 'contractor', 'intern'],
  status: Enum['active', 'inactive', 'suspended', 'terminated'],
  hireDate: Date,
  terminationDate: Date,
  department: String,
  
  // Roles & Permissions
  roles: [Enum['admin', 'bdc', 'sales', 'warehouse', 'production', 'contractor', 'manager', 'installer']],
  permissions: [String],  // Granular permissions beyond roles
  
  // Market/Region
  marketId: ObjectId (ref: Markets),
  markets: [ObjectId],      // Multi-market access for managers
  
  // Teams
  teamIds: [ObjectId],      // Teams/groups they belong to
  
  // Commission
  commissionTier: Number,   // 1, 2, 3 for different rates
  commissionSettings: {
    useFlatRate: Boolean,
    isOwner: Boolean
  },
  
  // Preferences
  preferences: {
    theme: Enum['light', 'dark', 'auto'],
    timezone: String,
    language: String,
    dateFormat: Enum['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
    timeFormat: Enum['12h', '24h'],
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
      desktop: Boolean
    },
    dashboardLayout: Object
  },
  
  // Security
  lastLoginAt: Date,
  lastLoginIp: String,
  failedLoginAttempts: Number,
  lockedUntil: Date,
  passwordChangedAt: Date,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  
  // Audit
  createdBy: ObjectId (ref: Users),
  updatedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### Markets Collection (NEW - April 2025)
```javascript
{
  _id: ObjectId,
  name: String,             // e.g., "Illinois", "New England"
  code: String,             // e.g., "IL", "NE" (uppercase, unique)
  status: Enum['active', 'inactive', 'planning'],
  
  // Location
  region: String,           // e.g., "Midwest", "Northeast"
  timezone: String,         // e.g., "America/Chicago"
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  
  // Contact
  phone: String,
  email: String,
  
  // Operations
  managerId: ObjectId (ref: Users),
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  // Settings
  settings: {
    currency: String,
    dateFormat: String,
    defaultTaxRate: Number
  },
  
  // Branding
  branding: {
    logoUrl: String,
    primaryColor: String,
    secondaryColor: String
  },
  
  // Audit
  createdBy: ObjectId (ref: Users),
  updatedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### Teams Collection (NEW - April 2025)
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: Enum['sales', 'production', 'bdc', 'warehouse', 'installers', 'custom'],
  
  // Membership
  memberIds: [ObjectId (ref: Users)],
  leadId: ObjectId (ref: Users),
  
  // Market scope
  marketId: ObjectId (ref: Markets),
  
  // Assignment rules
  autoAssignLeads: Boolean,
  assignmentStrategy: Enum['round_robin', 'least_active', 'manual'],
  
  // Metrics
  goals: {
    monthlyRevenue: Number,
    monthlyDeals: Number,
    startDate: Date,
    endDate: Date
  },
  
  // Status
  isActive: Boolean,
  
  // Audit
  createdBy: ObjectId (ref: Users),
  updatedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### CompanySettings Collection (Singleton)
```javascript
{
  _id: ObjectId,
  name: String,
  legalName: String,
  taxId: String,
  website: String,
  
  settings: {
    defaultTimezone: String,
    defaultCurrency: String,
    defaultDateFormat: String,
    defaultLanguage: String
  },
  
  employeeIdConfig: {
    enabled: Boolean,
    format: String,         // e.g., "{MARKET}-{ROLE}{SEQUENCE:4}"
    roleCodes: Map,         // { admin: 'FRA', sales: 'FRS', ... }
    marketCodes: Map,       // { marketId: 'IL', ... }
    lastSequence: Map       // { 'IL-FRA': 1, ... }
  },
  
  branding: {
    logoUrl: String,
    primaryColor: String,
    secondaryColor: String,
    faviconUrl: String
  },
  
  updatedBy: ObjectId,
  updatedAt: Date
}
```

### Customers Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  contacts: [{
    type: String,           // 'primary', 'secondary', 'billing'
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    }
  }],
  referralSource: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: Enum['materials', 'labor', 'service', 'package', 'retail'],
  type: Enum['physical', 'service', 'package'],
  defaultVendorId: ObjectId (ref: Vendors),
  variants: [{
    sku: String (unique),
    size: String,
    color: String,
    costPrice: Number,
    retailPrice: Number,
    isActive: Boolean
  }],
  isActive: Boolean,
  createdAt: Date
}
```

### Projects Collection
```javascript
{
  _id: ObjectId,
  projectNumber: String (unique, indexed),  // PR{YY}{MM}{####}
  customerId: ObjectId (ref: Customers),
  type: Enum['renovation', 'service', 'warranty', 'retail'],
  parentProjectId: ObjectId (ref: Projects), // for service calls
  status: Enum[
    // Prospect group
    'lead', 'appointment', 'rehash_multitouch', 'contract_sent',
    // Customer group  
    'contract_signed', 'funding_cleared', 'deal_scrub_in_progress', 'change_order_needed', 'deal_scrub_complete',
    // Production group
    'materials_ordered', 'materials_released', 'materials_received',
    // Install group
    'install_contacted', 'install_in_progress', 'install_hung', 'install_complete_service_needed', 'install_complete',
    // Completed
    'funding_received', 'completed', 'cancelled'
  ],
  title: String,
  description: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  assignedSalesId: ObjectId (ref: Users),
  contractorIds: [ObjectId (ref: Users)],  // NEW - April 2025
  marketId: ObjectId (ref: Markets),       // NEW - April 2025
  source: String,           // Lead source
  leadDate: Date,
  designAppointmentDate: Date,
  contractDate: Date,
  contractAmount: Number,
  
  // Line items (snapshot)
  lineItems: [{
    productId: ObjectId (ref: Products),
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    category: Enum['materials', 'labor', 'service']
  }],
  
  // Workflow tasks
  tasks: [{
    title: String,
    description: String,
    assignedTo: ObjectId (ref: Users),
    contractorId: ObjectId (ref: Users),   // NEW - April 2025
    dueDate: Date,
    status: Enum['pending', 'in_progress', 'completed', 'cancelled'],
    completedAt: Date,
    notes: String
  }],
  
  // Activity feed (chronological)
  activities: [{
    type: Enum['note', 'status_change', 'task_complete', 'payment', 'payment_correction', 'payment_voided', 'file_upload', 'call'],
    content: String,
    userId: ObjectId (ref: Users),
    timestamp: Date,
    metadata: Object    // Flexible extra data
  }],
  
  // Change orders
  changeOrders: [{
    description: String,
    reason: String,
    amount: Number,
    status: Enum['pending', 'approved', 'denied'],
    requestedBy: ObjectId (ref: Users),
    requestedAt: Date,
    respondedBy: ObjectId (ref: Users),
    respondedAt: Date
  }],
  
  // Payments
  paymentTerms: {
    type: Enum['standard', 'payment_plan'],
    total: Number,
    milestones: [{
      percent: Number,
      label: String,
      required: Boolean,
      completed: Boolean,
      trigger: Enum['manual', 'auto'],
      schedule: Enum['monthly'],
      monthlyAmount: Number
    }]
  },
  payments: [{
    amount: Number,
    date: Date,
    type: Enum['deposit', 'milestone', 'monthly', 'final'],
    method: Enum['cash', 'check', 'card', 'financing'],
    appliedToMilestone: Number,
    notes: String,
    recordedBy: ObjectId (ref: Users),
    // Correction/void tracking
    updatedAt: Date,
    updatedBy: ObjectId (ref: Users),
    voided: Boolean,
    voidedAt: Date,
    voidedBy: ObjectId (ref: Users),
    voidReason: String
  }],
  
  // Expenses (for PnL)
  expenses: [{
    vendorId: ObjectId (ref: Vendors),
    description: String,
    amount: Number,
    date: Date,
    category: Enum['materials', 'labor', 'permits', 'equipment', 'other'],
    invoiced: Boolean,
    paid: Boolean,
    invoiceNumber: String
  }],
  
  // Commission tracking - supports split commissions and spiffs
  commission: {
    salesReps: [{
      userId: ObjectId (ref: Users),
      splitPercent: Number,   // e.g., 50 for 50/50 split
      amount: Number,
      paid: Boolean,
      paidDate: Date
    }],
    bdcRepId: ObjectId (ref: Users),
    bdcAmount: Number,
    bdcPaid: Boolean,
    bdcPaidDate: Date,
    spiffs: [{
      description: String,
      amount: Number,
      awardedTo: ObjectId (ref: Users),
      paid: Boolean,
      paidDate: Date
    }],
    adminPaid: Boolean,
    adminPaidDate: Date,
    calculatedAt: Date,
    calcMethod: Enum['flat', 'percentage']
  },
  
  // Production dates
  materialsOrderedDate: Date,
  productionStartDate: Date,
  productionEndDate: Date,
  estimatedCompletionDate: Date,
  warrantyStartDate: Date,
  
  // Attachments
  attachments: [{
    filename: String,
    path: String,
    mimeType: String,
    size: Number,
    type: Enum['contract', 'photo', 'other'],
    uploadedBy: ObjectId (ref: Users),
    uploadedAt: Date
  }],

  // Audit fields
  createdBy: ObjectId (ref: Users),
  updatedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### Vendors Collection
```javascript
{
  _id: ObjectId,
  name: String,
  type: Enum['supplier', 'subcontractor', 'utility', 'other'],
  taxId: String,
  paymentTerms: String,
  isActive: Boolean,
  contacts: [{
    type: String,
    name: String,
    phone: String,
    email: String
  }],
  createdAt: Date
}
```

### Subscriptions Collection (Facet Radiance)
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customers),
  plan: Enum['edge', 'apex'],
  status: Enum['active', 'paused', 'cancelled'],
  billingFrequency: Enum['monthly', 'annual'],
  monthlyAmount: Number,
  annualAmount: Number,
  nextBillDate: Date,
  services: [{
    type: String,
    season: String,
    scheduledDate: Date,
    completedDate: Date,
    status: Enum['scheduled', 'completed', 'cancelled']
  }],
  payments: [{
    amount: Number,
    date: Date,
    status: Enum['pending', 'completed', 'failed'],
    method: String
  }],
  createdAt: Date
}
```

### Emails Collection
```javascript
{
  _id: ObjectId,
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  subject: String,
  bodyText: String,
  bodyHtml: String,
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    contentId: String
  }],
  receivedAt: Date,
  sentAt: Date,
  status: Enum['inbox', 'sent', 'draft'],
  threadId: String,
  labels: [String],
  projectId: ObjectId (ref: Projects),
  customerId: ObjectId (ref: Customers),
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notifications (In-Memory)

Notifications are stored in-memory for the MVP. Each notification has:

```javascript
{
  _id: String (timestamp-based),
  type: Enum['ping', 'system', 'mention', 'task_assigned', 'payment_received'],
  userId: String,           // Recipient
  fromUserId: String,       // Sender
  fromUserName: String,
  fromUserAvatar: String,
  message: String,
  read: Boolean,
  readAt: Date,
  createdAt: Date
}
```

**Note:** Notifications are ephemeral and will be lost on server restart. For production, migrate to MongoDB with TTL index.

---

## Email Integration

- Uses nodemailer for SMTP sending with privateemail.com
- Uses imapflow for IMAP fetching with 5-minute polling
- Automatic matching of emails to customers and projects based on email addresses
- Matched emails logged as project activities
- Credentials securely stored in .env

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
'email:sent'           → { email } → handle new sent email
'email:received'       → { email } → handle new received email
```

---

## Key Design Decisions

### 1. Embedded vs Reference Documents

**Embedded (denormalized):**
- Project activities, tasks, payments, expenses
- Product variants
- Customer contacts

**Referenced (normalized):**
- Users (shared across system)
- Customers (referenced by projects)
- Products (referenced by line items)
- Vendors (referenced by expenses)
- Markets (referenced by users and projects)
- Teams (referenced by users)

**Rationale:** Projects are the central workflow unit. Once created, activities/tasks rarely change relationships. Embedding reduces query complexity and enables atomic updates.

### 2. Project Number Generation
Auto-generated format: `PR{YY}{MM}{####}`
- Example: `PR26030001` = March 2026, first project
- Sequential counter resets monthly
- Guaranteed unique via compound index

### 3. Employee ID Generation
Auto-generated based on company config:
- Format: `{MARKET}-{ROLE}{SEQUENCE:4}`
- Example: `IL-FRS0001` = Illinois, Sales, #1
- Configurable role codes (FRA=admin, FRS=sales, etc.)
- Configurable market codes
- Auto-incrementing sequence per market-role combo

### 4. Real-Time Architecture
Socket.io rooms named `project:{id}` for scoped updates:
- User opens Project Detail page → joins room
- User closes/leaves → leaves room
- Events only broadcast to room members

### 5. Commission Calculation
Supports split commissions (multiple sales reps):
- Sales: 10% of contract OR $400 flat (per-user toggle)
- BDC: 1% of contract
- Admin: 2-3% based on role level (owner vs standard)
- Spiffs: Additional bonuses tracked separately

### 6. Role-Based Access Control
Multi-layered permissions:
- **Roles:** admin, manager, sales, bdc, warehouse, production, installer, contractor
- **Permissions:** Granular permissions beyond roles (e.g., `projects.view_all`, `commissions.calculate`)
- **Markets:** Users assigned to markets; multi-market access for managers
- **Teams:** Group-based access for team coordination

---

## Security Model

### Authentication
- JWT tokens with 24h expiry
- Stored in localStorage (acceptable for internal tool)
- Passwords hashed with bcrypt (10 rounds)
- Failed login attempt tracking with account locking
- Optional 2FA support (schema ready)

### Authorization (Role-Based)
| Role | Permissions |
|------|-------------|
| admin | Full access |
| manager | View all in assigned markets, manage teams |
| bdc | Lead management, commission view |
| sales | Customer/projects, commissions |
| design_consultant | Design appointments, measurements |
| production | Production schedule, task updates |
| warehouse | Inventory, materials management |
| installer | Install scheduling, task updates |
| contractor | Task view/update only |

### API Protection
- Helmet.js for security headers
- Rate limiting: 100 req/15min per IP
- CORS restricted to configured client URL
- Role-based route middleware

---

## Performance Considerations

### Database Indexes
- `projects.projectNumber` - Unique lookup
- `projects.customerId` - Customer project queries
- `projects.status` - Pipeline filtering
- `projects.assignedSalesId` - Sales dashboard
- `projects.marketId` - Market filtering (NEW - April 2025)
- `projects.contractorIds` - Contractor filtering (NEW - April 2025)
- `users.email` - Login lookup
- `users.employeeId` - Employee lookup
- `users.status` + `users.marketId` - User listing
- `users.teamIds` - Team membership queries
- `markets.code` - Market code lookup (NEW - April 2025)
- `customers.lastName` - Search/sort
- `products.variants.sku` - SKU lookup

### Query Optimization
- Project detail populates all refs in single query
- List views use projection to limit fields
- Pagination not yet implemented (expected <1000 projects)

### Frontend Optimization
- Lazy-loaded routes
- Pinia stores cache data
- Socket.io avoids polling

---

## Deployment Notes

### Environment Variables
**Server (.env):**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facet-crm
JWT_SECRET=your-secret-key-min-32-chars
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Build Process
```bash
# Backend
cd server
npm install
npm run build    # Compiles TypeScript
tsc --build     # Type checking

# Frontend  
cd client
npm install
npm run build   # Quasar/Vite build
# Output: dist/spa/
```

### Production Considerations
- Use MongoDB Atlas or managed MongoDB
- Set up PM2 for Node process management
- Configure nginx reverse proxy
- Enable MongoDB authentication
- Use HTTPS for Socket.io (wss://)
- Set up automated backups

---

## Monitoring & Debugging

### Server Logs
- Express Morgan for HTTP logging
- Console logs for socket connections
- MongoDB query logging (dev only)

### Health Check
```
GET /health
Response: { "status": "ok", "timestamp": "..." }
```

---

## Known Limitations


2. **No email notifications** - Task assignments don't send emails
3. **No offline support** - Requires constant connectivity
4. **No mobile app** - Responsive web only
5. **No automated testing** - Manual QA only
6. **No calendar system** - Sales appointments and production scheduling pending

---

## Future Considerations

1. **Calendar System** - Sales appointments and production scheduling
2. **File Uploads** - S3 integration for contracts and photos
3. **Audit Trail** - Full change tracking with user attribution
4. **Microservices** - Split POS to separate service if Refinery scales
5. **Caching** - Redis for session store and hot data
6. **Search** - Elasticsearch for full-text search across projects
7. **Analytics** - MongoDB aggregation pipelines for reporting
8. **Mobile** - Capacitor wrapper for native app feel

---

*Last Updated: 2026-04-16*

Field added: Project.attachments (array of objects)

Compatibility checklist:
- server/src/models/Project.ts       → added field to IProject interface + schema
- server/src/routes/projects.ts      → added to populate() calls in get /:id
- server/src/middleware/auth.ts      → no change
- docs/TECHNICAL_SPECS.md           → updated schema definition
- docs/API_REFERENCE.md             → updated response examples for GET /projects/:id
- client/src/stores/projectStore.ts  → updated TypeScript interface for Project
- client/src/pages/ProjectDetailPage.vue    → added UI for attachments and uploader

## Changelog

### April 13, 2026
- **Schema**: Added Markets collection for multi-market support
- **Schema**: Added Teams collection for team-based organization
- **Schema**: Projects now include `marketId` and `contractorIds` fields
- **Schema**: Tasks now support `contractorId` for contractor-specific assignments
- **Schema**: User model includes `teamIds` for team membership
- **Schema**: CompanySettings includes `employeeIdConfig` for auto-generation
- **Schema**: Markets include `operatingHours`, `settings`, and `branding` sub-documents
- **Schema**: Teams include `goals`, `autoAssignLeads`, and `assignmentStrategy` for lead routing

### April 16, 2026
- **Schema**: Added Emails collection for email integration
- **Feature**: Implemented IMAP/SMTP email integration with polling and auto-logging to projects
- **Realtime**: Added 'email:sent' and 'email:received' socket events
