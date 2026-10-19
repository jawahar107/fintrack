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

<!-- PHASE 1 WILL BE ADDED HERE -->


