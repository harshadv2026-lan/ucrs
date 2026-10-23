import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import {
  BookOpen, ClipboardList, GraduationCap, Star,
  ArrowRight, User, Building2, CalendarDays
} from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [credits, setCredits] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [error, setError] = useState('')

  const regNo = user?.regNo || user?.id

  useEffect(() => {
    if (!regNo) return
    apiService.students.getById(regNo)
      .then(r => setStudent(r.data?.data || r.data))
      .catch(() => setError('Failed to load student profile.'))
      .finally(() => setLoadingStudent(false))

    apiService.registrations.getByStudent(regNo)
      .then(r => {
        const data = r.data?.data || r.data || []
        setRegistrations(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoadingRegs(false))

    apiService.registrations.getCredits(regNo)
      .then(r => {
        const raw = r.data?.data
        if (raw && typeof raw === 'object') setCredits(raw.totalCredits ?? 0)
        else setCredits(raw ?? r.data?.credits ?? 0)
      })
      .catch(() => setCredits(0))
  }, [regNo])

  const registered = registrations.filter(r => r.status === 'REGISTERED')
  const completed = registrations.filter(r => r.status === 'COMPLETED')
  const recent = [...registrations].slice(0, 5)

  const gpa = completed.length > 0
    ? (() => {
        const gradePoints = { 'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0 }
        const graded = completed.filter(r => r.grade && gradePoints[r.grade] !== undefined)
        if (!graded.length) return 'N/A'
        const total = graded.reduce((sum, r) => sum + (gradePoints[r.grade] ?? 0), 0)
        return (total / graded.length).toFixed(2)
      })()
    : 'N/A'

  const statusBadge = (status) => {
    const map = { REGISTERED: 'info', COMPLETED: 'success', DROPPED: 'gray' }
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name || 'Student'} 👋</h1>
        <p>Here's your academic overview for this semester.</p>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {loadingStudent ? (
        <div className="card" style={{ marginBottom: 24 }}><LoadingSpinner message="Loading profile..." /></div>
      ) : student ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="stat-card-icon blue" style={{ width: 52, height: 52 }}>
                <User size={24} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{`${student.firstName || ''} ${student.lastName || ''}`.trim() || user?.name}</div>
                <div style={{ color: 'var(--gray-600)', fontSize: 13 }}>
                  <span className="badge badge-navy" style={{ marginRight: 6 }}>{regNo}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {(student.department?.deptName || student.departmentName) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)', fontSize: 13 }}>
                  <Building2 size={14} />
                  <span>{student.department?.deptName || student.departmentName}</span>
                </div>
              )}
              {(student.semesterNo || student.semesterName) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)', fontSize: 13 }}>
                  <CalendarDays size={14} />
                  <span>{student.semesterNo ? `Semester ${student.semesterNo}` : student.semesterName}</span>
                </div>
              )}
              {student.email && (
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{student.email}</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon blue"><BookOpen size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : registered.length}</div>
          <div className="stat-card-label">Registered Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><GraduationCap size={22} /></div>
          <div className="stat-card-value">{credits !== null ? credits : '—'}</div>
          <div className="stat-card-label">Total Credits</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><ClipboardList size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : completed.length}</div>
          <div className="stat-card-label">Completed Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><Star size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : gpa}</div>
          <div className="stat-card-label">GPA</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Registrations</h2>
        <Link to="/student/my-registrations" className="btn btn-secondary btn-sm">
          View All <ArrowRight size={13} />
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loadingRegs ? (
          <LoadingSpinner message="Loading registrations..." />
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={40} />
            <h3>No Registrations Yet</h3>
            <p>You haven't registered for any courses.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(reg => (
                  <tr key={reg.registrationId || reg.regId || reg.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{reg.courseName || reg.courseId}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{reg.courseId}</div>
                    </td>
                    <td>{reg.facultyName || '—'}</td>
                    <td>{reg.semesterName || '—'}</td>
                    <td>{statusBadge(reg.status)}</td>
                    <td>{reg.grade ? <span className="badge badge-purple">{reg.grade}</span> : <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/student/courses" className="btn btn-primary">
          <BookOpen size={16} /> Browse Courses
        </Link>
        <Link to="/student/register" className="btn btn-secondary">
          <ClipboardList size={16} /> Register for Courses
        </Link>
      </div>
    </div>
  )
}
