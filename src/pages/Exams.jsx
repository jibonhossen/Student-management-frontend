import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  name: '',
  class_id: '',
  exam_date: '',
  id: '',
};

function formatDate(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function ExamsPage() {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadClasses = async () => {
    try {
      const response = await apiClient.get(endpoints.classes.list);
      const data = response?.data ?? [];
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
        setForm(current => ({ ...current, class_id: data[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Unable to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async classId => {
    if (!classId) {
      setExams([]);
      return;
    }

    try {
      setListLoading(true);
      setError(null);
      const response = await apiClient.get(endpoints.exams.list, { query: { class_id: classId } });
      setExams(response?.data ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load exams');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadExams(selectedClass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim() || !form.class_id) {
      setFeedback({
        type: 'error',
        message: 'Exam name and class are required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        name: form.name.trim(),
        class_id: form.class_id,
        exam_date: form.exam_date || null,
      };

      if (form.id.trim()) {
        payload.id = form.id.trim();
      }

      const response = await apiClient.post(endpoints.exams.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({
        type: 'success',
        message: message || 'Exam saved successfully',
      });
      setForm(current => ({ ...INITIAL_FORM, class_id: selectedClass }));
      await loadExams(payload.class_id);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to save exam',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classMap = useMemo(
    () => new Map(classes.map(entry => [entry.id, entry.name])),
    [classes],
  );

  const sortedExams = useMemo(() => {
    const now = Date.now();
    return [...exams].sort((a, b) => {
      const timeA = a.exam_date ? new Date(a.exam_date).getTime() : now;
      const timeB = b.exam_date ? new Date(b.exam_date).getTime() : now;
      return timeA - timeB;
    });
  }, [exams]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Exams"
        description="Schedule exams and manage timelines for each class."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Schedule exam</h2>
              <p className="mt-1 text-sm text-slate-500">
                Link each exam to a class and optionally define the exam date.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="exam-name">
                Exam name<span className="text-rose-500">*</span>
              </label>
              <input
                id="exam-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g., Midterm Assessment"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="exam-class">
                Class<span className="text-rose-500">*</span>
              </label>
              <select
                id="exam-class"
                name="class_id"
                value={form.class_id}
                onChange={event => {
                  handleFormChange(event);
                  setSelectedClass(event.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select class</option>
                {classes.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="exam-date">
                Exam date
              </label>
              <input
                id="exam-date"
                name="exam_date"
                type="date"
                value={form.exam_date}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
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
              {isSubmitting ? 'Saving...' : 'Save exam'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Exam calendar</h2>
              <p className="text-sm text-slate-500">Choose a class to view its scheduled exams.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="filter-class" className="text-sm text-slate-500">
                Class:
              </label>
              <select
                id="filter-class"
                value={selectedClass}
                onChange={event => setSelectedClass(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select class</option>
                {classes.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <LoadingState label="Loading exams" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => loadExams(selectedClass)} />
            ) : selectedClass === '' ? (
              <EmptyState
                title="Select a class"
                description="Choose a class to review upcoming exams."
              />
            ) : sortedExams.length === 0 ? (
              <EmptyState
                title="No exams scheduled"
                description="Plan assessments to help students prepare in advance."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Exam</th>
                      <th className="px-4 py-3 font-medium">Class</th>
                      <th className="px-4 py-3 font-medium">Exam date</th>
                      <th className="px-4 py-3 font-medium">Exam ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {sortedExams.map(exam => (
                      <tr key={exam.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{exam.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {classMap.get(exam.class_id) ?? '—'}
                        </td>
                        <td className="px-4 py-3">{exam.exam_date ? formatDate(exam.exam_date) : 'Not set'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{exam.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listLoading ? <p className="mt-3 text-xs text-slate-500">Refreshing exams...</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ExamsPage;

