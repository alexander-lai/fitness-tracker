-- Fitness Tracker Database Schema (PostgreSQL)

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reference list of exercises (can be seeded manually or from a public API)
CREATE TABLE exercises (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(50),   -- e.g. 'strength', 'cardio', 'mobility'
    muscle_group VARCHAR(50)   -- e.g. 'legs', 'back', 'chest'
);

-- One row per logged workout session
CREATE TABLE workouts (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Individual exercise entries within a workout (sets/reps or duration/distance)
CREATE TABLE workout_entries (
    id            SERIAL PRIMARY KEY,
    workout_id    INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id   INTEGER REFERENCES exercises(id),
    exercise_name VARCHAR(150) NOT NULL, -- denormalized fallback if not using exercises table
    sets          INTEGER,
    reps          INTEGER,
    weight_kg     NUMERIC(6,2),
    duration_min  NUMERIC(6,2),
    distance_km   NUMERIC(6,2)
);

-- Optional: body metrics over time (stretch goal)
CREATE TABLE body_metrics (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg   NUMERIC(6,2),
    body_fat_pct NUMERIC(5,2)
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX idx_entries_workout ON workout_entries(workout_id);
