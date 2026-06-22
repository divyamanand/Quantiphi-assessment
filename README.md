# Subscription Tracker & Renewal Dashboard

A personal finance dashboard to track recurring SaaS and streaming subscriptions, monitor renewal dates, and visualise monthly cash-flow burn.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend  | Node.js, Express 5, TypeScript    |
| Database | SQLite via Prisma ORM             |

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Project Structure

```
.
├── backend/    # Express API server
└── frontend/   # React Vite app
```

---

## Setup & Running

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

---

### 2. Backend

```bash
cd backend
```

**Install dependencies**

```bash
npm install
```

**Configure environment**

```bash
cp .env.sample .env
```

The default values in `.env.sample` work out of the box for local development — no changes needed unless you want a different port.

**Run database migrations**

```bash
npm run db:migrate
```

This creates the SQLite database file at `backend/prisma/dev.db` and applies the schema.

**Start the dev server**

```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

---

### 3. Frontend

Open a new terminal tab, then:

```bash
cd frontend
```

**Install dependencies**

```bash
npm install
```

**Configure environment**

```bash
cp .env.sample .env
```

The default `.env` points to `http://localhost:4000` which matches the backend default — no changes needed for local development.

**Start the dev server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

### Backend (`/backend`)

| Script             | Description                              |
|--------------------|------------------------------------------|
| `npm run dev`      | Start dev server with hot reload         |
| `npm run build`    | Compile TypeScript to `dist/`            |
| `npm start`        | Run compiled production build            |
| `npm run db:migrate` | Run Prisma migrations                  |
| `npm run db:generate` | Regenerate Prisma client              |
| `npm run db:studio` | Open Prisma Studio (DB GUI)             |
| `npm test`         | Run test suite                           |

### Frontend (`/frontend`)

| Script           | Description                        |
|------------------|------------------------------------|
| `npm run dev`    | Start Vite dev server              |
| `npm run build`  | Build for production               |
| `npm run preview` | Preview production build locally  |

---

## API Endpoints

| Method | Endpoint                        | Description                          |
|--------|---------------------------------|--------------------------------------|
| GET    | `/subscriptions`                | List all subscriptions (enriched)    |
| GET    | `/subscriptions/metrics`        | Total monthly burn rate & alert count |
| POST   | `/subscriptions`                | Add a new subscription               |
| PATCH  | `/subscriptions/:id/toggle`     | Toggle Active / Paused status        |
| DELETE | `/subscriptions/:id`            | Delete a subscription                |

---

## Environment Variables

### Backend (`.env`)

| Variable       | Default          | Description                     |
|----------------|------------------|---------------------------------|
| `PORT`         | `4000`           | Port the Express server runs on |
| `DATABASE_URL` | `file:./dev.db`  | SQLite database file path       |

### Frontend (`.env`)

| Variable            | Default                  | Description              |
|---------------------|--------------------------|--------------------------|
| `VITE_API_BASE_URL` | `http://localhost:4000`  | Backend API base URL     |
