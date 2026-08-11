# Nexus Ops - Mini ERP + CRM Operations Portal

Nexus Ops is a focused operations portal for a wholesale distributor. It balances an admin-friendly CRM with the operational controls that make sales dispatch safe: role-based access, low-stock visibility, and transactional stock deduction during challan confirmation.

## What is included

- JWT login with Admin, Sales, Warehouse, and Accounts roles
- Customer CRM: search, details, follow-up notes, status, and next follow-up
- Products, warehouse location, stock thresholds, and an auditable IN/OUT movement log
- Sales challans with automatic numbers, drafts, confirmation, immutable item snapshots, and negative-stock prevention
- Responsive React dashboard with operational pulse, stock-watch panel and live challan activity
- PostgreSQL schema, Docker Compose, seed data and Postman collection

## Architecture

```text
React + Vite (apps/web) --> Express REST API (apps/api) --> PostgreSQL
                              | JWT role middleware
                              | Zod validation
                              + DB transactions / row locks for dispatch confirmation
```

The API is deliberately thin: validation is performed at the request boundary and inventory-changing actions use a PostgreSQL transaction with `SELECT ... FOR UPDATE`. A confirmed challan writes an item snapshot and matching OUT movements in the same transaction. That means a failed stock check cannot leave a half-created challan or partial stock adjustment.

## Local setup

Prerequisites: Node.js 20+ and PostgreSQL 16+ (or Docker Desktop).

1. Copy environment templates:

   ```bash
   copy apps\api\.env.example apps\api\.env
   copy apps\web\.env.example apps\web\.env
   ```

2. Create the database and set `DATABASE_URL` in `apps/api/.env`.

3. Install and run:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

   Web: `http://localhost:5173` · API: `http://localhost:4000` · health: `http://localhost:4000/health`

### Docker database option

Start PostgreSQL with `docker compose up -d db`, then use the default `DATABASE_URL` from the API env example. The `api` service can be built with `docker compose up --build api` after installing/serving the frontend separately.

## Demo credentials

All seeded users use password `Campus@2026`.

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
| Products | `GET/POST /products`, `PUT /products/:id`, `GET/POST /products/:id/movements` |
| Challans | `GET/POST /challans` |

Import `postman/Nexus-Ops.postman_collection.json` and set its `baseUrl` and `token` variables. The API returns consistent JSON errors, appropriate HTTP codes, validation details (422), and paginated customer search results.

## Deployment guide

1. Create a free Postgres database on Neon or Supabase. Set `DATABASE_URL` in the API environment.
2. Deploy `apps/api` to Render/Railway. Build: `npm install && npm run build`; start: `npm run start`; then run migration/seed once with the platform shell. Configure `JWT_SECRET`, `CORS_ORIGIN`, `DATABASE_URL`, and `PORT`.
3. Deploy `apps/web` to Vercel or Netlify. Build command: `npm run build -w @nexus/web`; publish directory: `apps/web/dist`; set `VITE_API_URL` to the deployed API URL.
4. Update `CORS_ORIGIN` with the actual frontend URL and test one confirmed challan end-to-end.

Secrets never enter git: `.env` is ignored, `.env.example` documents only variable names and local safe defaults.

## Assumptions and known limitations

- Accounts users have read access; the brief does not define invoice/accounting operations.
- Customer and product create/edit APIs are implemented; the dashboard presents the core browse/search flow. A production release would add the corresponding modal forms, detail route and full challan composer UI.
- Challans are created either as Draft or Confirmed. Cancellation/reversal is intentionally excluded because a reversal workflow needs approval/audit policy.
- Challan number uses a time-based readable sequence. Replace it with a database sequence for multi-region, very high-volume production use.

## Submission checklist

- [ ] Push repository to GitHub with incremental commits
- [ ] Deploy frontend and API; add URLs here
- [ ] Record a 2-minute flow: login -> customer search -> stock alert -> confirm challan -> movement log
- [ ] Share the test credentials above and Postman collection
