import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  teacher_id: '',
  class_id: '',
  subject_id: '',
  id: '',
};

function AssignmentsPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectsCatalog, setSubjectsCatalog] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesResponse, teachersResponse, debugResponse] = await Promise.all([
        apiClient.get(endpoints.classes.list),
        apiClient.get(endpoints.teachers.list),
        apiClient.get(endpoints.debug.data),
      ]);

      const classData = classesResponse?.data ?? [];
      const teacherData = teachersResponse?.data ?? [];
      const debugData = debugResponse?.data ?? {};

      setClasses(classData);
      setTeachers(teacherData);
      setSubjectsCatalog(debugData.subjects ?? []);
      setAssignments(debugData.teacher_assignments ?? []);

      if (classData.length > 0) {
        setSelectedClass(classData[0].id);
        setForm(current => ({ ...current, class_id: classData[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Unable to load assignments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const refreshAssignments = async () => {
    try {
      const response = await apiClient.get(endpoints.debug.data);
      const data = response?.data ?? {};
      setAssignments(data.teacher_assignments ?? []);
      if (Array.isArray(data.subjects)) {
        setSubjectsCatalog(data.subjects);
      }
    } catch (err) {
      setError(err.message || 'Unable to refresh assignments');
    }
  };

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (name === 'class_id') {
      setSelectedClass(value);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.teacher_id || !form.class_id || !form.subject_id) {
      setFeedback({
        type: 'error',
        message: 'Teacher, class, and subject are all required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        teacher_id: form.teacher_id,
        class_id: form.class_id,
        subject_id: form.subject_id,
      };

      if (form.id.trim()) {
        payload.id = form.id.trim();
      }

      const response = await apiClient.post(endpoints.assignments.create, { body: payload });
      const { message } = withMessage(response);
      setFeedback({
        type: 'success',
        message: message || 'Assignment created successfully',
      });
      setForm(current => ({
        ...INITIAL_FORM,
        class_id: payload.class_id,
      }));
      await refreshAssignments();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to create assignment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classMap = useMemo(
    () => new Map(classes.map(entry => [entry.id, entry.name])),
    [classes],
  );
  const teacherMap = useMemo(
    () => new Map(teachers.map(entry => [entry.id, entry.name])),
    [teachers],
  );
  const subjectMap = useMemo(
    () => new Map(subjectsCatalog.map(entry => [entry.id, entry.name])),
    [subjectsCatalog],
  );

  const subjectsForClass = useMemo(() => {
    if (!selectedClass) return [];
    return subjectsCatalog.filter(
      subject => !subject.class_id || subject.class_id === selectedClass,
    );
  }, [subjectsCatalog, selectedClass]);

  const assignmentRows = useMemo(() => {
    return assignments.map(entry => ({
      ...entry,
      teacherName: teacherMap.get(entry.teacher_id) ?? 'Unknown teacher',
      className: classMap.get(entry.class_id) ?? 'Unknown class',
      subjectName: subjectMap.get(entry.subject_id) ?? 'Unknown subject',
    }));
  }, [assignments, classMap, subjectMap, teacherMap]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Teacher assignments"
        description="Assign teachers to classes and subjects to define classroom responsibilities."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assign teacher</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pair teachers with classes and subjects they are responsible for.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="assignment-teacher">
                Teacher<span className="text-rose-500">*</span>
              </label>
              <select
                id="assignment-teacher"
                name="teacher_id"
                value={form.teacher_id}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="assignment-class">
                Class<span className="text-rose-500">*</span>
              </label>
              <select
                id="assignment-class"
                name="class_id"
                value={form.class_id}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select class</option>
                {classes.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="assignment-subject">
                Subject<span className="text-rose-500">*</span>
              </label>
              <select
                id="assignment-subject"
                name="subject_id"
                value={form.subject_id}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select subject</option>
                {subjectsForClass.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Subjects marked global are available to every class.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="assignment-id">
                Custom ID (optional)
              </label>
              <input
                id="assignment-id"
                name="id"
                value={form.id}
                onChange={handleFormChange}
                placeholder="Auto-generated if blank"
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
              {isSubmitting ? 'Saving...' : 'Assign teacher'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assignment matrix</h2>
              <p className="text-sm text-slate-500">
                Overview of who is teaching what across the school.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAssignments}
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
              <LoadingState label="Loading assignments" />
            ) : error ? (
              <ErrorState message={error} onRetry={loadAllData} />
            ) : assignmentRows.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description="Assign teachers to classes to see them listed here."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Teacher</th>
                      <th className="px-4 py-3 font-medium">Class</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Assignment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {assignmentRows.map(row => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.teacherName}</td>
                        <td className="px-4 py-3 text-slate-600">{row.className}</td>
                        <td className="px-4 py-3">{row.subjectName}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{row.id}</td>
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

export default AssignmentsPage;

