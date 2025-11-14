import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  name: '',
  class_id: 'global',
  id: '',
};

function SubjectsPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('global');
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
      if (data.length > 0 && selectedClass === 'global') {
        setSelectedClass(data[0].id);
        setForm(formState => ({ ...formState, class_id: data[0].id }));
      }
    } catch (err) {
      // Surface error via parent state
      setError(err.message || 'Unable to load classes');
    }
  };

  const loadSubjects = async classId => {
    if (!classId || classId === 'global') {
      setSubjects([]);
      return;
    }

    try {
      setListLoading(true);
      const response = await apiClient.get(endpoints.subjects.list, { query: { class_id: classId } });
      setSubjects(response?.data ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load subjects');
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadClasses();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'global') {
      loadSubjects(selectedClass);
    } else if (selectedClass === 'global') {
      setSubjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: 'Subject name is required' });
      return;
    }

    const payload = {
      name: form.name.trim(),
    };

    if (form.class_id && form.class_id !== 'global') {
      payload.class_id = form.class_id;
    }

    if (form.id.trim()) {
      payload.id = form.id.trim();
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await apiClient.post(endpoints.subjects.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({
        type: 'success',
        message: message || 'Subject saved successfully',
      });
      setForm(INITIAL_FORM);
      if (selectedClass && selectedClass !== 'global') {
        await loadSubjects(selectedClass);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to save subject',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classOptions = useMemo(() => {
    return [{ id: 'global', name: 'Global (available to any class)' }, ...classes];
  }, [classes]);

  const subjectsWithClassName = useMemo(() => {
    const classMap = new Map(classes.map(entry => [entry.id, entry.name]));
    return subjects.map(subject => ({
      ...subject,
      className: subject.class_id ? classMap.get(subject.class_id) ?? '—' : 'Global',
    }));
  }, [subjects, classes]);

  const isReadyToRenderList = !loading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subjects"
        description="Subjects can be global (for all classes) or tied to a specific class."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add subject</h2>
              <p className="mt-1 text-sm text-slate-500">
                Associate the subject with a class or leave it global to use across classes.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="subject-name">
                Subject name<span className="text-rose-500">*</span>
              </label>
              <input
                id="subject-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g., Mathematics"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="subject-class">
                Availability
              </label>
              <select
                id="subject-class"
                name="class_id"
                value={form.class_id}
                onChange={event => {
                  handleFormChange(event);
                  if (selectedClass !== event.target.value) {
                    setSelectedClass(event.target.value);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                {classOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
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
              {isSubmitting ? 'Saving...' : 'Save subject'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Subjects catalog</h2>
              <p className="text-sm text-slate-500">
                Filter by class to see subjects available for students.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="filter-class" className="text-sm text-slate-500">
                Filter by class:
              </label>
              <select
                id="filter-class"
                value={selectedClass}
                onChange={event => setSelectedClass(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="global">Select a class</option>
                {classes.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            {loading && !isReadyToRenderList ? (
              <LoadingState label="Loading subjects" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => loadSubjects(selectedClass)} />
            ) : subjectsWithClassName.length === 0 ? (
              <EmptyState
                title="No subjects found"
                description={
                  selectedClass === 'global'
                    ? 'Choose a class to view its subjects or add a new one.'
                    : 'Add subjects for this class to populate the curriculum.'
                }
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Availability</th>
                      <th className="px-4 py-3 font-medium">Custom ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {subjectsWithClassName.map(subject => (
                      <tr key={subject.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{subject.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                            {subject.className}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{subject.id ?? 'Auto'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listLoading ? <p className="mt-3 text-xs text-slate-500">Refreshing subjects...</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default SubjectsPage;

