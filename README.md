# Support Desk — MERN Customer Support Ticketing System

A full-featured customer support ticketing platform built with MongoDB, Express, React, and Node.js.

## Features

### Core
- **Auth & Roles** — JWT-based login/register for two roles: `client` and `agent`. Each is restricted to its own views and routes.
- **Ticket Intake** — Clients raise tickets with subject, description, and file attachments (up to 5 files / 10 MB each). An acknowledgement with ticket number, urgency, assigned agent, and SLA deadline is shown on submission.
- **REST API** — Full ticket lifecycle endpoints: create, read (list/detail), update (status, urgency, department, assignment), delete, and comment.
- **Database** — MongoDB via Mongoose. Persists users, tickets, comments, attachments, SLA deadlines, and all timestamps.
- **Triage & Routing**
  - On submission, a keyword-based triage engine auto-classifies urgency (`low` / `medium` / `high` / `critical`) and department (`billing` / `technical` / `sales` / `escalations` / `general`).
  - Tags are extracted automatically (e.g. `api`, `login`, `payment`, `bug`).
  - The ticket is auto-assigned to the least-busy agent in the matching department (round-robin by `activeTicketCount`).
  - SLA deadline is computed from urgency: critical = 2h, high = 8h, medium = 24h, low = 72h.
- **Client Dashboard** — Stats overview + recent tickets table with urgency, status, SLA indicator.
- **Client Ticket Detail** — Full ticket view with conversation thread and reply form.
- **Agent Dashboard** — Live stats (open/in-progress/resolved/critical/SLA breached/escalated/my active), by-department breakdown, and critical ticket queue. Auto-refreshes every 30s.
- **Agent Ticket List** — All tickets filterable by urgency, department, status, and assigned agent. Sorted by priority score. Auto-refreshes every 30s.
- **Agent Ticket Detail** — Full controls: change status/urgency/department/assignment, reply or leave internal notes, smart suggested replies. First-response and resolution times tracked.

### Bonus
- **Agent reply suggestions** — Contextual reply starters generated from ticket urgency, status, and department.
- **SLA timers** — Live per-ticket SLA countdown shown in all lists and detail views.
- **Auto-escalation worker** — `node-cron` job runs every 5 minutes: marks breached tickets, upgrades urgency, and moves tickets to the Escalations department after 1 hour past deadline.
- **Real-time feel** — Agent dashboards auto-poll every 30 seconds.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6, Axios, react-hot-toast, date-fns |
| Backend | Node.js, Express 4, Mongoose 7, JWT, Multer, node-cron |
| Database | MongoDB |

## Project Structure

```
support-desk/
├── backend/
│   ├── config/          # DB config, Multer config
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # User, Ticket (Mongoose schemas)
│   ├── routes/           # auth, tickets, users, stats
│   ├── services/         # triageService, routingService
│   ├── workers/          # slaWorker (node-cron)
│   └── server.js
└── frontend/
    └── src/
        ├── api/           # Axios instance
        ├── components/    # Layout, TicketBadges
        ├── context/       # AuthContext (JWT + user state)
        └── pages/
            ├── client/    # Dashboard, Tickets, NewTicket, TicketDetail
            └── agent/     # Dashboard, Tickets, TicketDetail
```

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on `mongodb://localhost:27017`

### Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Environment
Backend `.env` is pre-configured at `backend/.env`. Update `MONGO_URI` if needed.

### Run (two terminals)
```bash
# Terminal 1 — API server
cd backend
npm run dev       # nodemon, port 5000

# Terminal 2 — React dev server
cd frontend
npm run dev       # Vite, port 5173
```

Open http://localhost:5173

### Seed agents (optional)
Register at least one agent account via the UI (role: agent) before submitting tickets so the auto-routing can assign them.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register client or agent |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/tickets` | Create ticket (multipart) |
| GET | `/api/tickets` | List tickets (filtered, paginated) |
| GET | `/api/tickets/:id` | Ticket detail |
| PUT | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Delete ticket (agent only) |
| POST | `/api/tickets/:id/comments` | Add comment/reply |
| GET | `/api/users/agents` | List agents (agent only) |
| GET | `/api/stats/agent` | Agent dashboard stats |
| GET | `/api/stats/client` | Client dashboard stats |
