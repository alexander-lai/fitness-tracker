# Fitness Tracker

A full stack fitness tracker: log workouts, view weekly volume trends, track progress over time.

**Stack:** React + Tailwind (frontend) · Node/Express (backend) · PostgreSQL (database) · JWT auth · Recharts

## Project structure

```
fitness-tracker/
├── backend/
│   ├── config/db.js        # PostgreSQL connection pool
│   ├── middleware/auth.js  # JWT verification middleware
│   ├── routes/auth.js      # signup / login
│   ├── routes/workouts.js  # workout CRUD + weekly stats
│   ├── schema.sql          # database schema
│   └── server.js           # Express app entry point
└── frontend/
    └── src/
        ├── api/client.js       # fetch wrapper for the API
        ├── pages/Login.jsx
        ├── pages/Signup.jsx
        ├── pages/Dashboard.jsx  # log form + chart + workout list
        ├── AuthContext.jsx
        └── App.jsx              # routes
```

## Setup

### 1. Database
Create a Postgres database, then run:
```bash
psql -d your_db_name -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm run dev
```
Runs on `http://localhost:4000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Set `VITE_API_URL` in a `.env` file if your backend isn't on `localhost:4000`.

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/workouts` | List logged-in user's workouts |
| POST | `/api/workouts` | Log a new workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/workouts/stats/weekly` | Weekly volume/duration for charts |

## Next steps / stretch goals
- Pull exercises from a public API (e.g. wger, ExerciseDB) instead of free-text
- Streak tracking and weekly goals
- Body metrics tracking (weight, body fat %) — schema already included
- Deploy: frontend to Vercel, backend + DB to Railway or Render

## Deployment notes
- Set `CLIENT_ORIGIN` on the backend to your deployed frontend URL (for CORS)
- Set `VITE_API_URL` on the frontend to your deployed backend URL
- Use a strong random `JWT_SECRET` in production
