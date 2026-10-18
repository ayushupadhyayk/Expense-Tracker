# Expense-Tracker

Track incomes and expenses with a dashboard, charts, filters and CSV export.

Live: https://expense-tracker-ayush.vercel.app/

## Stack

- **Frontend:** React 19 + Vite, Chart.js (`frontend/`)
- **Backend:** Express 5 + Mongoose 9 (`backend/`)

## Features

- Dashboard with totals, balance, daily income/expense chart and recent history, filterable by month
- Add, **edit** and delete incomes and expenses
- Filter by month, category, type and text search
- Export the current view to CSV
- Light / dark theme (follows your system, toggle in the sidebar)
- Responsive layout for phones and tablets

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
| GET | `/health` | Health check |

Body: `{ title, amount, date, category, description }`.
