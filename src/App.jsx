import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ClassesPage from './pages/Classes.jsx';
import SubjectsPage from './pages/Subjects.jsx';
import TeachersPage from './pages/Teachers.jsx';
import StudentsPage from './pages/Students.jsx';
import ExamsPage from './pages/Exams.jsx';
import AssignmentsPage from './pages/Assignments.jsx';
import ResultsPage from './pages/Results.jsx';
import PublicResultsPage from './pages/PublicResults.jsx';
import TeacherPortalPage from './pages/TeacherPortal.jsx';
import NotFoundPage from './pages/NotFound.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/public-results" element={<PublicResultsPage />} />
        <Route path="/teacher-portal" element={<TeacherPortalPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
