import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { apiClient, endpoints, withMessage } from '../services/apiClient.js';
import { hashPassword } from '../utils/hashPassword.js';

const LOGIN_INITIAL = {
  email: '',
  password: '',
};

const RESULT_INITIAL = {
  class_id: '',
  subject_id: '',
  student_id: '',
  roll_number: '',
  exam_id: '',
  marks: '',
  comments: '',
};

const unwrap = payload => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
};

function TeacherPortalPage() {
  const [loginForm, setLoginForm] = useState(LOGIN_INITIAL);
  const [loginFeedback, setLoginFeedback] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [teacher, setTeacher] = useState(null);

  const [classes, setClasses] = useState([]);
  const [subjectsByClass, setSubjectsByClass] = useState({});
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState(RESULT_INITIAL);

  const [contextLoading, setContextLoading] = useState(false);
  const [dependentLoading, setDependentLoading] = useState(false);
  const [dependentError, setDependentError] = useState(null);

  const [resultFeedback, setResultFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSubjects = useMemo(() => subjectsByClass[form.class_id] ?? [], [subjectsByClass, form.class_id]);

  const resetPortal = () => {
    setTeacher(null);
    setClasses([]);
    setSubjectsByClass({});
    setStudents([]);
    setExams([]);
    setForm(RESULT_INITIAL);
    setResultFeedback(null);
    setLoginFeedback(null);
    setDependentError(null);
  };

  const handleLoginChange = event => {
    const { name, value } = event.target;
    setLoginForm(current => ({ ...current, [name]: value }));
  };

  const handleResultChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const loadTeacherContext = async teacherId => {
    if (!teacherId) return;
    try {
      setContextLoading(true);
      setDependentError(null);
      const [classPayload, subjectPayload] = await Promise.all([
        apiClient.get(endpoints.teacher.classes, { query: { teacher_id: teacherId } }),
        apiClient.get(endpoints.teacher.subjects, { query: { teacher_id: teacherId } }),
      ]);

      const teacherClasses = unwrap(classPayload)
        .filter(cls => cls?.id)
        .reduce((acc, cls) => {
          if (!acc.some(existing => existing.id === cls.id)) {
            acc.push({ id: cls.id, name: cls.name });
          }
          return acc;
        }, []);

      const subjectsMap = {};
      unwrap(subjectPayload).forEach(entry => {
        const classId = entry?.class?.id;
        if (!classId) return;
        subjectsMap[classId] = (entry.subjects ?? []).map(subject => ({
          id: subject.id,
          name: subject.name,
        }));
      });

      setClasses(teacherClasses);
      setSubjectsByClass(subjectsMap);

      const initialClassId = teacherClasses[0]?.id ?? '';
      setForm(current => ({
        ...current,
        class_id: initialClassId,
        subject_id: subjectsMap[initialClassId]?.[0]?.id ?? '',
        exam_id: '',
        student_id: '',
        roll_number: '',
        marks: '',
        comments: '',
      }));
    } catch (error) {
      setDependentError(error.message || 'Unable to load teacher assignments.');
    } finally {
      setContextLoading(false);
    }
  };

  const loadClassDependencies = async classId => {
    if (!classId || !teacher) {
      setStudents([]);
      setExams([]);
      return;
    }
    try {
      setDependentLoading(true);
      setDependentError(null);
      const [studentsPayload, examsPayload] = await Promise.all([
        apiClient.get(endpoints.teacher.students, { query: { class_id: classId } }),
        apiClient.get(endpoints.exams.list, { query: { class_id: classId } }),
      ]);

      const classStudents = unwrap(studentsPayload);
      const classExams = unwrap(examsPayload);

      setStudents(classStudents);
      setExams(classExams);

      setForm(current => ({
        ...current,
        student_id: classStudents.some(student => student.id === current.student_id)
          ? current.student_id
          : classStudents[0]?.id ?? '',
        exam_id: classExams.some(exam => exam.id === current.exam_id) ? current.exam_id : classExams[0]?.id ?? '',
      }));
    } catch (error) {
      setDependentError(error.message || 'Unable to load students or exams for this class.');
    } finally {
      setDependentLoading(false);
    }
  };

  useEffect(() => {
    if (teacher?.id) {
      loadTeacherContext(teacher.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher]);

  useEffect(() => {
    if (teacher?.id && form.class_id) {
      loadClassDependencies(form.class_id);
    } else {
      setStudents([]);
      setExams([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher, form.class_id]);

  useEffect(() => {
    setForm(current => {
      if (!current.class_id) {
        return current.subject_id ? { ...current, subject_id: '' } : current;
      }
      const subjects = subjectsByClass[current.class_id] ?? [];
      if (subjects.length === 0 && current.subject_id) {
        return { ...current, subject_id: '' };
      }
      if (subjects.length > 0 && !subjects.some(subject => subject.id === current.subject_id)) {
        return { ...current, subject_id: subjects[0].id };
      }
      return current;
    });
  }, [subjectsByClass, form.class_id]);

  const handleLoginSubmit = async event => {
    event.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password) {
      setLoginFeedback({ type: 'error', message: 'Email and password are required.' });
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginFeedback(null);
      const payload = {
        email: loginForm.email.trim().toLowerCase(),
        password: await hashPassword(loginForm.password),
      };
      const response = await apiClient.post(endpoints.teacher.login, { body: payload });
      const { data, message } = withMessage(response);
      const teacherRecord = Array.isArray(data) ? data[0] : data;
      if (!teacherRecord?.id) {
        throw new Error('Invalid login credentials');
      }

      setTeacher(teacherRecord);
      setLoginForm(LOGIN_INITIAL);
      setLoginFeedback({
        type: 'success',
        message: message || `Welcome back, ${teacherRecord.name?.split(' ')[0] ?? 'teacher'}!`,
      });
    } catch (error) {
      setLoginFeedback({
        type: 'error',
        message: error.message || 'Unable to login. Please try again.',
      });
      setTeacher(null);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResultSubmit = async event => {
    event.preventDefault();
    if (!teacher?.id) {
      setResultFeedback({ type: 'error', message: 'Login first to submit results.' });
      return;
    }
    if (!form.class_id || !form.exam_id || !form.subject_id) {
      setResultFeedback({ type: 'error', message: 'Class, exam, and subject are required.' });
      return;
    }
    if (!form.roll_number) {
      setResultFeedback({ type: 'error', message: 'Student roll number is required.' });
      return;
    }
    if (form.marks === '') {
      setResultFeedback({ type: 'error', message: 'Provide the marks obtained.' });
      return;
    }

    // Find student by roll number
    const student = students.find(s => s.roll_number === form.roll_number);
    if (!student) {
      setResultFeedback({ type: 'error', message: `No student found with roll number "${form.roll_number}" in this class.` });
      return;
    }

    const marksValue = Number(form.marks);
    if (Number.isNaN(marksValue)) {
      setResultFeedback({ type: 'error', message: 'Marks must be a number.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setResultFeedback(null);
      const payload = {
        student_id: student.id,
        exam_id: form.exam_id,
        subject_id: form.subject_id,
        marks: marksValue,
        comments: form.comments.trim() || null,
        teacher_id: teacher.id,
      };
      const response = await apiClient.post(endpoints.results.upsert, { body: payload });
      const { message } = withMessage(response);
      setResultFeedback({
        type: 'success',
        message: message || 'Result saved successfully.',
      });
      setForm(current => ({
        ...current,
        roll_number: '',
        marks: '',
        comments: '',
      }));
    } catch (error) {
      setResultFeedback({
        type: 'error',
        message: error.message || 'Unable to save result.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Teacher Portal"
        description="Teachers can log in, access their assigned classes, and submit exam results securely."
      />

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-5 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Teacher access</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your email and password to unlock the tools for your classes.
            </p>
          </div>

          {teacher ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <p className="font-semibold">{teacher.name}</p>
                <p className="text-emerald-800/80">{teacher.email}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-emerald-600">Logged in</p>
              </div>
              <button
                type="button"
                onClick={resetPortal}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/60"
              >
                Log out
              </button>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="teacher-login-email">
                  Email address<span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-login-email"
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="teacher@school.edu"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="teacher-login-password">
                  Password<span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-login-password"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {loginFeedback ? (
                <div
                  className={[
                    'rounded-lg border px-3 py-2 text-sm',
                    loginFeedback.type === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  ].join(' ')}
                >
                  {loginFeedback.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingIn ? 'Checking...' : 'Log in'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-8 space-y-5 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Submit exam results</h2>
              <p className="text-sm text-slate-500">
                Pick your class context, select the student, and record their scores.
              </p>
            </div>
            {contextLoading || dependentLoading ? (
              <span className="text-xs text-slate-500">{contextLoading ? 'Loading portal...' : 'Updating data...'}</span>
            ) : null}
          </div>

          {!teacher ? (
            <EmptyState title="Login required" description="Sign in to access your assigned classes and submit results." />
          ) : dependentError ? (
            <ErrorState message={dependentError} onRetry={() => loadClassDependencies(form.class_id)} />
          ) : classes.length === 0 ? (
            contextLoading ? (
              <LoadingState label="Loading classes" />
            ) : (
              <EmptyState title="No assignments" description="We couldn't find class assignments for your account." />
            )
          ) : (
            <form onSubmit={handleResultSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="portal-class">
                    Class<span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="portal-class"
                    name="class_id"
                    value={form.class_id}
                    onChange={handleResultChange}
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
                  <label className="text-sm font-medium text-slate-700" htmlFor="portal-exam">
                    Exam<span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="portal-exam"
                    name="exam_id"
                    value={form.exam_id}
                    onChange={handleResultChange}
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
                  <label className="text-sm font-medium text-slate-700" htmlFor="portal-subject">
                    Subject<span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="portal-subject"
                    name="subject_id"
                    value={form.subject_id}
                    onChange={handleResultChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">Select subject</option>
                    {availableSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="portal-roll">
                    Roll Number<span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="portal-roll"
                    name="roll_number"
                    value={form.roll_number || ''}
                    onChange={handleResultChange}
                    placeholder="e.g., 101"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="portal-marks">
                    Marks<span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="portal-marks"
                    name="marks"
                    value={form.marks}
                    onChange={handleResultChange}
                    placeholder="e.g., 88"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

              
              </div>

              {resultFeedback ? (
                <div
                  className={[
                    'rounded-lg border px-3 py-2 text-sm',
                    resultFeedback.type === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  ].join(' ')}
                >
                  {resultFeedback.message}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm(current => ({
                      ...current,
                      roll_number: '',
                      marks: '',
                      comments: '',
                    }))
                  }
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/60"
                >
                  Clear fields
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Submit result'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default TeacherPortalPage;

