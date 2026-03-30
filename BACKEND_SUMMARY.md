# Facet CRM Backend - Complete Implementation Summary

## Models Updated

### Project Model (`src/models/Project.ts`)
- ✅ `createdBy` (required) - User who created the project
- ✅ `updatedBy` - User who last updated
- ✅ `assignedSalesId` - Sales rep assigned to project
- ✅ `commission.bdcRepId` - BDC rep who sourced the lead
- ✅ Activities track `userId` + `timestamp` for full audit trail
- ✅ `commission.salesReps[]` - Supports split commissions with user attribution

### Customer Model (`src/models/Customer.ts`)
- ✅ `createdBy` (required) - User who created the customer
- ✅ `updatedBy` - User who last updated
- ✅ `assignedSalesId` - Current assigned sales rep (for ongoing relationship)

### User Model (`src/models/User.ts`)
- ✅ `roles: UserRole[]` - Multiple roles per user
- ✅ Helper functions: `hasRole()`, `hasAnyRole()`, `hasAllRoles()`
- ✅ Handles legacy `role` (string) and new `roles` (array) for backward compatibility

## Routes Implemented

### Projects (`src/routes/projects.ts`)

**Visibility Filtering:**
- ✅ `GET /` - Returns only projects assigned to non-admin users
- ✅ `GET /:id` - Returns single project with access control
- ✅ Admins see all projects
- ✅ Sales reps see: projects where they're `assignedSalesId`, `bdcRepId`, or in `salesReps[]`
- ✅ Contractors see: projects where they have assigned tasks

**Audit Trail:**
- ✅ `POST /` - Sets `createdBy` from authenticated user
- ✅ `PUT /:id` - Updates `updatedBy` on every change
- ✅ All sub-resources (activities, tasks, payments, expenses, change orders) update `updatedBy`
- ✅ Activities populated with `userId` → `firstName lastName email`

**Assignment Display:**
- ✅ `GET /:id` populates:
  - `assignedSalesId` → full user details
  - `commission.bdcRepId` → full user details
  - `commission.salesReps[].userId` → full user details
  - `createdBy`, `updatedBy` → full user details
  - `activities[].userId` → full user details
  - `payments.recordedBy` → full user details
  - `changeOrders.requestedBy`, `respondedBy` → full user details

**Additional Endpoints:**
- ✅ `GET /stats/dashboard` - Role-based stats (admins see all, reps see their own)
- ✅ Full CRUD for tasks, payments, expenses, change orders with audit
- ✅ Commission calculation with split support

### Customers (`src/routes/customers.ts`)

**Visibility Filtering:**
- ✅ `GET /` - Returns only customers assigned to non-admin users
- ✅ `GET /:id` - Returns customer + projects with access control
- ✅ Sales reps see: customers where they're `assignedSalesId` OR have projects with them

**Audit Trail:**
- ✅ `POST /` - Sets `createdBy` from authenticated user
- ✅ `PUT /:id` - Updates `updatedBy` on every change
- ✅ Auto-assigns `assignedSalesId` to sales rep who creates customer (if not specified)

**Assignment Display:**
- ✅ `GET /:id` populates:
  - `assignedSalesId` → full user details
  - `createdBy`, `updatedBy` → full user details
  - `projects[].assignedSalesId` → full user details
  - `projects[].commission.bdcRepId` → full user details

**Additional Endpoints:**
- ✅ `GET /:id/projects` - All projects for customer
- ✅ `PATCH /:id/assign` - Update sales rep assignment

### Users (`src/routes/users.ts`)
- ✅ `GET /` - Admin only, returns all active users
- ✅ `POST /` - Admin only, creates user with `roles` array
- ✅ `PUT /:id` - Self or admin update with role change restrictions

### Auth (`src/routes/auth.ts`)
- ✅ Login returns `user.roles` (array) not `user.role` (string)
- ✅ Register updated for `roles` array

## Middleware

### `filterByUserRole`
Applied to list/detail endpoints to restrict data access:
- **Admins**: Full access to all data
- **Sales/BDC**: Projects/customers they're assigned to
- **Contractors**: Projects where they have assigned tasks

### `requireRole(...roles)`
Restricts endpoints to users with specific roles:
- Commission endpoints → `admin` only
- Change order approval → `admin` only
- User management → `admin` only

## Data Flow Examples

### Creating a Project
1. Sales rep logs in → token contains `userId` and `roles`
2. POST `/api/projects` → `createdBy` set to current user
3. Activity added: "Project created" with `userId` and `timestamp`
4. `assignedSalesId` can be set (defaults to creator if sales rep)
5. `commission.bdcRepId` can be set separately

### Viewing a Project
1. GET `/api/projects/:id` with auth token
2. Middleware checks if user is admin OR assigned to project
3. Response includes:
   ```json
   {
     "assignedSalesId": { "_id": "...", "firstName": "John", "lastName": "Smith", "email": "..." },
     "commission": {
       "bdcRepId": { "_id": "...", "firstName": "Jane", "lastName": "Doe", "email": "..." },
       "salesReps": [{ "userId": { ... }, "splitPercent": 100 }]
     },
     "createdBy": { "firstName": "John", "lastName": "Smith" },
     "updatedBy": { "firstName": "John", "lastName": "Smith" },
     "activities": [
       { "type": "note", "content": "...", "userId": { "firstName": "Jane", "lastName": "Doe" }, "timestamp": "..." }
     ]
   }
   ```

### Sales Rep View
- Dashboard shows only their projects (filtered by assignment)
- Customer list shows only their assigned customers + customers with their projects
- Cannot see other reps' projects or customers

### Manager/Admin View
- Dashboard shows all projects
- Can see all customers
- Can reassign projects/customers
- Can view commission reports

## Frontend Integration Notes

### Required Headers
All authenticated endpoints require:
```
Authorization: Bearer <jwt-token>
```

### Role-Based UI
Frontend should check `user.roles` array:
```javascript
const isAdmin = user.roles.includes('admin');
const isSales = user.roles.includes('sales');
const isBDC = user.roles.includes('bdc');
```

### Assignment Display
Projects should prominently show:
- Primary sales rep photo/name
- BDC rep who sourced it (if different)
- Created by / last updated by with timestamps
- Activity timeline with avatars

### Visibility Warnings
- If a sales rep tries to access another rep's project → 403 Forbidden
- If contractor tries to access project without tasks → 403 Forbidden

## Next Steps for Frontend

1. **Dashboard**: Use `GET /api/projects/stats/dashboard` for role-based stats
2. **Project List**: Use `GET /api/projects` (auto-filtered by role)
3. **Project Detail**: Use `GET /api/projects/:id` with populated assignment fields
4. **Customer List**: Use `GET /api/customers` (auto-filtered by role)
5. **Activity Feed**: Display `activities[]` with user avatars and timestamps
6. **Assignment UI**: Show dropdown to change `assignedSalesId` (admin only)
7. **BDC Attribution**: Show BDC rep on project card and in lead source tracking

## Testing

Create test users and verify:
- Sales rep only sees assigned projects
- Admin sees all projects
- Audit fields populated correctly
- Activities show user attribution
- Commission calculation assigns correct users
