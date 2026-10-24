import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'

import LoginPage from './pages/LoginPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

import StudentLayout from './components/layout/StudentLayout.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import CourseCatalogue from './pages/student/CourseCatalogue.jsx'
import CourseRegistration from './pages/student/CourseRegistration.jsx'
import MyRegistrations from './pages/student/MyRegistrations.jsx'
import Timetable from './pages/student/Timetable.jsx'

import FacultyLayout from './components/layout/FacultyLayout.jsx'
import FacultyDashboard from './pages/faculty/FacultyDashboard.jsx'
import FacultyOfferings from './pages/faculty/FacultyOfferings.jsx'
import GradeManagement from './pages/faculty/GradeManagement.jsx'

import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminStudents from './pages/admin/AdminStudents.jsx'
import AdminFaculty from './pages/admin/AdminFaculty.jsx'
import AdminCourses from './pages/admin/AdminCourses.jsx'
import AdminDepartments from './pages/admin/AdminDepartments.jsx'
import AdminSemesters from './pages/admin/AdminSemesters.jsx'
import AdminOfferings from './pages/admin/AdminOfferings.jsx'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user || !localStorage.getItem('ucrs_token')) {
    return <Navigate to="/login" replace />
  }
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/about" element={<AboutPage />} />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<CourseCatalogue />} />
        <Route path="register" element={<CourseRegistration />} />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="timetable" element={<Timetable />} />
      </Route>

      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute role="faculty">
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="offerings" element={<FacultyOfferings />} />
        <Route path="grades" element={<GradeManagement />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="faculty" element={<AdminFaculty />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="offerings" element={<AdminOfferings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
