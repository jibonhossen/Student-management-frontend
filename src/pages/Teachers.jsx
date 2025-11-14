import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  id: '',
};

async function hashPassword(value) {
  if (!window.crypto?.subtle) {
    return value;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(endpoints.teachers.list);
      setTeachers(response?.data ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFeedback({
        type: 'error',
        message: 'Name, email, and password are required',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFeedback({ type: 'error', message: 'Provide a valid email address' });
      return;
    }

    if (form.password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'Password should be at least 6 characters long',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password_hash: await hashPassword(form.password),
      };

      if (form.id.trim()) {
        payload.id = form.id.trim();
      }

      const response = await apiClient.post(endpoints.teachers.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({
        type: 'success',
        message: message || 'Teacher added successfully',
      });
      setForm(INITIAL_FORM);
      await loadTeachers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to add teacher',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Teachers"
        description="Keep teacher records centralized and up to date."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add teacher</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create credentials for teachers to manage classes and results.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="teacher-name">
                Full name<span className="text-rose-500">*</span>
              </label>
              <input
                id="teacher-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Miriam Carter"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="teacher-email">
                Email address<span className="text-rose-500">*</span>
              </label>
              <input
                id="teacher-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@school.edu"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="teacher-password">
                Temporary password<span className="text-rose-500">*</span>
              </label>
              <input
                id="teacher-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Provide a temporary password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-xs text-slate-500">
                We securely hash this password before sending it to the server.
              </p>
            </div>


            {feedback ? (
              <div
                className={[
                  'rounded-lg border px-3 py-2 text-sm',
                  feedback.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                ].join(' ')}
              >
                {feedback.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create teacher'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Faculty directory</h2>
              <p className="text-sm text-slate-500">
                See all active teachers and their contact information.
              </p>
            </div>
            <button
              type="button"
              onClick={loadTeachers}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5v6h6M19.5 19.5v-6h-6M5 19l5.25-5.25" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5.25 5.25" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="mt-5">
            {loading ? (
              <LoadingState label="Loading teachers" />
            ) : error ? (
              <ErrorState message={error} onRetry={loadTeachers} />
            ) : sortedTeachers.length === 0 ? (
              <EmptyState
                title="No teachers yet"
                description="Add teachers to get them started with the platform."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Teacher ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {sortedTeachers.map(teacher => (
                      <tr key={teacher.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{teacher.name}</td>
                        <td className="px-4 py-3 text-slate-600">{teacher.email}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{teacher.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeachersPage;

