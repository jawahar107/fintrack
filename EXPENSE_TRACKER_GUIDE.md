# 💰 Expense Tracker — Full-Stack Build Guide

> **Your senior pair-programmer mentor guide. Each phase is self-contained. Read, build, test, then move on.**

---

## Table of Contents

- [Phase 0 — Project Overview, Architecture & Setup](#phase-0--project-overview-architecture--setup)
- [Phase 1 — Neon PostgreSQL, Schema, Knex, Migrations & Seeds](#phase-1--neon-postgresql-schema-knex-migrations--seeds)
- [Phase 2 — Express Server, Config & Error Handling](#phase-2--express-server-config--error-handling)
- [Phase 3 — Authentication (JWT + bcrypt)](#phase-3--authentication-jwt--bcrypt)
- [Phase 4 — Categories & Transactions API](#phase-4--categories--transactions-api)
- [Phase 5 — Budgets API & Dashboard Endpoints](#phase-5--budgets-api--dashboard-endpoints)
- [Phase 6 — React App Setup (Vite, Routing, Axios, AuthContext)](#phase-6--react-app-setup-vite-routing-axios-authcontext)
- [Phase 7 — Login/Register Pages & Protected Routes](#phase-7--loginregister-pages--protected-routes)
- [Phase 8 — Transactions UI (List, Form, Filters, Pagination)](#phase-8--transactions-ui-list-form-filters-pagination)
- [Phase 9 — Dashboard UI with Recharts & Budget Alerts](#phase-9--dashboard-ui-with-recharts--budget-alerts)
- [Phase 10 — Validation, Error Handling & Security](#phase-10--validation-error-handling--security)
- [Phase 11 — Deployment (Neon + Render + Vercel)](#phase-11--deployment-neon--render--vercel)
- [Phase 12 — README, API Docs & Resume Summary](#phase-12--readme-api-docs--resume-summary)

---

# Phase 0 — Project Overview, Architecture & Setup

## 🎯 What we're building and why

We're building a **production-grade Expense Tracker** — the kind of app that appears in job portfolios and demonstrates that you can ship full-stack features end-to-end.

By the end you'll have:
- A secure REST API with JWT auth, proper middleware, and a real PostgreSQL database
- A React SPA with charts, filters, and protected routes
- Both deployed live on free-tier hosting

> **Why this project?** It covers the core of almost every real-world CRUD app: auth, relational data, business logic (budget alerts), and data visualization. Interviewers love it.

---

## 🗺 Architecture — How the pieces connect

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   React (Vite)  ──  React Router  ──  Recharts              │
│       │                                                     │
│   AuthContext (JWT in localStorage)                         │
│       │                                                     │
│   Axios (with Auth header injector)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS  (JSON REST)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RENDER (Node.js)                         │
│                                                             │
│   Express App                                               │
│     ├── Middleware  (CORS, helmet, rate-limit, JWT verify)  │
│     ├── Routes      /auth  /transactions  /categories       │
│     │                      /budgets  /dashboard             │
│     ├── Controllers (req → service → res)                   │
│     ├── Services    (business logic, Objection.js queries)  │
│     └── Models      (Objection.js ↔ Knex ↔ PostgreSQL)     │
└──────────────────────┬──────────────────────────────────────┘
                       │  TLS connection string
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               NEON (PostgreSQL, free tier)                  │
│                                                             │
│   Tables: users, categories, transactions, budgets          │
└─────────────────────────────────────────────────────────────┘
```

**Request lifecycle (example: "Add a transaction"):**
1. User fills a form → React calls `axios.post('/transactions', data)`
2. Axios automatically attaches `Authorization: Bearer <JWT>` header
3. Express receives the request → JWT middleware verifies the token → injects `req.user`
4. Controller calls the service → service uses Objection.js model → Knex builds SQL → Neon executes it
5. Row inserted → JSON response sent back → React updates UI

---

## 📐 Layered Architecture — Why we separate routes / controllers / services / models

| Layer | File location | Responsibility | Why separate? |
|-------|--------------|----------------|---------------|
| **Route** | `routes/transactions.js` | Maps URL+method to controller | Swap router without touching logic |
| **Controller** | `controllers/transactionController.js` | Reads `req`, sends `res` | No business logic here — easy to test |
| **Service** | `services/transactionService.js` | Business logic, DB calls | Reusable across controllers; unit-testable without HTTP |
| **Model** | `models/Transaction.js` | Objection.js schema + relations | Single source of truth for DB shape |
| **Migration** | `db/migrations/*.js` | Versioned DB schema changes | Team-safe; rollback possible |

> **Alternative approaches you'll hear about:**
> - **Thin controller / fat model** — business logic lives in the model. Fine for small apps, hard to test.
> - **Repository pattern** — an extra layer between service and model. Useful for huge teams. Overkill here.
> - We use **service layer** — the sweet spot for a 1–3 person team.

---

## 🗂 Final Folder Structure

```
expenses project/
├── EXPENSE_TRACKER_GUIDE.md       ← this file
│
├── server/                        ← Node.js + Express backend
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── knexfile.js                ← Knex environments config
│   ├── src/
│   │   ├── app.js                 ← Express app (no listen here)
│   │   ├── server.js              ← entry point (app.listen)
│   │   ├── config/
│   │   │   └── db.js              ← Knex instance + Objection setup
│   │   ├── db/
│   │   │   ├── migrations/        ← versioned schema changes
│   │   │   └── seeds/             ← test data
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Category.js
│   │   │   ├── Transaction.js
│   │   │   └── Budget.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── categories.js
│   │   │   ├── transactions.js
│   │   │   └── budgets.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── categoryController.js
│   │   │   ├── transactionController.js
│   │   │   └── budgetController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── categoryService.js
│   │   │   ├── transactionService.js
│   │   │   └── budgetService.js
│   │   └── middleware/
│   │       ├── auth.js            ← JWT verify middleware
│   │       └── errorHandler.js    ← global error handler
│   └── tests/                     ← (Phase 10+)
│
└── client/                        ← React + Vite frontend
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── axios.js           ← Axios instance with interceptors
        ├── context/
        │   └── AuthContext.jsx    ← JWT + user state
        ├── hooks/
        │   └── useAuth.js
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Transactions.jsx
        │   └── Budgets.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── TransactionForm.jsx
        │   ├── TransactionList.jsx
        │   ├── FilterBar.jsx
        │   ├── PieChart.jsx
        │   └── TrendChart.jsx
        └── utils/
            └── formatCurrency.js
```

---

## 🛠 Tool Setup

### Prerequisites checklist

Before we write a single line of code, make sure these are installed:

```bash
# Check Node (need v18+)
node --version

# Check npm
npm --version

# Check Git
git --version

# Check psql (optional but helpful for debugging)
psql --version
```

If Node is below 18, install [nvm](https://github.com/nvm-sh/nvm) and run:
```bash
nvm install 18
nvm use 18
```

### Tools to install / accounts to create

| Tool | Why | Link |
|------|-----|------|
| **Neon** | Free serverless PostgreSQL | https://neon.tech |
| **Postman** | Test APIs without a frontend | https://postman.com |
| **Render** | Free Node.js hosting | https://render.com |
| **Vercel** | Free React hosting | https://vercel.com |
| **VS Code** | Editor (REST Client extension optional) | https://code.visualstudio.com |

---

## 🚀 Phase 0 Setup — Exact Commands

### Step 1 — Initialize Git repo

```bash
# Run this from inside: "expenses project/"
git init
git branch -M main
```

### Step 2 — Create server scaffold

```bash
mkdir -p server/src/{config,db/{migrations,seeds},models,routes,controllers,services,middleware}
mkdir -p server/tests
```

### Step 3 — Create client scaffold

```bash
# We will use Vite to scaffold this in Phase 6 properly.
# For now just create the folder so the structure is visible.
mkdir client
```

### Step 4 — Create root .gitignore

```
node_modules/
.env
dist/
.DS_Store
```

### Step 5 — Initialize the server package.json

```bash
cd server
npm init -y
```

### Step 6 — Install all server dependencies (we install everything now so you see the full picture)

```bash
# Production dependencies
npm install express knex objection bcryptjs jsonwebtoken dotenv cors helmet express-rate-limit pg

# Dev dependencies
npm install -D nodemon
```

**What each package does:**

| Package | Role |
|---------|------|
| `express` | HTTP server framework |
| `knex` | SQL query builder + migration runner |
| `objection` | ORM on top of Knex (adds models, relations, validation) |
| `bcryptjs` | Password hashing (pure JS, no native compile step) |
| `jsonwebtoken` | Sign and verify JWTs |
| `dotenv` | Load `.env` files into `process.env` |
| `cors` | Allow cross-origin requests from our React app |
| `helmet` | Sets secure HTTP headers automatically |
| `express-rate-limit` | Prevent brute-force attacks on auth endpoints |
| `pg` | PostgreSQL driver (Knex uses this under the hood) |
| `nodemon` | Restarts server on file save during development |

> **Knex vs raw SQL:** Knex gives you a JS-fluent query builder AND a migration system. Raw SQL is more flexible but you lose migrations and have to write SQL strings manually. For a team project, Knex wins.
>
> **Objection vs Sequelize vs Prisma:**
> - Sequelize — older, heavier, "magic" behavior
> - Prisma — excellent DX, generates types, but schema-first (different mental model)
> - **Objection** — thin layer on Knex, you keep full SQL control, easy to understand
>
> We chose Objection because you already know Knex. Objection just adds models and `.relate()`.

### Step 7 — Add scripts to server/package.json

Add these to the `"scripts"` section:
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "migrate": "knex migrate:latest --knexfile knexfile.js",
    "migrate:rollback": "knex migrate:rollback --knexfile knexfile.js",
    "seed": "knex seed:run --knexfile knexfile.js"
  }
}
```

### Step 8 — Create the .env.example file (server/)

```
# Copy this to .env and fill in your values
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_super_secret_key_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Step 9 — Git commit

```bash
# From the root "expenses project/" folder
git add .
git commit -m "Phase 0: project scaffold, folder structure, server dependencies"
```

---

## ✅ Phase 0 Recap

- **Architecture** — React → Axios → Express → Knex/Objection → PostgreSQL (Neon)
- **Layered structure** — routes → controllers → services → models keeps each concern isolated and testable
- **All server deps installed** — express, knex, objection, bcryptjs, jsonwebtoken, pg, cors, helmet, rate-limit
- **Folder scaffold created** — backend is laid out; frontend folder exists (Vite setup in Phase 6)
- **Git initialized** — version control from day one

## 🧪 How to verify Phase 0

```bash
# From server/
node --version      # should be 18+
ls src/             # should show config  db  models  routes  controllers  services  middleware
cat package.json    # should list all installed packages
```

## ⚠️ Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `node: command not found` | Node not installed | Install via nvm or nodejs.org |
| `npm install` fails with `ERESOLVE` | Peer dependency conflict | Add `--legacy-peer-deps` flag |
| `knex: command not found` | Knex CLI not global | Use `npx knex` or add to npm scripts (we did this in Step 7) |
| `Cannot find module 'pg'` | pg not installed | Run `npm install pg` inside `server/` |

---

## 🧠 Quiz — Answer these before we move to Phase 1

1. **Why do we separate controllers from services?** What would go wrong if we put business logic directly in the route handler?

2. **What is Knex doing that raw `pg` alone cannot do?** Name at least two things.

3. **What is `JWT_SECRET` and why must it be in `.env` and never hardcoded?** What attack becomes possible if someone learns your secret?

---

*Once you answer the quiz questions, say **"next"** and we'll move into Phase 1 — Neon setup, schema design, migrations, and seeds.*

---

---

# Phase 1 — Neon PostgreSQL, Schema, Knex, Migrations & Seeds

## What we built
- Neon PostgreSQL account + connection string
- 4-table schema: `users`, `categories`, `transactions`, `budgets`
- `knexfile.js` — Knex environment config
- `src/config/db.js` — single Knex instance, bound to Objection
- 4 migration files — versioned table creation
- 1 seed file — 19 default categories

## Schema at a glance

```
users
  id, name, email (UNIQUE), password_hash, created_at, updated_at

categories
  id, name, type (income|expense), user_id (NULL = system default), created_at, updated_at

transactions
  id, user_id (FK), category_id (FK), type, amount (DECIMAL 12,2),
  description, date (DATE), created_at, updated_at

budgets
  id, user_id (FK), category_id (FK), month (DATE, always 1st),
  amount (DECIMAL 12,2), created_at, updated_at
  UNIQUE(user_id, category_id, month)
```

## Key design decisions
- `DECIMAL(12,2)` not FLOAT — exact money math
- `categories.user_id = NULL` = system default (shared with all users)
- `transactions.date` ≠ `created_at` — records when transaction happened, not when it was entered
- `budgets.month` stored as first-of-month DATE — easy range queries
- Indexes on every FK + commonly filtered columns

## Commands
```bash
npm run migrate          # create all 4 tables
npm run migrate:rollback # undo last batch
npm run seed             # insert default categories
```

## Files created
- `server/knexfile.js`
- `server/src/config/db.js`
- `server/src/db/migrations/001_create_users.js`
- `server/src/db/migrations/002_create_categories.js`
- `server/src/db/migrations/003_create_transactions.js`
- `server/src/db/migrations/004_create_budgets.js`
- `server/src/db/seeds/01_default_categories.js`

---

# Phase 2 — Express Server Setup, Config, and Error Handling

## What we built
- `server/src/server.js`: Entry point separating `app.listen()` from express configuration, with database bootstrap and graceful shutdown handling (`SIGTERM`).
- `server/src/app.js`: Express app instance configured with essential security, parsing, rate limiting, and 404 handler.
- `server/src/middleware/errorHandler.js`: Production-ready centralized error-handling middleware that understands Objection.js validation errors, PostgreSQL unique / foreign-key constraint violations, JWT errors, and general HTTP exceptions.

## Architecture & Middleware Pipeline
```
Incoming Request
      │
      ▼
  helmet()             ← Secure HTTP response headers (XSS, Sniffing, Clickjacking)
      │
      ▼
  cors()               ← Restricts access to authorized origin (e.g. http://localhost:5173)
      │
      ▼
  rateLimit()          ← Prevents brute force & DoS attacks (100 req/15min general, 10 req/15min auth)
      │
      ▼
  express.json()       ← Parses incoming JSON bodies (with payload size cap)
      │
      ▼
  /health              ← Liveness probe endpoint for hosting monitors (Render)
      │
      ▼
  /api/*               ← Feature routes (Auth, Categories, Transactions, Budgets)
      │
      ▼
  404 Handler          ← Catches unmatched requests and returns JSON 404
      │
      ▼
  errorHandler         ← Express error-handling middleware (4 arguments: err, req, res, next)
```

## Key Decisions Explained
1. **Separation of `app.js` and `server.js`**:
   - `app.js` configures routes and middleware without binding to a network port.
   - Enables automated testing with supertest without port conflicts.
2. **`errorHandler` has 4 parameters `(err, req, res, next)`**:
   - Express checks the function's arity (`fn.length === 4`). If you write `(err, req, res)`, Express will treat it as regular middleware and fail to intercept errors!
3. **Database-specific error handling**:
   - PostgreSQL error codes `23505` (unique violation) and `23503` (foreign key violation) are translated to user-friendly HTTP statuses `409 Conflict` and `400 Bad Request` instead of crashing with `500 Internal Server Error`.

## Testing Phase 2
```bash
# Start server in dev mode with auto-reload
cd server
npm run dev

# Test health check in another terminal
curl http://localhost:5000/health

# Test 404 handler
curl http://localhost:5000/api/unknown-endpoint
```

---

# Phase 3 — Authentication (User Model, JWT, Bcrypt, Middleware)

## What we built
- `server/src/models/User.js`: Objection.js model mapping the `users` table with `$formatJson` auto-stripping `password_hash` from all API responses.
- `server/src/services/authService.js`: Registration with email uniqueness check, password hashing using `bcryptjs` (salt rounds = 12), login comparison, and JWT generation signed with `JWT_SECRET`.
- `server/src/controllers/authController.js`: HTTP request handlers validating input presence and delegating to authService.
- `server/src/middleware/auth.js`: Token bouncer verifying `Authorization: Bearer <token>`, validating expiry, and injecting authenticated user credentials into `req.user`.
- `server/src/routes/auth.js`: Public routes (`/register`, `/login`) and protected profile route (`/me`).

---

# Phase 4 — Categories & Transactions API (CRUD, Filters, Pagination)

## What we built
- `server/src/models/Category.js` & `server/src/models/Transaction.js`: Objection.js models defining relational mappings (`BelongsToOneRelation`, `HasManyRelation`).
- `server/src/services/categoryService.js`: Shared + Personal data scoping where users can see system defaults (`user_id IS NULL`) plus their custom categories (`user_id = req.user.id`), but can only update/delete their own.
- `server/src/services/transactionService.js`: Dynamic query builder supporting filters by `type`, `category_id`, date range (`date_from` / `date_to`), and amount range with parallel count & page queries.
- `server/src/routes/categories.js` & `server/src/routes/transactions.js`: REST endpoints protected with JWT middleware.

---

# Phase 5 — Budgets API & Dashboard Endpoints

## What we built
- `server/src/models/Budget.js`: Model for monthly category limits.
- `server/src/services/budgetService.js`:
  - `listWithSpending`: Evaluates actual expenses against budget limits for the current month and calculates `spent`, `remaining`, and `isOverspent` flag.
  - `upsert`: Idempotent budget setup (inserts new or updates existing budget for user + category + month).
  - `getDashboard`: Executes parallel aggregation queries for:
    1. Monthly Income, Expense, and Net Balance.
    2. Category-wise expense breakdown for pie chart.
    3. 6-Month cash flow trend for bar chart.
- `server/src/routes/budgets.js`: Endpoints for budget CRUD and `/dashboard` metrics.

---

# Phases 6 to 9 — Modern React Frontend (Vite, Context API, Lucide Icons, Recharts)

## What we built
- **Vite React Architecture**: Fast HMR setup with React Router DOM v6.
- **Axios Central Instance (`src/api/axios.js`)**: Auto-injects JWT tokens via request interceptors and handles 401 token expirations cleanly via response interceptors.
- **Global AuthContext (`src/context/AuthContext.jsx`)**: Synchronizes authentication state across the app with `localStorage` persistence.
- **Protected Routing (`src/components/ProtectedRoute.jsx`)**: Guard ensuring unauthenticated users are seamlessly redirected to `/login`.
- **Modern UI Suite**:
  - `src/components/Navbar.jsx`: Sticky glassmorphic navbar with active link badges, user email/name, and sign-out button.
  - `src/pages/Login.jsx` & `src/pages/Register.jsx`: Clean cards with gradient badges, inline validation, and loading indicators.
  - `src/pages/Dashboard.jsx`: Month/year navigator, 3 KPI cards (Total Income, Total Expense, Net Balance), budget overspend warning banner, Recharts Donut Pie chart with category badges, and 6-month cash flow bar chart.
  - `src/pages/Transactions.jsx`: Type filter pills (All/Expense/Income), category dropdown, date range picker, formatted currency rows, modal form for Add/Edit, and pagination controls.
  - `src/pages/Budgets.jsx`: Visual budget cards with color-coded progress meters (green/amber/red), overspend deficit pills, and set budget limit form.

---

# Phase 10 — Security & Defensive Engineering

1. **Helmet**: Secures HTTP response headers against clickjacking, cross-site scripting (XSS), and MIME sniffing.
2. **CORS Configuration**: Restricts API calls to approved origins (`http://localhost:5173` or production client URL).
3. **Dual Rate Limiting**:
   - General API limit: 100 requests per 15 minutes per IP.
   - Auth limit: 10 requests per 15 minutes per IP to block brute-force password guessing.
4. **Data Isolation**: All database queries explicitly scope to `user_id = req.user.id`. A user can never view, mutate, or delete another user's financial data.
5. **Precision Math**: All monetary amounts are stored as `DECIMAL(12,2)` in PostgreSQL to prevent floating-point rounding errors.

---

# Phase 11 — Production Deployment Guide

## 1. Neon PostgreSQL
Your database is already provisioned on Neon with all 4 migrations and seed categories applied!

## 2. Render (Backend Deployment)
1. Push this repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your GitHub repository.
4. Set configurations:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *(Your Neon Connection String)*
   - `JWT_SECRET`: *(Your 64-char random secret)*
   - `CLIENT_URL`: `https://your-app.vercel.app` (Your Vercel URL once deployed)
6. Click **Deploy Web Service**.

## 3. Vercel (Frontend Deployment)
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your repository.
3. Set configurations:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-render-service.onrender.com/api`
5. Click **Deploy**.
6. The included `client/vercel.json` ensures all React Router paths (e.g. `/dashboard`, `/transactions`) correctly route to `index.html`.

---

# Phase 12 — API Reference & Senior Interview Mastery

## REST API Cheat Sheet
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/register` | No | Creates user, hashes password, returns JWT |
| `POST` | `/api/auth/login` | No | Validates credentials, returns fresh JWT |
| `GET` | `/api/auth/me` | Yes | Returns current authenticated user profile |
| `GET` | `/api/categories` | Yes | System default categories + user custom categories |
| `POST` | `/api/categories` | Yes | Creates custom category for logged-in user |
| `GET` | `/api/transactions` | Yes | Paginated transactions with optional filters (`type`, `category_id`, `date_from`, `date_to`) |
| `POST` | `/api/transactions` | Yes | Records income or expense transaction |
| `PUT` | `/api/transactions/:id`| Yes | Updates user's existing transaction |
| `DELETE` | `/api/transactions/:id`| Yes | Removes user's transaction |
| `GET` | `/api/budgets` | Yes | Monthly category budgets with actual spending & overspend status |
| `POST` | `/api/budgets` | Yes | Upserts budget for specific category & month |
| `GET` | `/api/budgets/dashboard`| Yes | Aggregated totals, pie breakdown, and 6-month trend |

## Senior Full-Stack Interview Questions (With Strong Answers)

### Q1: Why did you choose JWT over server-side session cookies?
**Answer**:
"JWTs provide a stateless authentication mechanism ideal for decoupled architectures where the frontend (React on Vercel) and backend (Express on Render) reside on separate domains. Storing state on the server requires session stores like Redis and sticky sessions across multiple load-balanced instances. With JWT, the signature verifies authenticity cryptographically without database queries on every authorization check."

### Q2: How did you prevent floating-point rounding errors with currency?
**Answer**:
"In JavaScript and standard database floating-point types (`FLOAT` / `DOUBLE`), binary representation leads to precision issues (like `0.1 + 0.2 === 0.30000000000000004`). In PostgreSQL, we designed the financial columns with `DECIMAL(12, 2)`, which stores exact numbers as base-10 strings under the hood. On the frontend and in calculations, amounts are formatted using `Intl.NumberFormat` with fixed decimal fractions."

### Q3: What is the N+1 query problem, and how did Objection.js help solve it?
**Answer**:
"The N+1 problem occurs when fetching a list of parent records (e.g., 20 transactions) and then making 20 individual queries to fetch each transaction's category. Objection.js provides `.withGraphFetched('[category]')`, which executes just two queries behind the scenes: one to fetch the page of transactions, and a second `WHERE id IN (...)` query to fetch all matching categories at once, stitching them in memory."



