import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import { BookOpen, Users, Calendar, Award, ChevronRight } from 'lucide-react'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [offerings, setOfferings] = useState([])
  const [facultyInfo, setFacultyInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [offeringsRes, facultyRes] = await Promise.all([
          apiService.offerings.getAll({ facultyId: user?.facultyId || user?.id }),
          apiService.faculty.getById(user?.facultyId || user?.id)
        ])
        const offeringsData = offeringsRes.data?.data || offeringsRes.data || []
        setOfferings(Array.isArray(offeringsData) ? offeringsData : [])
        const fData = facultyRes.data?.data || facultyRes.data
        // Unwrap if backend returns { faculty: {...}, offerings: [...] }
        const actualFaculty = (fData && fData.faculty && typeof fData.faculty === 'object')
          ? fData.faculty
          : fData
        setFacultyInfo(actualFaculty)
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const totalStudents = offerings.reduce((sum, o) => sum + (o.registeredCount || o.enrolledCount || 0), 0)
  const activeSemester = offerings.find(o => o.semester?.isActive === 'Y' || o.semester?.isActive === true)?.semester?.semesterName || 'N/A'

  if (loading) return <LoadingSpinner message="Loading faculty dashboard..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {facultyInfo ? `${facultyInfo.firstName} ${facultyInfo.lastName}` : user?.name} •{' '}
            {facultyInfo?.designation || 'Faculty'}
          </p>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{offerings.length}</div>
            <div className="stat-label">Total Offerings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">Students Enrolled</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeSemester}</div>
            <div className="stat-label">Active Semester</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <Award size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{facultyInfo?.department?.deptName || 'N/A'}</div>
            <div className="stat-label">Department</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Course Offerings</h2>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/faculty/offerings')}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        {offerings.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No course offerings assigned yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Schedule</th>
                  <th>Enrolled</th>
                  <th>Max Seats</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((offering) => (
                  <tr key={offering.offeringId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{offering.course?.courseName || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{offering.course?.courseId}</div>
                    </td>
                    <td>{offering.semester?.semesterName || 'N/A'}</td>
                    <td>{offering.schedule || '—'}</td>
                    <td>
                      <span className="badge badge-info">{offering.registeredCount || offering.enrolledCount || 0}</span>
                    </td>
                    <td>{offering.maxSeats || 60}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/faculty/grades')}
                      >
                        Grades
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
