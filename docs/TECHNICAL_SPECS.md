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
  role: Enum['admin', 'bdc', 'sales', 'design_consultant', 'production', 'contractor'],
  isActive: Boolean,
  createdAt: Date,
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
  status: Enum[
    'lead', 'qualified', 'design_scheduled', 'contract_sent',
    'contract_signed', 'production_scheduled', 'in_production',
    'completed', 'cancelled'
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
  source: String,           // Lead source
  leadDate: Date,
  
  // Line items
  lineItems: [{
    productId: ObjectId (ref: Products),
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    category: String
  }],
  
  // Tasks
  tasks: [{
    title: String,
    description: String,
    assignedTo: ObjectId (ref: Users),
    dueDate: Date,
    status: Enum['pending', 'in_progress', 'completed', 'cancelled'],
    completedAt: Date
  }],
  
  // Activity feed (chronological)
  activities: [{
    type: Enum['note', 'status_change', 'task_complete', 'payment', 'file_upload', 'call'],
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
    status: Enum['pending', 'approved', 'rejected'],
    requestedBy: ObjectId (ref: Users),
    requestedAt: Date
  }],
  
  // Payments
  paymentTerms: {
    type: Enum['standard', 'custom'],
    total: Number,
    milestones: [{
      percent: Number,    // 25, 50, 75, 100
      label: String,      // "Design Deposit", "Materials Release"
      required: Boolean,
      completed: Boolean
    }]
  },
  payments: [{
    amount: Number,
    date: Date,
    type: Enum['deposit', 'milestone', 'monthly', 'final'],
    method: Enum['cash', 'check', 'card', 'financing'],
    notes: String,
    recordedBy: ObjectId (ref: Users),
    appliedToMilestone: Number
  }],
  
  // Expenses (for PnL)
  expenses: [{
    vendorId: ObjectId (ref: Vendors),
    description: String,
    amount: Number,
    date: Date,
    category: String,
    invoiced: Boolean,
    paid: Boolean
  }],
  
  // Commissions
  commission: {
    calculatedAt: Date,
    calcMethod: Enum['flat', 'percentage'],
    salesReps: [{
      userId: ObjectId,
      splitPercent: Number,
      amount: Number,
      paid: Boolean,
      paidDate: Date
    }],
    bdcRepId: ObjectId,
    bdcAmount: Number,
    bdcPaid: Boolean,
    bdcPaidDate: Date,
    spiffs: [{
      description: String,
      amount: Number,
      awardedTo: ObjectId,
      paid: Boolean,
      paidDate: Date
    }]
  },
  
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

**Rationale:** Projects are the central workflow unit. Once created, activities/tasks rarely change relationships. Embedding reduces query complexity and enables atomic updates.

### 2. Project Number Generation
Auto-generated format: `PR{YY}{MM}{####}`
- Example: `PR26030001` = March 2026, first project
- Sequential counter resets monthly
- Guaranteed unique via compound index

### 3. Real-Time Architecture
Socket.io rooms named `project:{id}` for scoped updates:
- User opens Project Detail page → joins room
- User closes/leaves → leaves room
- Events only broadcast to room members

### 4. Commission Calculation
Supports split commissions (multiple sales reps):
- Sales: 10% of contract OR $400 flat (per-user toggle)
- BDC: 1% of contract
- Admin: 2-3% based on role level
- Spiffs: Additional bonuses tracked separately

---

## Security Model

### Authentication
- JWT tokens with 24h expiry
- Stored in localStorage (acceptable for internal tool)
- Passwords hashed with bcrypt (10 rounds)

### Authorization (Role-Based)
| Role | Permissions |
|------|-------------|
| admin | Full access |
| bdc | Lead management, commission view |
| sales | Customer/projects, commissions |
| design_consultant | Design appointments, measurements |
| production | Production schedule, task updates |
| contractor | Task view/update only |

### API Protection
- Helmet.js for security headers
- Rate limiting: 100 req/15min per IP
- CORS restricted to configured client URL

---

## Performance Considerations

### Database Indexes
- `projects.projectNumber` - Unique lookup
- `projects.customerId` - Customer project queries
- `projects.status` - Pipeline filtering
- `projects.assignedSalesId` - Sales dashboard
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

1. **No file uploads** - Contracts/photos not yet supported
2. **No email notifications** - Task assignments don't send emails
3. **No offline support** - Requires constant connectivity
4. **No mobile app** - Responsive web only
5. **No automated testing** - Manual QA only

---

## Future Considerations

1. **Microservices** - Split POS to separate service if Refinery scales
2. **Caching** - Redis for session store and hot data
3. **Search** - Elasticsearch for full-text search across projects
4. **Analytics** - MongoDB aggregation pipelines for reporting
5. **Mobile** - Capacitor wrapper for native app feel

---

*Last Updated: 2026-03-27*
