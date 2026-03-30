# Facet CRM - Schema to Frontend Audit

## Models Overview

### 1. User Model (`server/src/models/User.ts`)

| Field | Type | Required | Frontend Status |
|-------|------|----------|-----------------|
| `_id` | ObjectId | ✅ | ✅ Used |
| `email` | String | ✅ | ✅ Used |
| `passwordHash` | String | ✅ | 🔒 Backend only |
| `firstName` | String | ✅ | ✅ Used |
| `lastName` | String | ✅ | ✅ Used |
| `avatar` | String | | ✅ Added to Profile |
| `bio` | String | | ✅ Added to Profile |
| `phone` | String | | ✅ Used |
| `phoneExtension` | String | | ✅ Added to Profile |
| `employeeId` | String | | ✅ In UserManagement |
| `employmentType` | Enum | ✅ | ✅ In UserManagement |
| `status` | Enum | ✅ | ✅ Used (was `isActive`) |
| `hireDate` | Date | | ✅ In UserManagement |
| `terminationDate` | Date | | 🔧 Admin only |
| `department` | String | | ✅ In UserManagement |
| `roles` | Array | ✅ | ✅ Used |
| `permissions` | Array | | 🔧 Future: ACL |
| `marketId` | ObjectId | | 🔧 Future: Multi-market |
| `markets` | Array | | 🔧 Future: Multi-market |
| `teamIds` | Array | | 🔧 Future: Teams |
| `commissionTier` | Number | | 🔧 Future: Commission levels |
| `commissionSettings` | Object | | ✅ Used |
| `preferences` | Object | | ✅ Added |
| `lastLoginAt` | Date | | 🔧 Admin only |
| `lastLoginIp` | String | | 🔧 Admin only |
| `failedLoginAttempts` | Number | | 🔧 Security |
| `lockedUntil` | Date | | 🔧 Security |
| `passwordChangedAt` | Date | | 🔧 Security |
| `twoFactorEnabled` | Boolean | | 🔧 Security |
| `twoFactorSecret` | String | | 🔒 Backend only |
| `createdBy` | ObjectId | | 🔧 Audit |
| `updatedBy` | ObjectId | | 🔧 Audit |
| `createdAt` | Date | ✅ | ✅ Used |
| `updatedAt` | Date | ✅ | ✅ Used |

**Frontend Files:**
- `client/src/stores/auth.ts` - Current user (authStore.user)
- `client/src/stores/users.ts` - User list (userStore.users)
- `client/src/pages/ProfilePage.vue` - Self-edit profile
- `client/src/pages/UserManagementPage.vue` - Admin CRUD
- `client/src/layouts/MainLayout.vue` - Avatar display

**Issues Found:**
1. ❌ Profile page missing Employee ID, Department (should be read-only display)
2. ❌ UserManagement table missing columns: Employee ID, Department, Status
3. ❌ UserManagement filters missing: Employment Type, Hire Date range
4. ❌ Avatar not used in navbar (shows initials instead)
5. ❌ No "View Full Profile" option for admins to see all fields

---

### 2. Customer Model (`server/src/models/Customer.ts`)

| Field | Type | Required | Frontend Status |
|-------|------|----------|-----------------|
| `_id` | ObjectId | ✅ | ✅ Used |
| `firstName` | String | ✅ | ✅ Used |
| `lastName` | String | ✅ | ✅ Used |
| `contacts` | Array | ✅ | ✅ Used |
| `referralSource` | String | | ✅ Used |
| `notes` | String | | ✅ Used |
| `createdBy` | ObjectId | ✅ | 🔧 Not displayed |
| `updatedBy` | ObjectId | | 🔧 Not displayed |
| `assignedSalesId` | ObjectId | | 🔧 Not displayed |
| `createdAt` | Date | ✅ | ✅ Used |
| `updatedAt` | Date | ✅ | ✅ Used |

**Frontend Files:**
- `client/src/stores/customers.ts`
- `client/src/pages/CustomersPage.vue`
- `client/src/pages/CustomerDetailPage.vue` (if exists)

**Issues Found:**
1. ❌ No Customer Detail Page exists
2. ❌ `assignedSalesId` not shown (who owns this customer)
3. ❌ `createdBy` not shown (who created the customer)
4. ❌ No project history on customer

---

### 3. Project Model (`server/src/models/Project.ts`)

| Field | Type | Required | Frontend Status |
|-------|------|----------|-----------------|
| `_id` | ObjectId | ✅ | ✅ Used |
| `projectNumber` | String | ✅ | ✅ Used |
| `customerId` | ObjectId | ✅ | ✅ Used |
| `title` | String | ✅ | ✅ Used |
| `type` | Enum | ✅ | ✅ Used |
| `status` | Enum | ✅ | ✅ Used |
| `address` | Object | ✅ | ✅ Used |
| `description` | String | | ✅ Used |
| `contractAmount` | Number | | ✅ Used |
| `assignedSalesId` | ObjectId | | ✅ Used |
| `lineItems` | Array | | ✅ Used |
| `paymentTerms` | Object | | ✅ Used |
| `commission` | Object | | ✅ Used |
| `tasks` | Array | | ✅ Used |
| `activities` | Array | | ✅ Used |
| `changeOrders` | Array | | ✅ Used |
| `expenses` | Array | | ✅ Used |
| `payments` | Array | | ✅ Used |
| `documents` | Array | | ❌ Not implemented |
| `photos` | Array | | ❌ Not implemented |
| `warrantyStartDate` | Date | | ❌ Not implemented |
| `materialsOrderedDate` | Date | | ❌ Not implemented |
| `productionStartDate` | Date | | ❌ Not implemented |
| `productionEndDate` | Date | | ❌ Not implemented |
| `estimatedCompletionDate` | Date | | ✅ Used |
| `createdBy` | ObjectId | ✅ | 🔧 Not displayed |
| `updatedBy` | ObjectId | | 🔧 Not displayed |
| `createdAt` | Date | ✅ | ✅ Used |
| `updatedAt` | Date | ✅ | ✅ Used |

**Frontend Files:**
- `client/src/stores/projects.ts`
- `client/src/pages/ProjectsPage.vue`
- `client/src/pages/ProjectDetailPage.vue`

**Issues Found:**
1. ❌ `createdBy` not shown on project detail
2. ❌ `updatedBy` not shown
3. ❌ Documents/Photos not implemented
4. ❌ Warranty dates not shown
5. ❌ Production dates not prominently displayed

---

### 4. Market Model (`server/src/models/Market.ts`) - NEW

| Field | Type | Required | Frontend Status |
|-------|------|----------|-----------------|
| `name` | String | ✅ | ❌ No UI |
| `code` | String | ✅ | ❌ No UI |
| `status` | Enum | ✅ | ❌ No UI |
| `region` | String | ✅ | ❌ No UI |
| `timezone` | String | | ❌ No UI |
| `address` | Object | ✅ | ❌ No UI |
| `phone` | String | | ❌ No UI |
| `email` | String | | ❌ No UI |
| `managerId` | ObjectId | | ❌ No UI |
| `operatingHours` | Object | | ❌ No UI |
| `settings` | Object | | ❌ No UI |
| `branding` | Object | | ❌ No UI |

**Status:** Schema only, no frontend exists

**Needed:**
- Markets list page
- Market detail/edit page
- Market selector in user form

---

### 5. Team Model (`server/src/models/Team.ts`) - NEW

| Field | Type | Required | Frontend Status |
|-------|------|----------|-----------------|
| `name` | String | ✅ | ❌ No UI |
| `description` | String | | ❌ No UI |
| `type` | Enum | ✅ | ❌ No UI |
| `memberIds` | Array | | ❌ No UI |
| `leadId` | ObjectId | | ❌ No UI |
| `marketId` | ObjectId | | ❌ No UI |
| `autoAssignLeads` | Boolean | | ❌ No UI |
| `assignmentStrategy` | Enum | | ❌ No UI |
| `goals` | Object | | ❌ No UI |
| `isActive` | Boolean | ✅ | ❌ No UI |

**Status:** Schema only, no frontend exists

---

## Frontend Type Definitions

### Current (`client/src/stores/auth.ts`)
```typescript
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatar?: string;
  phone?: string;
  phoneExtension?: string;
  bio?: string;
  employeeId?: string;
  employmentType?: string;
  department?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    timezone?: string;
    language?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      desktop?: boolean;
    };
  };
}
```

**Missing from interface:**
- `status`
- `hireDate`
- `marketId`
- `teamIds`
- `commissionTier`

---

## Recommendations

### Immediate Fixes Needed:

1. **ProfilePage.vue**
   - Add read-only display of Employee ID, Department, Hire Date, Employment Type
   - Show current status

2. **UserManagementPage.vue**
   - Add table columns: Employee ID, Department, Status
   - Add filters: Employment Type, Status, Department

3. **MainLayout.vue**
   - Use avatar URL if available

4. **TypeScript Interfaces**
   - Update User interface to include all server fields (even if not used yet)
   - Add Market and Team interfaces

### Future Pages Needed:

1. **Markets Management** (Admin)
   - List all markets
   - Create/edit market
   - Assign manager

2. **Teams Management** (Admin)
   - List teams by market
   - Create/edit team
   - Assign members and lead

3. **Customer Detail Page**
   - Show customer profile
   - Project history
   - Assigned sales rep

4. **Improved Project Detail**
   - Show createdBy/updatedBy
   - Document upload
   - Photo gallery

### Prevention Strategy:

1. **Schema Change Checklist:**
   - [ ] Update TypeScript interfaces
   - [ ] Check all pages using that model
   - [ ] Update forms (add new fields)
   - [ ] Update tables (add new columns)
   - [ ] Update filters if applicable
   - [ ] Test CRUD operations

2. **Runtime Warnings:**
   - Consider adding development-mode warnings when API returns unknown fields

3. **Shared Types:**
   - Consider generating TypeScript types from MongoDB schemas automatically
