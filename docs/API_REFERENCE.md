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
  "role": "sales"
}
```

---

## Users

### GET /users
List all users.

**Response:**
```json
[
  {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "sales"
  }
]
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
List projects with filters.

**Query Parameters:**
- `status` - Filter by status (lead, qualified, etc.)
- `assignedTo` - Filter by sales person ID
- `type` - Filter by type (renovation, service, warranty, retail)
- `search` - Search title or project number

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
    }
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
  "address": { /* address object */ },
  "lineItems": [...],
  "tasks": [...],
  "activities": [...],
  "payments": [...],
  "expenses": [...],
  "changeOrders": [...],
  "paymentTerms": { /* payment schedule */ }
}
```

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
  "source": "Website Lead"
}
```

### PUT /projects/:id
Update project. Automatically logs status changes to activity feed.

### POST /projects/:id/activities
Add activity/note to project.

**Request:**
```json
{
  "type": "note",
  "content": "Called customer about tile selection"
}
```

**Types:** `note`, `status_change`, `task_complete`, `payment`, `file_upload`, `call`

### POST /projects/:id/tasks
Add a task to the project.

**Request:**
```json
{
  "title": "Order tile samples",
  "description": "Get 3 options for customer",
  "assignedTo": "user_id",
  "dueDate": "2026-03-30"
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

### GET /projects/customer/:customerId
Get all projects for a specific customer.

---

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
- Admin: 2-3%

### POST /projects/:id/commission/pay
Mark commission as paid.

**Request:**
```json
{
  "type": "sales",
  "userId": "..."
}
```

### GET /projects/commissions/report
Get commission report with filters.

**Query Parameters:**
- `startDate` - ISO date
- `endDate` - ISO date
- `userId` - Filter by user
- `role` - Filter by role type

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

**project:payment** - Payment recorded
```json
{
  "amount": 5000,
  "totalPaid": 10000,
  "percentPaid": 57
}
```

**project:changeOrder** - Change order created
```json
{
  "action": "created",
  "changeOrder": { ... }
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
- `404` - Resource not found
- `500` - Server error

---

## Rate Limiting

API requests are limited to 100 per 15 minutes per IP address.

---

*Last Updated: 2026-03-27*
