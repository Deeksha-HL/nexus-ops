
# Nexus Ops

> Mini ERP + CRM Operations Portal for Wholesale Distribution

![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB)
![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![License](https://img.shields.io/badge/Project-Case%20Study-blue)

## Overview

Nexus Ops is a role-based ERP and CRM platform built for a wholesale distributor. It connects customer management, inventory, warehouse operations and sales challans into one secure application.

### Live Links

- Frontend: https://nexus-opss.vercel.app
- API: https://nexus-ops-api.onrender.com
- Health: https://nexus-ops-api.onrender.com/health

## Features

- JWT Authentication
- Role-based access (Admin, Sales, Warehouse, Accounts)
- Customer CRM with follow-up timeline
- Product & inventory management
- Stock movement audit trail
- Sales challans with Draft and Confirmed states
- Safe stock deduction using PostgreSQL transactions
- Product snapshots stored in challans
- Search and pagination
- Docker support
- Postman collection

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon) |
| Validation | Zod |
| Authentication | JWT |
| Deployment | Vercel, Render, Neon |

## Architecture

```text
React + TypeScript
        │
 JWT Authentication
        │
 Express REST API
        │
Role Middleware + Zod Validation
        │
 PostgreSQL
        │
Customers • Products • Challans • Stock Movements
```

## Challan Workflow

```text
Create Draft
      │
Confirm Challan
      │
Validate Stock
      │
Lock Product Rows
      │
Store Product Snapshot
      │
Create OUT Movement
      │
Deduct Stock
      │
Commit Transaction
```

## Database Overview

```text
Customer
   │
   │
Challan ─── ChallanItem ─── Product
                      │
                      │
              StockMovement
```

## Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Sales | Customers, Follow-ups, Challans |
| Warehouse | Products, Stock Movements |
| Accounts | Read-only |

## Demo Credentials

Password: `Campus@2026`

| Role | Email |
|------|-------|
| Admin | admin@nexus.test |
| Sales | sales@nexus.test |
| Warehouse | warehouse@nexus.test |
| Accounts | accounts@nexus.test |

## API

- POST /auth/login
- GET /dashboard
- Customers CRUD
- Products CRUD
- Stock Movements
- Challans CRUD
- Confirm Challan

## Local Setup

```bash
git clone https://github.com/Deeksha-HL/nexus-ops.git
cd nexus-ops
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Environment Variables

API

- DATABASE_URL
- JWT_SECRET
- PORT
- CORS_ORIGIN

Web

- VITE_API_URL

## Docker

```bash
docker compose up -d db
```

## Deployment

Frontend: Vercel

Backend: Render

Database: Neon

## Screenshots

Add screenshots for:

- Login
- Dashboard
- CRM
- Inventory
- Product Details
- Challans
- Stock Movements

## Security

- JWT Authentication
- Backend role enforcement
- Input validation with Zod
- Transactional inventory updates
- Row-level locking for stock consistency

## Known Limitations

- Challan cancellation workflow not implemented
- Invoice module out of scope
- Time-based challan numbering

## Future Improvements

- Purchase Orders
- Invoice Generation
- PDF Export
- Email Notifications
- Reports & Analytics
- Product Images
- Approval-based cancellation

## Repository Structure

```text
apps/
 ├── api
 └── web
postman/
docker-compose.yml
vercel.json
README.md
```

## License

Built as a Full Stack Developer Case Study submission.
