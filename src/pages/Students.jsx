import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  name: '',
  roll_number: '',
  class_id: '',
  id: '',
};

function StudentsPage() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
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

  const loadStudents = async classId => {
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setListLoading(true);
      setError(null);
      const response = await apiClient.get(endpoints.students.listByClass(classId));
      setStudents(response?.data ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load students');
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
      loadStudents(selectedClass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.name.trim() || !form.roll_number.trim() || !form.class_id) {
      setFeedback({
        type: 'error',
        message: 'Name, roll number, and class are required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        name: form.name.trim(),
        roll_number: form.roll_number.trim(),
        class_id: form.class_id,
      };

      if (form.id.trim()) {
        payload.id = form.id.trim();
      }

      const response = await apiClient.post(endpoints.students.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({
        type: 'success',
        message: message || 'Student added successfully',
      });
      setForm(current => ({ ...INITIAL_FORM, class_id: selectedClass }));
      await loadStudents(payload.class_id);
    } catch (err) {
      const details = err?.details;
      const serverMessage =
        details?.message ??
        err.message ??
        'Unable to add student';

      setFeedback({
        type: 'error',
        message: serverMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classMap = useMemo(
    () => new Map(classes.map(entry => [entry.id, entry.name])),
    [classes],
  );

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true }));
  }, [students]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Students"
        description="Enroll students, manage roll numbers, and track class rosters."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Enroll student</h2>
              <p className="mt-1 text-sm text-slate-500">
                Assign each student a unique roll number within their class.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="student-name">
                Full name<span className="text-rose-500">*</span>
              </label>
              <input
                id="student-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g., Ravi Kumar"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="student-roll">
                Roll number<span className="text-rose-500">*</span>
              </label>
              <input
                id="student-roll"
                name="roll_number"
                value={form.roll_number}
                onChange={handleFormChange}
                placeholder="e.g., 17"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-xs text-slate-500">
                Roll numbers must be unique within the selected class.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="student-class">
                Class<span className="text-rose-500">*</span>
              </label>
              <select
                id="student-class"
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
              {isSubmitting ? 'Saving...' : 'Enroll student'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Class roster</h2>
              <p className="text-sm text-slate-500">Select a class to view enrolled students.</p>
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
              <LoadingState label="Loading roster" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => loadStudents(selectedClass)} />
            ) : selectedClass === '' ? (
              <EmptyState
                title="Select a class"
                description="Choose a class to view and manage its students."
              />
            ) : sortedStudents.length === 0 ? (
              <EmptyState
                title="No students enrolled"
                description="Add students to this class to build the roster."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Roll</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Class</th>
                      <th className="px-4 py-3 font-medium">Student ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {sortedStudents.map(student => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{student.roll_number}</td>
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {classMap.get(student.class_id) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{student.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listLoading ? <p className="mt-3 text-xs text-slate-500">Refreshing students...</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentsPage;

