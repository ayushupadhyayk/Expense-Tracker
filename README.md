# Expense-Tracker

Track incomes and expenses with a dashboard, charts, filters and CSV export.

Live: https://expense-tracker-ayush.vercel.app/

## Stack

- **Frontend:** React 19 + Vite, Chart.js (`frontend/`)
- **Backend:** Express 5 + Mongoose 9 (`backend/`)

## Features

- **Overview** with balance, this month's money in and out, savings rate, a 90-day balance chart, goals and recent activity
- **Transactions** for incomes and expenses in one place: add and edit in a side panel, filter by type, category, text and dates, export CSV
- **Reports** by week, by month or for any date range, compared with the previous period
  - **Excel export** with native, editable charts: a pie of spending by category, a doughnut of income sources and an income-vs-expenses column chart, plus every transaction (filterable, with live totals), goals and insights
  - Print-friendly layout
- **Analysis**: savings rate against a 20% target, monthly trends, biggest category changes, spending by weekday, regular payments and plain-language insights
- **Goals**: set a target and optional deadline and get the weekly and monthly amount needed, a projected finish date from your real pace, dated milestones on a path, a month-by-month schedule and suggestions that show how many weeks each change saves
- Light and dark themes, responsive down to phone width, respects reduced-motion settings

## Run locally

Requires Node 20+.

```bash
# 1. Backend (http://localhost:5050)
cd backend
npm install
npm run dev
```

If `MONGO_URL` is not set, the backend starts a local MongoDB automatically and stores
data in `backend/.data` (first run downloads the MongoDB binary). To use your own database,
copy `backend/.env.example` to `backend/.env` and set `MONGO_URL`.

```bash
# 2. Frontend (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev
```

The frontend talks to `http://localhost:5050/api/v1` by default; override with
`VITE_API_URL` in `frontend/.env` (see `frontend/.env.example`).

> Port 5000 is avoided because macOS uses it for AirPlay Receiver.

## Tests

```bash
cd backend && npm test
cd frontend && npm test
```

## API

All routes are under `/api/v1`.

| Method | Path | |
|---|---|---|
| GET | `/get-incomes`, `/get-expenses` | List |
| POST | `/add-income`, `/add-expense` | Create |
| PUT | `/update-income/:id`, `/update-expense/:id` | Update |
| DELETE | `/delete-income/:id`, `/delete-expense/:id` | Delete |
| GET, POST | `/goals` | List or create goals |
| PUT, DELETE | `/goals/:id` | Update or delete a goal |
| POST | `/goals/:id/contributions` | Add money (negative amount = withdrawal) |
| DELETE | `/goals/:id/contributions/:contributionId` | Remove an entry |
| GET | `/health` | Health check |

Body: `{ title, amount, date, category, description }`.
