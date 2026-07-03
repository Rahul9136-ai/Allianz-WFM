# WFM Request Portal

A production-shaped **Workforce Management Request Portal** — a centralized ticketing platform that replaces email chains, Excel trackers, and manual follow-ups for communication between the Operations team and the Workforce Management (WFM) team.

Inspired by Microsoft Power Apps / Fluent Design, ServiceNow, Jira Service Management, and Monday.com.

## Corporate Branding

| Token | Color |
| --- | --- |
| Primary | Red `#C7272F` |
| Secondary | Grey `#5B5B5B` |
| Background | White `#FFFFFF` |
| Light Grey | `#F5F5F5` |
| Border | `#DDDDDD` |

White background · red navigation · grey sidebar · rounded cards · soft shadows · Fluent-style typography.

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Material UI v6 · Tailwind CSS · React Router · React Hook Form · TanStack Query · Chart.js

**Backend:** Node.js · Express · TypeScript · Prisma ORM · PostgreSQL · JWT auth · Multer (uploads) · Nodemailer (notifications) · Zod (validation)

## User Roles

| Role | Capabilities |
| --- | --- |
| **Operations** | Create requests, view own requests, upload files, track status, comment |
| **WFM** | View all requests, assign, update status, add internal notes, manage SLA, close tickets, export |
| **Admin** | Everything + manage users / categories / vendors / SLA rules, view audit logs, configure system |

## Project Structure

```
wfm-request-portal/
├── backend/                 # Node/Express/TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma    # Full normalized data model
│   │   └── seed.ts          # Sample users, categories, vendors, tickets
│   └── src/
│       ├── config/          # env, prisma client
│       ├── middleware/      # auth (JWT + RBAC), validation, upload, error
│       ├── modules/         # auth, users, requests, categories, vendors,
│       │                    #   comments, attachments, notifications, audit, dashboard
│       ├── utils/           # ticket-number, sla engine, audit, storage, email
│       ├── app.ts           # Express app assembly
│       └── server.ts        # Entry point
├── frontend/                # React/TypeScript SPA
│   └── src/
│       ├── api/             # axios client + typed endpoints
│       ├── components/      # layout, common (chips, SLA countdown), guards
│       ├── context/         # AuthContext
│       ├── pages/           # Login, Dashboard, Create/List/Detail, Users, etc.
│       └── theme/           # MUI theme with corporate branding
├── docker-compose.yml       # PostgreSQL for local dev
└── docs/                    # API reference, deployment guide
```

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (via Docker `docker compose up -d postgres`, or a native install)

### 1. Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL if needed
npm install
npm run prisma:generate
npm run prisma:migrate        # creates tables
npm run prisma:seed           # loads demo data
npm run dev                   # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5190
```

### Demo Accounts (password: `Password123!`)

| Email | Role |
| --- | --- |
| `admin@wfmportal.com` | Admin |
| `wfm@wfmportal.com` | WFM |
| `ops@wfmportal.com` | Operations |

## Key Features

- **Auto-generated ticket numbers** — `WFM-000001`, `WFM-000002`, …
- **SLA engine** — due-date calculation per priority/category, live green/amber/red status, countdown timers, overdue highlighting
- **Conversation threads** — comments with internal (WFM-only) notes, avatars, timestamps; replaces email
- **File attachments** — Word/Excel/PDF/CSV/PNG/JPG up to 20 MB, multiple files, secure download; storage abstraction ready for Azure Blob
- **Audit trail** — immutable, append-only log of every status change, assignment, note, and comment
- **Activity timeline** — per-ticket human-readable history
- **Executive dashboard** — 16 KPI cards + Chart.js visualizations (by category, vendor, status, assignee)
- **Requests table** — search, sort, filter, pagination, bulk update, print
- **Email notifications** — fired on create/assign/status/comment/complete/reject/cancel (dev transport writes previews to `backend/emails/`)
- **RBAC** — enforced in middleware and UI routing

## Auth & Integrations

- **Local JWT auth** is fully wired (bcrypt password hashing, role middleware, session timeout).
- **Azure AD SSO** is stubbed and config-ready: set `AZURE_AD_*` in `.env` to enable the `/api/auth/azure/login` flow later.
- **Azure Blob Storage** — implement the `AzureBlobStorageDriver` in `src/utils/storage.ts` and set `STORAGE_DRIVER=azure`.
- **SMTP email** — set `EMAIL_DRIVER=smtp` + `SMTP_*` to send real emails instead of dev previews.

See [docs/API.md](docs/API.md) for the REST reference and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment.
