import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints } from '../services/apiClient.js';

function PublicResultsPage() {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({
    class_id: '',
    exam_id: '',
    roll_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [isInitLoading, setIsInitLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.get(endpoints.classes.list);
        const data = response?.data ?? [];
        setClasses(data);
        if (data.length > 0) {
          setForm(current => ({ ...current, class_id: data[0].id }));
          await loadExams(data[0].id);
        }
      } catch (err) {
        setError(err.message || 'Unable to load classes');
      } finally {
        setIsInitLoading(false);
      }
    })();
  }, []);

  const loadExams = async classId => {
    if (!classId) {
      setExams([]);
      return;
    }
    try {
      const response = await apiClient.get(endpoints.exams.list, { query: { class_id: classId } });
      const data = response?.data ?? [];
      setExams(data);
      if (data.length > 0) {
        setForm(current => ({ ...current, exam_id: data[0].id }));
      } else {
        setForm(current => ({ ...current, exam_id: '' }));
      }
    } catch (err) {
      setError(err.message || 'Unable to load exams');
    }
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (name === 'class_id') {
      loadExams(value);
      setResults(null);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.class_id || !form.exam_id || !form.roll_number.trim()) {
      setError('Class, exam, and roll number are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await apiClient.get(endpoints.results.public, {
        query: {
          class_id: form.class_id,
          exam_id: form.exam_id,
          roll_number: form.roll_number.trim(),
        },
      });

      if (response?.success === false) {
        setError(response?.message ?? 'No results found');
        return;
      }

      setResults(response?.data ?? null);
    } catch (err) {
      setError(err.message || 'Unable to fetch results');
    } finally {
      setLoading(false);
    }
  };

  if (isInitLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Public results" description="Loading classes..." />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Public results"
        description="Students and guardians can check results using class, exam, and roll number."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lookup</h2>
              <p className="mt-1 text-sm text-slate-500">
                Provide the class, exam, and roll number to view results.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="public-class">
                Class<span className="text-rose-500">*</span>
              </label>
              <select
                id="public-class"
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="public-exam">
                Exam<span className="text-rose-500">*</span>
              </label>
              <select
                id="public-exam"
                name="exam_id"
                value={form.exam_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select exam</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="public-roll">
                Roll number<span className="text-rose-500">*</span>
              </label>
              <input
                id="public-roll"
                name="roll_number"
                value={form.roll_number}
                onChange={handleChange}
                placeholder="e.g., 17"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Searching...' : 'View results'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              <p className="text-sm text-slate-500">
                Results appear once a valid roll number is found for the selected exam.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <LoadingState label="Fetching results" />
            ) : !results ? (
              <EmptyState
                title="Nothing to show"
                description="Submit the lookup form to view the results for a student."
              />
            ) : results.results?.length === 0 ? (
              <EmptyState
                title="No records"
                description="No marks found for the provided roll number."
              />
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm">
                  <p className="text-slate-500">Student</p>
                  <p className="text-lg font-semibold text-slate-900">{results.student}</p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200/70">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                    <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Subject</th>
                        <th className="px-4 py-3 font-medium text-right">Marks</th>
                        <th className="px-4 py-3 font-medium text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white/95">
                      {results.results.map(result => (
                        <tr key={result.subject}>
                          <td className="px-4 py-3 font-medium text-slate-900">{result.subject}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{result.marks}</td>
                          <td className="px-4 py-3 text-right">{result.grade ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicResultsPage;

