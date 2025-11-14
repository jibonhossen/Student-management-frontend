import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { apiClient, endpoints } from '../services/apiClient.js';

const UpcomingExamIcon = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M4 9h16M5 5h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zm5 7h4" />
  </svg>
);

const RecentResultIcon = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h15v13.5h-15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75l2.25 2.25 4.5-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75h9" />
  </svg>
);

const TeacherLoadIcon = props => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a3 3 0 110-6 3 3 0 010 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21.75a7.5 7.5 0 1115 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 21.75V18a6 6 0 016-6 6 6 0 016 6v3.75" />
  </svg>
);

function formatDate(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(endpoints.debug.data);
      setData(response?.data ?? {});
    } catch (err) {
      setError(err.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    if (!data) {
      return {
        classes: 0,
        subjects: 0,
        teachers: 0,
        students: 0,
        exams: 0,
        assignments: 0,
        results: 0,
      };
    }

    const classes = data.classes?.length ?? 0;
    const subjects = data.subjects?.length ?? 0;
    const teachers = data.teachers?.length ?? 0;
    const students = data.students?.length ?? 0;
    const exams = data.exams?.length ?? 0;
    const assignments = data.teacher_assignments?.length ?? 0;
    const results = data.results?.length ?? 0;

    return { classes, subjects, teachers, students, exams, assignments, results };
  }, [data]);

  const referenceMaps = useMemo(() => {
    if (!data) return {};

    const classes = new Map((data.classes ?? []).map(entry => [entry.id, entry]));
    const subjects = new Map((data.subjects ?? []).map(entry => [entry.id, entry]));
    const teachers = new Map((data.teachers ?? []).map(entry => [entry.id, entry]));
    const students = new Map((data.students ?? []).map(entry => [entry.id, entry]));
    const exams = new Map((data.exams ?? []).map(entry => [entry.id, entry]));

    return { classes, subjects, teachers, students, exams };
  }, [data]);

  const upcomingExams = useMemo(() => {
    if (!data?.exams) return [];

    const now = new Date();

    return [...data.exams]
      .filter(exam => {
        if (!exam.exam_date) return false;
        const date = new Date(exam.exam_date);
        if (Number.isNaN(date.getTime())) return false;
        return date >= now;
      })
      .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
      .slice(0, 5)
      .map(exam => ({
        ...exam,
        className: referenceMaps.classes?.get(exam.class_id)?.name ?? 'Unknown class',
      }));
  }, [data?.exams, referenceMaps.classes]);

  const recentResults = useMemo(() => {
    if (!data?.results) return [];

    const records = data.results
      .map(result => {
        const subject = referenceMaps.subjects?.get(result.subject_id);
        const student = referenceMaps.students?.get(result.student_id);
        const exam = referenceMaps.exams?.get(result.exam_id);
        const className = exam ? referenceMaps.classes?.get(exam.class_id)?.name : null;

        return {
          id: result.id,
          subject: subject?.name ?? 'Unknown subject',
          student: student?.name ?? 'Unknown student',
          marks: result.marks,
          grade: result.grade ?? '—',
          updatedAt: result.updated_at ?? result.created_at ?? null,
          examName: exam?.name ?? 'Exam',
          className: className ?? 'Class',
        };
      })
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    return records;
  }, [data?.results, referenceMaps]);

  const teacherLoads = useMemo(() => {
    if (!data?.teacher_assignments) return [];

    const assignmentCount = new Map();
    data.teacher_assignments.forEach(entry => {
      if (!entry.teacher_id) return;
      assignmentCount.set(entry.teacher_id, (assignmentCount.get(entry.teacher_id) ?? 0) + 1);
    });

    return Array.from(assignmentCount.entries())
      .map(([teacherId, count]) => ({
        teacherId,
        count,
        teacherName: referenceMaps.teachers?.get(teacherId)?.name ?? 'Unknown teacher',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data?.teacher_assignments, referenceMaps.teachers]);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="Loading your school's pulse..." />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Insight across classes, teachers, and results"
        />
        <ErrorState message={error} onRetry={loadDashboard} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Monitor classes, track exams, and keep an eye on performance metrics"
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Total Classes" value={summary.classes} helper="Across all grades" />
        <SummaryCard title="Subjects" value={summary.subjects} helper="Core & elective" />
        <SummaryCard title="Teachers" value={summary.teachers} helper="Active faculty" />
        <SummaryCard title="Students" value={summary.students} helper="Enrolled learners" />
        <SummaryCard title="Upcoming Exams" value={upcomingExams.length} helper="Scheduled" icon={UpcomingExamIcon} />
        <SummaryCard title="Recent Results" value={recentResults.length} helper="Last submissions" icon={RecentResultIcon} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming exams</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <UpcomingExamIcon className="h-4 w-4" />
              <span>Stay prepared</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Exams sorted by date across all classes
          </p>

          <div className="mt-5 space-y-4">
            {upcomingExams.length === 0 ? (
              <EmptyState
                title="No exams scheduled"
                description="Create exam schedules to keep everyone aligned."
              />
            ) : (
              upcomingExams.map(exam => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{exam.name}</p>
                    <p className="text-xs text-slate-500">{exam.className}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatDate(exam.exam_date)}</p>
                    <p className="text-xs text-slate-500">Exam date</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Teacher workloads</h2>
            <TeacherLoadIcon className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Assignments per teacher across classes and subjects
          </p>

          <div className="mt-5 space-y-4">
            {teacherLoads.length === 0 ? (
              <EmptyState
                title="No assignments recorded"
                description="Assign teachers to classes to balance workloads."
              />
            ) : (
              teacherLoads.map(entry => (
                <div
                  key={entry.teacherId}
                  className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{entry.teacherName}</p>
                    <p className="text-xs text-slate-500">Assignments</p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {entry.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Latest results</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RecentResultIcon className="h-4 w-4" />
            <span>Most recent submissions</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Track newly updated grades to confirm accuracy and follow up quickly.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/60">
          {recentResults.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="Record exam results to see them here immediately."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Exam</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium text-right">Marks</th>
                    <th className="px-4 py-3 font-medium text-right">Grade</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 bg-white/90">
                  {recentResults.map(result => (
                    <tr key={result.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{result.student}</td>
                      <td className="px-4 py-3">{result.subject}</td>
                      <td className="px-4 py-3">{result.examName}</td>
                      <td className="px-4 py-3">{result.className}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{result.marks}</td>
                      <td className="px-4 py-3 text-right">{result.grade}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {result.updatedAt ? formatDate(result.updatedAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

