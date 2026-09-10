import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [form, setForm] = useState({ exercise_name: '', sets: '', reps: '', weight_kg: '' });
  const [error, setError] = useState('');

  async function loadData() {
    const [w, stats] = await Promise.all([api.getWorkouts(), api.getWeeklyStats()]);
    setWorkouts(w);
    setWeeklyStats(
      stats.map((s) => ({
        week: new Date(s.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volume: Number(s.total_volume_kg),
      }))
    );
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  async function handleAddWorkout(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createWorkout({
        entries: [
          {
            exercise_name: form.exercise_name,
            sets: Number(form.sets) || null,
            reps: Number(form.reps) || null,
            weight_kg: Number(form.weight_kg) || null,
          },
        ],
      });
      setForm({ exercise_name: '', sets: '', reps: '', weight_kg: '' });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteWorkout(id);
    await loadData();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Hey, {user?.name}</h1>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
            Log out
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <h2 className="font-medium text-slate-900 mb-4">Weekly volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <h2 className="font-medium text-slate-900 mb-4">Log a set</h2>
          <form onSubmit={handleAddWorkout} className="grid grid-cols-2 gap-3">
            <input
              placeholder="Exercise (e.g. Squat)"
              value={form.exercise_name}
              onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
              className="col-span-2 rounded-lg border border-slate-300 px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Sets"
              value={form.sets}
              onChange={(e) => setForm({ ...form, sets: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="number"
              placeholder="Reps"
              value={form.reps}
              onChange={(e) => setForm({ ...form, reps: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              className="col-span-2 rounded-lg border border-slate-300 px-3 py-2"
            />
            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="col-span-2 bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700 transition"
            >
              Add workout
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-medium text-slate-900 mb-4">Recent workouts</h2>
          <ul className="divide-y divide-slate-100">
            {workouts.map((w) => (
              <li key={w.id} className="py-3 flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">{new Date(w.date).toLocaleDateString()}</p>
                  {w.entries.map((e) => (
                    <p key={e.id} className="text-slate-800">
                      {e.exercise_name} — {e.sets}×{e.reps} @ {e.weight_kg}kg
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
            {workouts.length === 0 && (
              <p className="text-slate-400 text-sm py-4">No workouts logged yet — add one above.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
