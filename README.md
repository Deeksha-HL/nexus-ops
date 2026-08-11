# Nexus Ops - Mini ERP + CRM Operations Portal

Nexus Ops is a focused operations portal for a wholesale distributor. It balances an admin-friendly CRM with the operational controls that make sales dispatch safe: role-based access, low-stock visibility, and transactional stock deduction during challan confirmation.

**Live API:** https://nexus-ops-api.onrender.com

## What is included

- JWT login with Admin, Sales, Warehouse, and Accounts roles
- Customer CRM: search, pagination, detail view, edit, follow-up timeline
- Products, warehouse location, stock thresholds, manual IN/OUT movements, and auditable movement log
- Sales challans with automatic numbers, multi-product rows, drafts, confirmation, immutable item snapshots, and negative-stock prevention
- Responsive React **Operations Pulse** dashboard with metric cards, low-stock alerts, and recent challan activity
- PostgreSQL schema, Docker Compose, seed data, and Postman collection

## Architecture

```text
React + Vite (apps/web) --> Express REST API (apps/api) --> PostgreSQL (Neon)
                              | JWT role middleware
                              | Zod validation
                              + DB transactions / row locks for dispatch confirmation
```

The API validates at the request boundary. Inventory-changing actions use a PostgreSQL transaction with `SELECT ... FOR UPDATE`. A confirmed challan writes an item snapshot and matching OUT movements in the same transaction, so a failed stock check cannot leave a half-created challan or partial stock adjustment.

### Role permissions

| Role | Access |
| --- | --- |
| **Admin** | Full read/write on all modules |
| **Sales** | Customer CRM, follow-ups, challan create/confirm |
| **Warehouse** | Product create/edit, manual stock IN/OUT movements |
| **Accounts** | Read-only access to dashboard, customers, products, challans |

UI actions are hidden or disabled when a role lacks permission; the API enforces the same rules.

## Local setup

**Prerequisites:** Node.js 20+ and PostgreSQL 16+ (or Docker Desktop).

1. Copy environment templates:

   ```bash
   copy apps\api\.env.example apps\api\.env
   copy apps\web\.env.example apps\web\.env
   ```

2. Create the database and set `DATABASE_URL` in `apps/api/.env`.

3. Install, migrate, seed, and run:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

   - Web: http://localhost:5173
   - API: http://localhost:4000
   - Health: http://localhost:4000/health

### Docker database option

```bash
docker compose up -d db
```

Use the default `DATABASE_URL` from `apps/api/.env.example`, then run migrate/seed as above.

## Environment variables

### API (`apps/api/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | API port (default `4000`) |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |

### Web (`apps/web/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API base URL |

## Database migration and seed

```bash
npm run db:migrate   # applies apps/api/src/db/schema.sql
npm run db:seed      # demo users, products, and a sample customer
```

Re-run seed safely; it uses `ON CONFLICT DO NOTHING` for idempotent inserts.

## Demo credentials

All seeded users use password **`Campus@2026`**.

| Role | Email |
| --- | --- |
| Admin | `admin@nexus.test` |
| Sales | `sales@nexus.test` |
| Warehouse | `warehouse@nexus.test` |
| Accounts | `accounts@nexus.test` |

## API summary

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` |
| Dashboard | `GET /dashboard` |
| Customers | `GET/POST /customers`, `GET/PUT /customers/:id`, `POST /customers/:id/followups` |
| Products | `GET/POST /products`, `GET/PUT /products/:id`, `GET/POST /products/:id/movements` |
| Challans | `GET/POST /challans`, `GET /challans/:id`, `PATCH /challans/:id/confirm` |

Import **`postman/Nexus-Ops.postman_collection.json`** and set `baseUrl` and `token` variables.

## Deployment

### 1. PostgreSQL on Neon

Create a project and database on [Neon](https://neon.tech). Copy the connection string into `DATABASE_URL`.

### 2. API on Render

- **Root directory:** repository root (monorepo)
- **Build command:** `npm install && npm run build -w @nexus/api`
- **Start command:** `npm run start -w @nexus/api`
- **Environment variables:**
  - `DATABASE_URL` — Neon connection string
  - `JWT_SECRET` — strong random secret
  - `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://nexus-ops.vercel.app`)
  - `PORT` — `4000` (Render sets this automatically; optional)

After first deploy, open the Render shell and run:

```bash
npm run db:migrate -w @nexus/api
npm run db:seed -w @nexus/api
```

**Current deployment:** https://nexus-ops-api.onrender.com

### 3. Frontend on Vercel

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (run from repo root, or set root to monorepo root with `-w @nexus/web`) |

**Recommended monorepo setup (Vercel project root = repo root):**

| Setting | Value |
| --- | --- |
| Root Directory | `.` (repository root) |
| Build Command | `npm run build -w @nexus/web` |
| Output Directory | `apps/web/dist` |
| Install Command | `npm install` |

**Environment variable:**

```
VITE_API_URL=https://nexus-ops-api.onrender.com
```

Add a `vercel.json` at the repo root (included) for SPA routing.

### 4. Post-deploy checklist

1. Set `CORS_ORIGIN` on Render to the Vercel URL.
2. Test login and one confirmed challan end-to-end.
3. Verify stock movement appears on the product detail page.

## Assumptions and known limitations

- **Accounts** users have read-only access; invoice/accounting operations are out of scope.
- **Challan cancellation** is not implemented. Reversing stock after confirmation requires an approval/audit policy; the schema includes a `CANCELLED` enum value for future use but no reversal endpoint exists.
- **Challan numbers** use a time-based readable sequence (`SC-YYYY-XXXXXX`). Replace with a database sequence for high-volume production.
- **Product stock on edit** can be adjusted directly by Warehouse/Admin via the edit form; manual movements are the preferred audit path for day-to-day changes.

## Postman collection

Location: **`postman/Nexus-Ops.postman_collection.json`**

Set `baseUrl` to `http://localhost:4000` locally or `https://nexus-ops-api.onrender.com` for production. Run **Login (Sales)** first to populate the `token` variable.

## Submission checklist

- [ ] Push repository to GitHub with incremental commits
- [ ] Deploy frontend to Vercel; add URL here
- [ ] Record a 2-minute flow: login → customer search → stock alert → confirm challan → movement log
- [ ] Share test credentials and Postman collection
