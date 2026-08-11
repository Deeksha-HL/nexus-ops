# Nexus Ops

Mini ERP + CRM operations portal for a wholesale distributor. Nexus Ops connects sales, warehouse, and accounts teams in one workspace — with role-based access, customer follow-ups, inventory control, and safe sales challan dispatch.

**Live app:** https://nexus-opss.vercel.app  
**API:** https://nexus-ops-api.onrender.com

## Features

- **Operations Pulse dashboard** — active customers, low-stock alerts, confirmed challans today, and recent dispatch activity
- **Customer CRM** — add, edit, search, and filter customers; detail view with follow-up timeline
- **Inventory** — product catalog with SKU, pricing, warehouse location, and minimum-stock alerts
- **Stock movements** — auditable IN/OUT log with quantity, reason, user, and timestamp
- **Sales challans** — multi-product drafts, auto-generated challan numbers, confirmation with safe stock deduction
- **Role-based access** — Admin, Sales, Warehouse, and Accounts with UI and API enforcement

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL (Neon) |
| Auth | JWT |
| Validation | Zod |
| Deployment | Vercel (frontend) · Render (API) · Neon (database) |

## Architecture

```text
React + Vite (apps/web)  →  Express REST API (apps/api)  →  PostgreSQL
                                 JWT role middleware
                                 Zod request validation
                                 Transactions + row locks for stock changes
```

Inventory-changing actions run inside a PostgreSQL transaction with `SELECT … FOR UPDATE`. When a challan is confirmed, product snapshots and OUT stock movements are written in the same transaction — a failed stock check cannot leave partial updates.

## Roles

| Role | Access |
| --- | --- |
| Admin | Full access to all modules |
| Sales | Customers, follow-ups, challans |
| Warehouse | Products, stock movements |
| Accounts | Read-only across all modules |

## Demo credentials

Password for all accounts: **`Campus@2026`**

| Role | Email |
| --- | --- |
| Admin | `admin@nexus.test` |
| Sales | `sales@nexus.test` |
| Warehouse | `warehouse@nexus.test` |
| Accounts | `accounts@nexus.test` |

## Local setup

**Requirements:** Node.js 20+, PostgreSQL 16+ (or Docker)

```bash
git clone https://github.com/Deeksha-HL/nexus-ops.git
cd nexus-ops
npm install

copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
# Set DATABASE_URL in apps/api/.env

npm run db:migrate
npm run db:seed
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

**Docker database:** `docker compose up -d db` — then use the default `DATABASE_URL` from `apps/api/.env.example`.

## Environment variables

**API** (`apps/api/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Server port (default `4000`) |
| `CORS_ORIGIN` | Allowed frontend origin |

**Web** (`apps/web/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API URL |

## API endpoints

| Module | Routes |
| --- | --- |
| Auth | `POST /auth/login` |
| Dashboard | `GET /dashboard` |
| Customers | `GET/POST /customers` · `GET/PUT /customers/:id` · `POST /customers/:id/followups` |
| Products | `GET/POST /products` · `GET/PUT /products/:id` · `GET/POST /products/:id/movements` |
| Challans | `GET/POST /challans` · `GET /challans/:id` · `PATCH /challans/:id/confirm` |

A Postman collection is available at `postman/Nexus-Ops.postman_collection.json`.

## Project structure

```text
nexus-ops/
├── apps/
│   ├── api/          Express REST API
│   └── web/          React frontend
├── postman/          API collection
├── docker-compose.yml
└── vercel.json
```

## Deployment

**Frontend (Vercel)**

- Build: `npm run build -w @nexus/web`
- Output: `apps/web/dist`
- Env: `VITE_API_URL=https://nexus-ops-api.onrender.com`

**Backend (Render)**

- Build: `npm install && npm run build -w @nexus/api`
- Start: `npm run start -w @nexus/api`
- Env: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`

Run migration and seed once after the first deploy:

```bash
npm run db:migrate -w @nexus/api
npm run db:seed -w @nexus/api
```

## Known limitations

- Challan cancellation is not implemented; stock reversal would need an audit/approval workflow.
- Challan numbers use a time-based sequence suitable for demo use, not high-volume production.
- Accounts role is read-only by design; invoicing is out of scope.

## License

Built as a campus drive case study project.
