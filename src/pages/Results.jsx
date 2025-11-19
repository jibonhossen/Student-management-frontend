import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';

const INITIAL_FORM = {
  class_id: '',
  exam_id: '',
  subject_id: '',
  student_id: '',
  marks: '',
  grade: '',
  comments: '',
};

function ResultsPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [existingResults, setExistingResults] = useState([]);
  const [referenceData, setReferenceData] = useState({ subjects: [], students: [] });

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [dependentLoading, setDependentLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClasses = async () => {
    const response = await apiClient.get(endpoints.classes.list);
    const data = response?.data ?? [];
    setClasses(data);
    if (data.length > 0) {
      setForm(current => ({
        ...current,
        class_id: current.class_id || data[0].id,
      }));
      return data[0].id;
    }
    return '';
  };

  const loadSubjects = async classId => {
    if (!classId) {
      setSubjects([]);
      return;
    }
    const response = await apiClient.get(endpoints.subjects.list, { query: { class_id: classId } });
    const data = response?.data ?? [];
    setSubjects(data);
    setReferenceData(current => ({ ...current, subjects: data }));
    if (data.length > 0) {
      setForm(current => ({
        ...current,
        subject_id: data.some(subject => subject.id === current.subject_id)
          ? current.subject_id
          : data[0].id,
      }));
    } else {
      setForm(current => ({ ...current, subject_id: '' }));
    }
  };

  const loadStudents = async classId => {
    if (!classId) {
      setStudents([]);
      return;
    }
    const response = await apiClient.get(endpoints.teacher.students, { query: { class_id: classId } });
    const data = response?.data ?? [];
    setStudents(data);
    if (data.length > 0) {
      setForm(current => ({
        ...current,
        student_id: data.some(student => student.id === current.student_id)
          ? current.student_id
          : data[0].id,
      }));
    } else {
      setForm(current => ({ ...current, student_id: '' }));
    }
  };

  const loadExams = async classId => {
    if (!classId) {
      setExams([]);
      return;
    }
    const response = await apiClient.get(endpoints.exams.list, { query: { class_id: classId } });
    const data = response?.data ?? [];
    setExams(data);
    if (data.length > 0) {
      setForm(current => ({
        ...current,
        exam_id: data.some(exam => exam.id === current.exam_id) ? current.exam_id : data[0].id,
      }));
    } else {
      setForm(current => ({ ...current, exam_id: '' }));
      setExistingResults([]);
    }
  };

  const loadReferenceData = async () => {
    const response = await apiClient.get(endpoints.debug.data);
    const data = response?.data ?? {};
    setReferenceData({
      subjects: data.subjects ?? [],
      students: data.students ?? [],
    });
    return data;
  };

  const loadExistingResults = async (classId, examId) => {
    if (!classId || !examId) {
      setExistingResults([]);
      return;
    }

    try {
      setResultsLoading(true);
      const data = await loadReferenceData();
      const allResults = data.results ?? [];
      const classStudents = new Set(
        (data.students ?? [])
          .filter(student => student.class_id === classId)
          .map(student => student.id),
      );

      const filteredResults = allResults.filter(
        result => result.exam_id === examId && classStudents.has(result.student_id),
      );

      setExistingResults(filteredResults);
    } catch (err) {
      setError(err.message || 'Unable to load existing results');
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const classId = await loadClasses();
        if (classId) {
          setDependentLoading(true);
          await Promise.all([loadSubjects(classId), loadStudents(classId), loadExams(classId)]);
        } else {
          setSubjects([]);
          setStudents([]);
          setExams([]);
        }
      } catch (err) {
        setError(err.message || 'Unable to load data');
      } finally {
        setDependentLoading(false);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (form.class_id) {
      setDependentLoading(true);
      Promise.all([
        loadSubjects(form.class_id),
        loadStudents(form.class_id),
        loadExams(form.class_id),
      ])
        .then(() => {
          if (form.exam_id) {
            loadExistingResults(form.class_id, form.exam_id);
          } else {
            setExistingResults([]);
          }
        })
        .finally(() => setDependentLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.class_id]);

  useEffect(() => {
    if (form.class_id && form.exam_id) {
      loadExistingResults(form.class_id, form.exam_id);
    } else {
      setExistingResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.exam_id]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!form.class_id || !form.exam_id || !form.subject_id || !form.student_id) {
      setFeedback({
        type: 'error',
        message: 'Class, exam, subject, and student are required',
      });
      return;
    }

    if (form.marks === '') {
      setFeedback({
        type: 'error',
        message: 'Enter marks obtained',
      });
      return;
    }

    const marksValue = Number(form.marks);
    if (Number.isNaN(marksValue)) {
      setFeedback({
        type: 'error',
        message: 'Marks must be a number',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const payload = {
        student_id: form.student_id,
        exam_id: form.exam_id,
        subject_id: form.subject_id,
        marks: marksValue,
        grade: form.grade.trim() || null,
        comments: form.comments.trim() || null,
      };

      const response = await apiClient.post(endpoints.results.upsert, { body: payload });
      const { data, message } = withMessage(response);
      const saved = data ?? payload;

      setExistingResults(current => {
        const existing = current.find(
          entry =>
            entry.student_id === saved.student_id &&
            entry.subject_id === saved.subject_id &&
            entry.exam_id === saved.exam_id,
        );

        const remainder = current.filter(
          entry =>
            !(
              entry.student_id === saved.student_id &&
              entry.subject_id === saved.subject_id &&
              entry.exam_id === saved.exam_id
            ),
        );

        return [
          {
            ...(existing ?? {}),
            ...saved,
            updated_at: new Date().toISOString(),
          },
          ...remainder,
        ];
      });

      setFeedback({
        type: 'success',
        message: message || 'Result saved successfully',
      });
      setForm(current => ({
        ...current,
        marks: '',
        grade: '',
        comments: '',
      }));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to save result',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingResultsWithLabels = useMemo(() => {
    if (existingResults.length === 0) return [];

    const subjectMap = new Map(referenceData.subjects.map(subject => [subject.id, subject.name]));
    const studentMap = new Map(referenceData.students.map(student => [student.id, student.name]));

    return existingResults
      .map(result => ({
        ...result,
        subjectName: subjectMap.get(result.subject_id) ?? 'Unknown subject',
        studentName: studentMap.get(result.student_id) ?? 'Unknown student',
      }))
      .sort((a, b) => b.updated_at?.localeCompare(a.updated_at ?? '') ?? 0);
  }, [existingResults, referenceData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Results" description="Loading exams and student data..." />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader title="Results" description="Record and update exam results." />
        <ErrorState message={error} onRetry={loadClasses} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Results"
        description="Submit and edit results for any exam. Choose a class, pick the evaluation, and record scores in one place."
      />

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Context</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the class, exam, subject, and student to record marks for.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="result-class">
                Class<span className="text-rose-500">*</span>
              </label>
              <select
                id="result-class"
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
              <label className="text-sm font-medium text-slate-700" htmlFor="result-exam">
                Exam<span className="text-rose-500">*</span>
              </label>
              <select
                id="result-exam"
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
              <label className="text-sm font-medium text-slate-700" htmlFor="result-subject">
                Subject<span className="text-rose-500">*</span>
              </label>
              <select
                id="result-subject"
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="result-student">
                Student<span className="text-rose-500">*</span>
              </label>
              <select
                id="result-student"
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Select student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.roll_number} — {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Scores & comments</h3>
              <p className="mt-1 text-sm text-slate-500">
                Enter the marks achieved, an optional grade, and any narrative feedback.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="result-marks">
                Marks<span className="text-rose-500">*</span>
              </label>
              <input
                id="result-marks"
                name="marks"
                value={form.marks}
                onChange={handleChange}
                placeholder="e.g., 88"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>



            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="result-comments">
                Comments
              </label>
              <textarea
                id="result-comments"
                name="comments"
                value={form.comments}
                onChange={handleChange}
                rows={4}
                placeholder="Optional feedback to help students improve"
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

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setFeedback(null);
                }}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/60"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save result'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recorded results</h3>
                <p className="text-sm text-slate-500">
                  View results already saved for the selected exam. Submitting the same student &
                  subject updates the previous entry.
                </p>
              </div>
              {resultsLoading ? (
                <span className="text-xs text-slate-500">Refreshing...</span>
              ) : null}
            </div>

            {dependentLoading ? (
              <LoadingState label="Loading dependent data" />
            ) : existingResultsWithLabels.length === 0 ? (
              <EmptyState
                title="No results yet"
                description="Record marks to populate the gradebook."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium text-right">Marks</th>
                      <th className="px-4 py-3 font-medium text-right">Grade</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white/95">
                    {existingResultsWithLabels.map(result => (
                      <tr key={`${result.student_id}-${result.subject_id}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">{result.studentName}</td>
                        <td className="px-4 py-3">{result.subjectName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{result.marks}</td>
                        <td className="px-4 py-3 text-right">{result.grade ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {result.updated_at
                            ? new Intl.DateTimeFormat('en', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(result.updated_at))
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default ResultsPage;

