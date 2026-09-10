const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/workouts - list all workouts (with entries) for the logged-in user
router.get('/', async (req, res) => {
  try {
    const workouts = await pool.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC',
      [req.userId]
    );

    const workoutIds = workouts.rows.map((w) => w.id);
    let entriesByWorkout = {};

    if (workoutIds.length > 0) {
      const entries = await pool.query(
        'SELECT * FROM workout_entries WHERE workout_id = ANY($1::int[])',
        [workoutIds]
      );
      entriesByWorkout = entries.rows.reduce((acc, entry) => {
        (acc[entry.workout_id] ||= []).push(entry);
        return acc;
      }, {});
    }

    const result = workouts.rows.map((w) => ({
      ...w,
      entries: entriesByWorkout[w.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch workouts' });
  }
});

// POST /api/workouts - create a workout with one or more exercise entries
router.post('/', async (req, res) => {
  const { date, notes, entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'At least one exercise entry is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const workoutResult = await client.query(
      'INSERT INTO workouts (user_id, date, notes) VALUES ($1, COALESCE($2, CURRENT_DATE), $3) RETURNING *',
      [req.userId, date, notes]
    );
    const workout = workoutResult.rows[0];

    const insertedEntries = [];
    for (const e of entries) {
      const entryResult = await client.query(
        `INSERT INTO workout_entries
           (workout_id, exercise_name, sets, reps, weight_kg, duration_min, distance_km)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [workout.id, e.exercise_name, e.sets, e.reps, e.weight_kg, e.duration_min, e.distance_km]
      );
      insertedEntries.push(entryResult.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ ...workout, entries: insertedEntries });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not save workout' });
  } finally {
    client.release();
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete workout' });
  }
});

// GET /api/workouts/stats/weekly - counts + volume per week for charts
router.get('/stats/weekly', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         date_trunc('week', w.date) AS week,
         COUNT(DISTINCT w.id) AS workout_count,
         COALESCE(SUM(e.sets * e.reps * e.weight_kg), 0) AS total_volume_kg,
         COALESCE(SUM(e.duration_min), 0) AS total_duration_min
       FROM workouts w
       LEFT JOIN workout_entries e ON e.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY week
       ORDER BY week ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch weekly stats' });
  }
});

module.exports = router;
