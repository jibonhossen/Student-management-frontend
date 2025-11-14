import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  name: '',
  id: '',
};

function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(endpoints.classes.list);
      setClasses(response?.data ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: 'Class name is required' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const payload = { name: form.name.trim() };
      if (form.id.trim()) {
        payload.id = form.id.trim();
      }

      const response = await apiClient.post(endpoints.classes.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({ type: 'success', message: message || 'Class added successfully' });
      setForm(INITIAL_FORM);
      await loadClasses();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to add class',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Classes"
        description="Create and manage the classes and sections offered in your school."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add new class</h2>
              <p className="mt-1 text-sm text-slate-500">
                Classes could be grade levels (e.g., Grade 6) or specific sections (e.g., Grade 6A).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="class-name">
                Class name<span className="text-rose-500">*</span>
              </label>
              <input
                id="class-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Grade 7 - Section A"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
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
              {isSubmitting ? 'Saving...' : 'Add class'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All classes</h2>
              <p className="text-sm text-slate-500">A complete list of available classes and sections.</p>
            </div>
            <button
              type="button"
              onClick={loadClasses}
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
              <LoadingState label="Loading classes" />
            ) : error ? (
              <ErrorState message={error} onRetry={loadClasses} />
            ) : sortedClasses.length === 0 ? (
              <EmptyState
                title="No classes yet"
                description="Create your first class to start organizing students."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <div className="grid grid-cols-12 bg-slate-50/80 text-xs font-medium uppercase text-slate-500">
                  <div className="col-span-3 px-4 py-3">Class</div>
                  <div className="col-span-5 px-4 py-3">Description</div>
                  <div className="col-span-2 px-4 py-3">Custom ID</div>
                  <div className="col-span-2 px-4 py-3 text-right">Students</div>
                </div>
                <div className="divide-y divide-slate-200/80 bg-white/95 text-sm text-slate-700">
                  {sortedClasses.map(entry => (
                    <div key={entry.id} className="grid grid-cols-12 items-center px-4 py-3">
                      <div className="col-span-3 font-medium text-slate-900">{entry.name}</div>
                      <div className="col-span-5 text-sm text-slate-500">
                        {entry.description ?? '—'}
                      </div>
                      <div className="col-span-2 text-xs text-slate-500">{entry.id ?? 'Auto'}</div>
                      <div className="col-span-2 text-right">
                        <span className="inline-flex items-center justify-end rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
                          {entry.student_count ?? '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ClassesPage;

