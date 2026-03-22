# Facet CRM

A full-stack CRM + POS replacement for Facet Renovations.

## Stack

- **Backend**: Node.js + Express + TypeScript + MongoDB (Mongoose)
- **Frontend**: Vue 3 + Quasar Framework + TypeScript
- **Realtime**: Socket.io for notifications
- **Auth**: JWT-based authentication

## Project Structure

```
facet-crm/
├── server/              # Backend API
│   ├── src/
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, validation
│   │   └── index.ts     # Entry point
│   └── package.json
│
└── client/              # Frontend (Quasar)
    ├── src/
    │   ├── pages/       # Vue pages
    │   ├── stores/      # Pinia stores
    │   ├── components/  # Reusable components
    │   └── boot/        # App initialization
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Features

- ✅ JWT authentication with role-based access
- ✅ Customer management with contact history
- ✅ Project pipeline with activity feed
- ✅ Task assignment and tracking
- ✅ Payment milestone tracking (including payment plans)
- ✅ Change order workflow
- ✅ Expense tracking for PnL
- ✅ Subscription management (Facet Radiance)
- ✅ Product catalog with vendor refs
- 🚧 Real-time notifications (Socket.io ready)

## Models

- **Users** - Employees, contractors, admins
- **Customers** - Client records with contacts
- **Vendors** - Suppliers and subcontractors
- **Products** - Catalog with variants
- **Projects** - The big one (renovations, service, retail, warranty)
- **Subscriptions** - Radiance recurring services

## API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/login` | Authenticate |
| `GET /api/projects` | List projects |
| `POST /api/projects` | Create project |
| `GET /api/projects/:id` | Get project detail |
| `POST /api/projects/:id/activities` | Add note/activity |
| `POST /api/projects/:id/tasks` | Add task |
| `PUT /api/projects/:id/tasks/:taskId` | Update task |
| `POST /api/projects/:id/payments` | Record payment |
| `POST /api/projects/:id/expenses` | Add expense |
| `POST /api/projects/:id/change-orders` | Create CO |

See route files for full API docs.

## Next Steps

1. Wire up Socket.io listeners for real-time updates
2. Build project detail page with activity feed
3. Add product catalog management
4. Create subscription billing dashboard
5. Add reporting/PNL views
6. Build POS frontend for retail

---

*Built for Facet Renovations - A luxurious look. A cut above.*
