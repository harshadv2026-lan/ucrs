import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import RegistrationSlip from '../../components/common/RegistrationSlip.jsx'
import {
  BookOpen, ClipboardList, GraduationCap, Star,
  ArrowRight, User, Building2, CalendarDays, Clock, FileText, CheckCircle
} from 'lucide-react'

const MAX_CREDITS = 20

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [credits, setCredits] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [error, setError] = useState('')
  const [showSlip, setShowSlip] = useState(false)

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

  const currentCredits = credits !== null ? credits : registered.reduce((s, r) => s + (r.credits || 0), 0)
  const creditPct = Math.min(100, Math.round((currentCredits / MAX_CREDITS) * 100))

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
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Welcome back, {student ? `${student.firstName}` : (user?.name || 'Student')} 👋</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: 4 }}>
            Here is your academic overview, schedule, and registration status for this semester.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSlip(true)}
            disabled={registered.length === 0}
          >
            <FileText size={15} /> Confirmation Slip
          </button>
          <Link to="/student/timetable" className="btn btn-secondary">
            <CalendarDays size={15} /> Timetable
          </Link>
          <Link to="/student/register" className="btn btn-primary">
            <ClipboardList size={15} /> Course Registration
          </Link>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {/* Student Profile Card */}
      {loadingStudent ? (
        <div className="card" style={{ marginBottom: 24 }}><LoadingSpinner message="Loading profile..." /></div>
      ) : student ? (
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-card-icon blue" style={{ width: 56, height: 56 }}>
                <User size={26} />
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)' }}>
                  {`${student.firstName || ''} ${student.lastName || ''}`.trim() || user?.name}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: 13, marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-navy">{regNo}</span>
                  <span>•</span>
                  <span>{student.email}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {(student.department?.deptName || student.departmentName) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-700)', fontSize: 13, fontWeight: 500 }}>
                  <Building2 size={16} color="var(--blue)" />
                  <span>{student.department?.deptName || student.departmentName}</span>
                </div>
              )}
              {(student.semesterNo || student.semesterName) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-700)', fontSize: 13, fontWeight: 500 }}>
                  <CalendarDays size={16} color="var(--success)" />
                  <span>{student.semesterNo ? `Semester ${student.semesterNo}` : student.semesterName}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="badge badge-success" style={{ fontSize: 12 }}>Active Enrolment</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Credit Load & Academic Statistics Cards */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><BookOpen size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : registered.length}</div>
          <div className="stat-card-label">Active Courses</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green"><GraduationCap size={22} /></div>
          <div className="stat-card-value">{credits !== null ? credits : '—'}</div>
          <div className="stat-card-label">Total Credits (Max 20)</div>
          <div style={{ marginTop: 8, height: 4, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${creditPct}%`, background: creditPct >= 90 ? 'var(--warning)' : 'var(--success)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple"><ClipboardList size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : completed.length}</div>
          <div className="stat-card-label">Completed Courses</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon amber"><Star size={22} /></div>
          <div className="stat-card-value">{loadingRegs ? '—' : gpa}</div>
          <div className="stat-card-label">Cumulative GPA</div>
        </div>
      </div>

      {/* Active Weekly Schedule Snapshot */}
      {registered.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--blue)" /> Weekly Schedule Snapshot
            </h2>
            <Link to="/student/timetable" style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
              Open Full Timetable <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {registered.map(r => (
              <div key={r.regId} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-navy" style={{ fontSize: 11 }}>{r.courseId}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)' }}>{r.credits} Credits</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{r.courseName}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> {r.schedule || 'TBA'}
                </div>
                {r.facultyName && (
                  <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                    Instructor: {r.facultyName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Registrations Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Course Registrations</h2>
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
            <p>You haven't registered for any courses this semester.</p>
            <Link to="/student/register" className="btn btn-primary" style={{ marginTop: 12 }}>
              Browse Available Courses
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Course Code & Title</th>
                  <th>Faculty</th>
                  <th>Schedule</th>
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
                      <div style={{ fontSize: 11.5, color: 'var(--gray-600)' }}>
                        <span className="badge badge-navy" style={{ padding: '1px 6px', fontSize: 10 }}>{reg.courseId}</span>
                        <span style={{ marginLeft: 6 }}>{reg.credits} cr</span>
                      </div>
                    </td>
                    <td>{reg.facultyName || '—'}</td>
                    <td>{reg.schedule || '—'}</td>
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

      {/* Confirmation Slip Modal */}
      <RegistrationSlip
        isOpen={showSlip}
        onClose={() => setShowSlip(false)}
        student={student}
        registrations={registrations}
        credits={credits}
      />
    </div>
  )
}
