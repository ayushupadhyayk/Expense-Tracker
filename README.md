# Expense-Tracker

Track incomes and expenses with a dashboard, charts, filters and CSV export.

Live: https://expense-tracker-ayush.vercel.app/

## Background

This project grew out of my earlier
**[Expense-Manager](https://github.com/ayushupadhyayk/Expense-Manager)**, built in May 2023 as
the first version of my final semester project. Expense-Manager is where I set up the MERN
stack and built user registration and login. Expense-Tracker followed the next day and kept
the same foundation:

- a backend organised into models, controllers and routes
- Mongoose connecting to MongoDB through a `MONGO_URL` setting
- versioned `/api/v1` routes
- a React frontend calling the API with axios

It moved the focus from user accounts to the actual money tracking (incomes, expenses, a
dashboard and charts), with separate `frontend/` and `backend/` folders. It has since grown
into the full app described below.

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

## Quick start

Requires [Node.js](https://nodejs.org) 20 or newer. Nothing else to install: the database is built in.

```bash
npm install     # installs the backend and frontend
npm start       # starts both, then open http://localhost:5173
```

The first start downloads a local MongoDB binary (about 100 MB, once) and loads the bundled
sample data, so the app opens with January 2022 to June 2023 already filled in.

| Command | What it does |
|---|---|
| `npm start` | Runs the backend (port 5050) and frontend (port 5173) together. Stop with Ctrl+C |
| `npm run reset-data` | Restores the sample data. Stop the app first |
| `npm test` | Runs the backend and frontend tests |

## How the data is stored

- The backend uses **MongoDB** through Mongoose, with models for incomes, expenses and goals.
- With no configuration it runs its own local MongoDB and keeps the data in `backend/.data`
  (not committed to git). Your changes persist between restarts.
- When the database is empty, it loads `backend/seed/sample-data.json`. Existing data is never
  overwritten. Set `SEED_SAMPLE_DATA=false` to start empty instead.
- To use your own MongoDB (for example MongoDB Atlas), copy `backend/.env.example` to
  `backend/.env` and set `MONGO_URL`. The sample data loads into it if it is empty.

The frontend talks to `http://localhost:5050/api/v1` by default; override with `VITE_API_URL`
in `frontend/.env` (see `frontend/.env.example`). Port 5000 is avoided because macOS uses it
for AirPlay Receiver.

## Tests

```bash
npm test
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
