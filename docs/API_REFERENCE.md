# Facet CRM - API Reference

**Base URL:** `http://localhost:3000/api` (dev)  
**Authentication:** Bearer token in `Authorization: Bearer <token>` header

---

## Authentication

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "sales"
  }
}
```

### POST /auth/register
Create new user (admin only).

**Request:**
```json
{
  "email": "new@example.com",
  "password": "secret123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roles": ["sales"],
  "marketId": "...",
  "department": "Sales"
}
```

### POST /auth/change-password
Change current user's password (self-service).

**Request:**
```json
{
  "currentPassword": "oldsecret123",
  "newPassword": "newsecret456"
}
```

### GET /auth/verify
Verify current token and return user info.

**Response:**
```json
{
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "roles": ["sales"]
  }
}
```

---

## Users

### GET /users
List all users (admin only). Supports filtering by status, role, market, and team.

**Query Parameters:**
- `status` - Filter by status (active, inactive, suspended, terminated)
- `role` - Filter by role
- `marketId` - Filter by assigned market
- `teamId` - Filter by team membership

**Response:**
```json
[
  {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "roles": ["sales"],
    "employeeId": "IL-FRS0001",
    "status": "active",
    "marketId": { "name": "Illinois", "code": "IL" },
    "teamIds": [...],
    "commissionSettings": { "useFlatRate": false, "isOwner": false },
    "preferences": { "theme": "auto", "timezone": "America/Chicago" }
  }
]
```

### GET /users/:id
Get user details with populated references.

### GET /users/me/profile
Get current user's full profile.

### PUT /users/me/preferences
Update current user preferences (theme, timezone, notifications, etc.).

### POST /users
Create new user (admin only). Auto-generates employee ID if enabled.

### PUT /users/:id
Update user. Users can edit their own profile; admins can edit anyone.

### PATCH /users/:id/status
Update user status (active, inactive, suspended, terminated) - admin only.

**Request:**
```json
{
  "status": "suspended",
  "reason": "Security review pending"
}
```

**Response:**
```json
{
  "message": "User suspended successfully",
  "user": { ... }
}
```

### GET /users/team/:teamId
Get all users assigned to a specific team.

### GET /users/market/:marketId
Get all users in a specific market (admin/manager only).

---

## Company Settings

### GET /company
Get company-wide settings (admin only).

**Response:**
```json
{
  "name": "Facet Renovations",
  "legalName": "Facet Renovations LLC",
  "taxId": "12-3456789",
  "settings": {
    "defaultTimezone": "America/Chicago",
    "defaultCurrency": "USD",
    "defaultDateFormat": "MM/DD/YYYY"
  },
  "employeeIdConfig": {
    "enabled": true,
    "format": "{MARKET}-{ROLE}{SEQUENCE:4}",
    "roleCodes": { "admin": "FRA", "sales": "FRS" },
    "marketCodes": { "marketId": "IL" }
  },
  "branding": {
    "primaryColor": "#1976d2",
    "secondaryColor": "#26a69a"
  }
}
```

### PUT /company
Update company settings.

### PUT /company/employee-id-config
Update employee ID generation configuration.

### GET /company/markets
List all markets.

### POST /company/markets
Create new market.

### PUT /company/markets/:id
Update market.

### DELETE /company/markets/:id
Delete market (only if no users assigned).

### POST /company/preview-employee-id
Preview what employee ID would be generated for a market/role combination without actually assigning it.

**Request:**
```json
{
  "marketId": "market_id_here",
  "role": "sales"
}
```

**Response:**
```json
{
  "employeeId": "IL-FRS0001",
  "preview": true,
  "marketCode": "IL",
  "roleCode": "FRS",
  "sequence": 1
}
```

---

## Customers

### GET /customers
List customers with optional search.

**Query Parameters:**
- `search` - Filter by name

**Response:**
```json
[
  {
    "_id": "...",
    "firstName": "Alice",
    "lastName": "Johnson",
    "contacts": [...],
    "referralSource": "Google",
    "createdAt": "2026-03-22T..."
  }
]
```

### POST /customers
Create a new customer.

**Request:**
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "contacts": [
    {
      "type": "primary",
      "phone": "555-1234",
      "email": "alice@example.com",
      "address": {
        "street": "123 Main St",
        "city": "Libertyville",
        "state": "IL",
        "zip": "60048"
      }
    }
  ],
  "referralSource": "Google"
}
```

### GET /customers/:id
Get customer details.

### PUT /customers/:id
Update customer information.

---

## Projects

### GET /projects
List projects with role-based filtering.

**Query Parameters:**
- `status` - Filter by status
- `assignedTo` - Filter by sales person ID
- `type` - Filter by type (renovation, service, warranty, retail)
- `search` - Search title or project number
- `customerId` - Filter by customer
- `marketId` - Filter by market (NEW - April 2025)
- `contractorId` - Filter by assigned contractor (NEW - April 2025)
- `dateRange` - Filter by date range: `today`, `week`, `month`, `overdue` (NEW - April 2025)

**Role-Based Access:**
- Admins see all projects
- Sales/BDC see their assigned projects
- Contractors see projects with their assigned tasks
- Managers see projects in their markets

**Response:**
```json
[
  {
    "_id": "...",
    "projectNumber": "PR26030001",
    "title": "Master Bath Renovation",
    "status": "in_production",
    "type": "renovation",
    "contractAmount": 17500,
    "customerId": {
      "firstName": "Alice",
      "lastName": "Johnson"
    },
    "assignedSalesId": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "marketId": { "name": "Illinois", "code": "IL" },
    "contractorIds": ["..."],
    "taskStats": { "total": 5, "completed": 2, "pending": 3 }
  }
]
```

### GET /projects/:id
Get full project details with all related data populated.

**Response:**
```json
{
  "_id": "...",
  "projectNumber": "PR26030001",
  "title": "Master Bath Renovation",
  "status": "in_production",
  "type": "renovation",
  "contractAmount": 17500,
  "customerId": { /* full customer object */ },
  "assignedSalesId": { /* user object */ },
  "contractorIds": [ /* assigned contractors */ ],
  "address": { /* address object */ },
  "lineItems": [...],
  "tasks": [...],
  "activities": [...],
  "payments": [...],
  "expenses": [...],
  "changeOrders": [...],
  "paymentTerms": { /* payment schedule */ },
  "taskStats": { "total": 5, "completed": 2, "pending": 3 }
}
```

### GET /projects/customer/:customerId
Get all projects for a specific customer.

### POST /projects
Create a new project. Auto-generates project number.

**Request:**
```json
{
  "customerId": "...",
  "type": "renovation",
  "title": "Master Bath Renovation",
  "description": "Full gut renovation",
  "address": {
    "street": "123 Main St",
    "city": "Libertyville",
    "state": "IL",
    "zip": "60048"
  },
  "contractAmount": 17500,
  "assignedSalesId": "...",
  "contractorIds": ["..."],
  "source": "Website Lead",
  "marketId": "..."
}
```

### PUT /projects/:id
Update project. Automatically logs status changes to activity feed. Emits `project:updated` socket event.

### POST /projects/:id/activities
Add activity/note to project.

**Request:**
```json
{
  "type": "note",
  "content": "Called customer about tile selection"
}
```

**Types:** `note`, `status_change`, `task_complete`, `payment`, `payment_correction`, `payment_voided`, `file_upload`, `call`

### POST /projects/:id/tasks
Add a task to the project.

**Request:**
```json
{
  "title": "Order tile samples",
  "description": "Get 3 options for customer",
  "assignedTo": "user_id",
  "dueDate": "2026-03-30",
  "contractorId": "..."
}
```

### PUT /projects/:id/tasks/:taskId
Update task status. Setting to "completed" auto-logs to activity feed.

**Request:**
```json
{
  "status": "completed"
}
```

### POST /projects/:id/payments
Record a payment.

**Request:**
```json
{
  "amount": 5000,
  "type": "deposit",
  "method": "check",
  "notes": "Initial deposit received"
}
```

**Payment Types:** `deposit`, `milestone`, `monthly`, `final`  
**Methods:** `cash`, `check`, `card`, `financing`

### PUT /projects/:id/payments/:paymentId
Edit a payment with audit trail.

**Request:**
```json
{
  "amount": 5500,
  "correctionReason": "Customer added extra for rush fee"
}
```

### DELETE /projects/:id/payments/:paymentId
Void a payment (soft delete with audit trail).

**Request:**
```json
{
  "voidReason": "Check bounced"
}
```

### POST /projects/:id/expenses
Add an expense to the project.

**Request:**
```json
{
  "vendorId": "...",
  "description": "Tile purchase",
  "amount": 2500,
  "date": "2026-03-25",
  "category": "materials",
  "invoiced": false,
  "paid": false
}
```

### POST /projects/:id/change-orders
Create a change order.

**Request:**
```json
{
  "description": "Upgrade to heated floors",
  "reason": "Customer request",
  "amount": 1200
}
```

### PUT /projects/:id/change-orders/:coId
Respond to change order (approve/deny) - admin only.

**Request:**
```json
{
  "status": "approved"
}
```

### GET /projects/stats/dashboard\nGet dashboard stats with role-based filtering.\n\n**Response:**\n```json\n{\n  \"totalProjects\": 45,\n  \"activeProjects\": 23,\n  \"pendingTasks\": 67,\n  \"totalContractValue\": 875000,\n  \"projectsByStatus\": {\n    \"lead\": 5,\n    \"contract_signed\": 8,\n    \"in_production\": 12\n  }\n}\n```\n\n### GET /projects/:id/pnl\nGet PnL calculations for a project.\n\n**Auth Requirement:** Bearer token required\n**Minimum Role:** admin or manager\n\n**Request Body:** None\n\n**Response:**\n```json\n{\n  \"totalRevenue\": 18700,\n  \"receivedPayments\": 10000,\n  \"totalCosts\": 12000,\n  \"laborCosts\": 5000,\n  \"otherExpenses\": 4000,\n  \"commissionCosts\": 3000,\n  \"profit\": 6700\n}\n```\n\n**Error Responses:**\n- 404 Project not found\n- 403 Forbidden\n- 500 Server error\n\n---

## Products

### GET /products
List all products.

### POST /products
Create a new product.

**Request:**
```json
{
  "name": "Modern Vanity",
  "description": "36-inch floating vanity",
  "category": "materials",
  "type": "physical",
  "defaultVendorId": "...",
  "variants": [
    {
      "sku": "VAN-36-WHT",
      "size": "36 inch",
      "color": "White",
      "costPrice": 400,
      "retailPrice": 799,
      "isActive": true
    }
  ]
}
```

### PUT /products/:id
Update product.

### DELETE /products/:id
Deactivate product (soft delete).

---

## Vendors

### GET /vendors
List all vendors.

### POST /vendors
Create vendor.

**Request:**
```json
{
  "name": "Tile World Supply",
  "type": "supplier",
  "taxId": "12-3456789",
  "paymentTerms": "Net 30",
  "contacts": [
    {
      "type": "sales",
      "name": "Bob Smith",
      "phone": "555-0199",
      "email": "bob@tileworld.com"
    }
  ]
}
```

**Vendor Types:** `supplier`, `subcontractor`, `utility`, `other`

### PUT /vendors/:id
Update vendor.

---

## Notifications

Real-time notification system using Socket.io for delivery. Notifications are stored in-memory for MVP.

### GET /notifications/me
Get all notifications for current user, sorted newest first.

**Response:**
```json
[
  {
    "_id": "timestamp_id",
    "type": "ping",
    "userId": "recipient_user_id",
    "fromUserId": "sender_user_id",
    "fromUserName": "John Doe",
    "fromUserAvatar": "https://...",
    "message": "Can you check the tile samples for PR2603001?",
    "read": false,
    "createdAt": "2026-04-01T10:30:00Z"
  }
]
```

### POST /notifications/ping
Send a ping/message to another user.

**Request:**
```json
{
  "userId": "recipient_user_id",
  "message": "Can you check the tile samples for PR2603001?"
}
```

**Response:**
```json
{
  "message": "Notification sent",
  "notification": { ... }
}
```

### PATCH /notifications/:id/read
Mark a single notification as read.

### PATCH /notifications/read-all
Mark all notifications as read for current user.

### DELETE /notifications/:id
Delete a notification (only by recipient).

### GET /notifications/unread-count
Get count of unread notifications.

**Response:**
```json
{ "count": 3 }
```

---

## Teams

### GET /teams
List all teams.

### POST /teams
Create a new team.

**Request:**
```json
{
  "name": "Northside Sales",
  "description": "Sales team for north Chicago suburbs",
  "type": "sales",
  "marketId": "market_id",
  "leadId": "user_id",
  "memberIds": ["user_id_1", "user_id_2"],
  "autoAssignLeads": true,
  "assignmentStrategy": "round_robin",
  "goals": {
    "monthlyRevenue": 500000,
    "monthlyDeals": 10
  }
}
```

### GET /teams/:id
Get team details.

### PUT /teams/:id
Update team.

### DELETE /teams/:id
Delete team.

### POST /teams/:id/members
Add members to a team.

**Request:**
```json
{
  "userIds": ["user_id_1", "user_id_2"]
}
```

### DELETE /teams/:id/members/:userId
Remove a member from a team.

---

## Subscriptions (Facet Radiance)

### GET /subscriptions
List all subscriptions.

### POST /subscriptions
Create a subscription.

**Request:**
```json
{
  "customerId": "...",
  "plan": "edge",
  "billingFrequency": "annual",
  "monthlyAmount": 29.99,
  "annualAmount": 299.99
}
```

**Plans:** `edge`, `apex`

### GET /subscriptions/dashboard/upcoming
Get upcoming renewals and service schedule.

---

## Commissions

### GET /commissions/dashboard
Get commission dashboard for all users with totals.

**Response:**
```json
{
  "users": [
    {
      "userId": "...",
      "name": "John Doe",
      "role": "sales",
      "earned": 4500,
      "paid": 3000,
      "unpaid": 1500,
      "projectCount": 12
    }
  ],
  "totals": {
    "earned": 25000,
    "paid": 18000,
    "unpaid": 7000
  },
  "rules": {
    "sales": { "percentage": 10, "flatAmount": 400 },
    "bdc": { "percentage": 1 },
    "admin": { "owner": 3, "standard": 2 }
  }
}
```

### GET /commissions/user/:userId
Get detailed commission breakdown for a user.

**Query Parameters:**
- `startDate` - Filter from date
- `endDate` - Filter to date
- `status` - Filter by paid/unpaid status

### POST /projects/:id/calculate-commission
Calculate commissions for a project.

**Request:**
```json
{
  "salesRepIds": ["user_id_1", "user_id_2"],
  "splitPercentages": [60, 40],
  "useFlatRate": false
}
```

**Commission Rules:**
- Sales: 10% OR $400 flat (toggle per user)
- BDC: 1% of contract
- Admin: 2-3% (owner vs standard)
- Supports split commissions between multiple reps

### POST /projects/:id/commission/pay
Mark commission as paid.

**Request:**
```json
{
  "type": "sales",
  "userId": "..."
}
```

### POST /projects/:id/spiffs
Add a spiff/bonus to a project.

**Request:**
```json
{
  "description": "First $50k month bonus",
  "amount": 500,
  "awardedTo": "user_id"
}
```

### GET /projects/commissions/report
Get commission report with filters (admin only).

**Query Parameters:**
- `startDate` - ISO date
- `endDate` - ISO date
- `userId` - Filter by user
- `role` - Filter by role type

### POST /commissions/pay
Bulk mark commissions as paid.

**Request:**
```json
{
  "commissions": [
    { "projectId": "...", "type": "sales", "userId": "..." },
    { "projectId": "...", "type": "bdc" }
  ]
}
```

### PUT /commissions/settings/:userId
Update commission settings for a user.

### GET /commissions/rules
Get global commission rules.

### PUT /commissions/rules
Update global commission rules (admin only).

---

## Emails

### GET /emails
List emails with role-based filtering.

**Auth:** admin, manager, sales

**Response:**
```json
[
  {
    "_id": "...",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Subject",
    "bodyText": "Text",
    "bodyHtml": "<html>",
    "attachments": [],
    "receivedAt": "2026-04-16T...",
    "status": "inbox",
    "projectId": "...",
    "customerId": "..."
  }
]
```

### POST /emails/send
Send an email and save it.

**Auth:** admin, manager, sales

**Request:**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Subject",
  "bodyText": "Plain text",
  "bodyHtml": "<p>HTML</p>",
  "attachments": [],
  "projectId": "...",
  "customerId": "..."
}
```

**Response:**
```json
{
  "message": "Email sent successfully",
  "email": { ... }
}
```

### GET /emails/sync
Trigger manual email sync from IMAP.

**Auth:** admin, manager

**Response:**
```json
{
  "message": "Emails synced successfully"
}
```

---

## Socket.io Real-Time Events

Connect to `ws://localhost:3000` with auth token.

### Client → Server Events

**join-project** - Subscribe to project updates
```javascript
socket.emit('join-project', 'project_id')
```

**leave-project** - Unsubscribe from project updates
```javascript
socket.emit('leave-project', 'project_id')
```

### Server → Client Events

**project:updated** - Project data updated (PUT /projects/:id)
```json
{
  "_id": "...",
  "status": "contract_signed",
  "updatedAt": "2026-03-27T..."
}
```

**project:activity** - New activity added
```json
{
  "_id": "...",
  "type": "note",
  "content": "Called customer",
  "userId": { ... },
  "timestamp": "2026-03-27T..."
}
```

**project:task** - Task created or updated
```json
{
  "action": "created",
  "task": { ... }
}
```

**project:payment** - Payment recorded, edited, or voided
```json
{
  "amount": 5000,
  "totalPaid": 10000,
  "percentPaid": 57,
  "voided": false
}
```

**project:changeOrder** - Change order created or updated
```json
{
  "action": "created",
  "changeOrder": { ... }
}
```

**email:sent** - New email sent
```json
{
  "email": { ... }
}
```

**email:received** - New email received
```json
{
  "email": { ... }
}
```

---

## Error Responses

All errors return appropriate HTTP status codes with JSON body:

```json
{
  "error": "Human readable error message"
}
```

**Common Status Codes:**
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `500` - Server error

---

## Rate Limiting

API requests are limited to 100 per 15 minutes per IP address.

---

*Last Updated: 2026-04-16*

## Changelog

### April 13, 2026
- **Projects API**: Added `marketId` and `contractorIds` fields to project schema
- **Projects API**: Added new query parameters: `marketId`, `contractorId`, `dateRange` (today/week/month/overdue)
- **Projects API**: Response now includes `taskStats` (total/completed/pending counts)
- **Projects API**: Tasks now support `contractorId` field for contractor assignments
- **Company API**: Added employee ID preview endpoint (`POST /company/preview-employee-id`)
- **Company API**: Added markets management endpoints (GET/POST/PUT/DELETE)
- **User Management API**: Added status management endpoint (`PATCH /users/:id/status`)
- **User Management API**: Added market-based user filtering (`GET /users/market/:marketId`)

### April 16, 2026
- Added Emails API endpoints for list, send, sync
- Added 'email:sent' and 'email:received' socket events
