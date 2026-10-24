import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import {
  Users, BookOpen, Building2, CalendarDays, GraduationCap,
  LayoutDashboard, Download, AlertTriangle, CheckCircle2, TrendingUp, BarChart3
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const res = await apiService.admin.getAnalytics()
      setAnalytics(res.data?.data || null)
    } catch {
      setError('Failed to load comprehensive analytics data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(type, filename) {
    try {
      setDownloading(type)
      let res
      if (type === 'enrollment') res = await apiService.admin.downloadEnrollmentsCsv()
      else if (type === 'occupancy') res = await apiService.admin.downloadOccupancyCsv()
      else if (type === 'students') res = await apiService.admin.downloadStudentsCsv()

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setError(`Failed to download ${filename}`)
    } finally {
      setDownloading(null)
    }
  }

  const summary = analytics?.summary || {}
  const statusBreakdown = analytics?.statusBreakdown || {}
  const departmentStats = analytics?.departmentStats || []
  const offeringOccupancy = analytics?.offeringOccupancy || []

  const quickLinks = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', color: '#2563eb' },
    { label: 'Manage Faculty', icon: Users, path: '/admin/faculty', color: '#10b981' },
    { label: 'Manage Courses', icon: BookOpen, path: '/admin/courses', color: '#8b5cf6' },
    { label: 'Course Offerings', icon: LayoutDashboard, path: '/admin/offerings', color: '#0891b2' },
    { label: 'Departments', icon: Building2, path: '/admin/departments', color: '#f59e0b' },
    { label: 'Semesters', icon: CalendarDays, path: '/admin/semesters', color: '#ef4444' }
  ]

  // Top 5 most full offerings
  const topFullOfferings = offeringOccupancy.slice(0, 6)

  if (loading) return <LoadingSpinner message="Calculating university enrollment analytics..." />

  return (
    <div className="page-content admin-dashboard">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">University Administration & Analytics</h1>
          <p className="page-subtitle">Real-time enrollment metrics, seat occupancy statistics, and report generation.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownload('enrollment', 'enrollment_report.csv')}
            disabled={downloading === 'enrollment'}
          >
            <Download size={14} /> {downloading === 'enrollment' ? 'Exporting...' : 'Enrollments CSV'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownload('occupancy', 'seat_occupancy_report.csv')}
            disabled={downloading === 'occupancy'}
          >
            <Download size={14} /> {downloading === 'occupancy' ? 'Exporting...' : 'Occupancy CSV'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownload('students', 'students_directory.csv')}
            disabled={downloading === 'students'}
          >
            <Download size={14} /> {downloading === 'students' ? 'Exporting...' : 'Students CSV'}
          </button>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {/* Top Level Metric Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
            <GraduationCap size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary.totalStudents ?? '—'}</div>
            <div className="stat-label">Total Enrolled Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary.totalFaculty ?? '—'}</div>
            <div className="stat-label">Faculty Instructors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary.totalCourses ?? '—'}</div>
            <div className="stat-label">Total Courses Catalogued</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary.overallOccupancyRate ?? 0}%</div>
            <div className="stat-label">Overall Seat Occupancy</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Department Enrollment Bar Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--blue)" /> Department Student Distribution
            </h2>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Students per dept</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {departmentStats.map((dept, i) => {
              const maxStudent = Math.max(1, ...departmentStats.map(d => d.studentCount || 0))
              const pct = Math.round(((dept.studentCount || 0) / maxStudent) * 100)
              const colors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899']
              const color = colors[i % colors.length]

              return (
                <div key={dept.deptId || i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                    <span>{dept.deptName}</span>
                    <span style={{ color }}>{dept.studentCount} Students ({dept.offeringCount} Offerings)</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Registration Status Breakdown & Capacity Meter */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="var(--success)" /> Enrollment Status & Capacity
            </h2>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Total: {summary.totalRegistrations}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1e40af' }}>{statusBreakdown.REGISTERED || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>Active</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>{statusBreakdown.COMPLETED || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', textTransform: 'uppercase' }}>Completed</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#64748b' }}>{statusBreakdown.DROPPED || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Dropped</div>
            </div>
          </div>

          <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>University-Wide Seat Utilization</span>
              <strong>{summary.totalEnrolledSeats} / {summary.totalCapacity} Seats</strong>
            </div>
            <div style={{ height: 12, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, summary.overallOccupancyRate || 0)}%`,
                  background: (summary.overallOccupancyRate || 0) >= 90 ? 'var(--error)' : 'var(--blue)',
                  borderRadius: 99
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-600)', marginTop: 6 }}>
              <span>{summary.fullOfferingsCount || 0} Offerings Full</span>
              <span>{summary.nearFullOfferingsCount || 0} Near Capacity (&gt;=80%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offering Seat Occupancy Table */}
      <div className="card" style={{ padding: 0, marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Course Offering Seat Occupancy & Capacity</h2>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '2px 0 0' }}>Highest demand course offerings ranked by capacity utilization.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/offerings')}>
            Manage All Offerings
          </button>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Offering ID</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Schedule</th>
                <th>Occupancy Rate</th>
                <th>Enrolled / Max Seats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topFullOfferings.map(o => {
                const color = o.occupancyRate >= 90 ? 'var(--error)' : o.occupancyRate >= 60 ? 'var(--warning)' : 'var(--success)'
                return (
                  <tr key={o.offeringId}>
                    <td style={{ fontFamily: 'monospace' }}>#{o.offeringId}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.courseName}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                        <span className="badge badge-navy" style={{ padding: '1px 5px', fontSize: 10 }}>{o.courseId}</span>
                        <span style={{ marginLeft: 6 }}>{o.departmentName}</span>
                      </div>
                    </td>
                    <td>{o.facultyName}</td>
                    <td>{o.schedule}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, fontWeight: 600, color }}>
                        <span>{o.occupancyRate}%</span>
                        <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>{o.availableSeats} left</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, o.occupancyRate)}%`, background: color }} />
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.registeredCount} / {o.maxSeats}</td>
                    <td>
                      <span className={`badge ${o.status === 'FULL' ? 'badge-error' : o.status === 'NEAR_FULL' ? 'badge-warning' : 'badge-success'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Navigation Grid */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Administrative Actions</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 0 0.5rem' }}>
          {quickLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                padding: '1.25rem', border: '2px solid var(--gray-200)', borderRadius: '12px',
                background: 'var(--gray-50)', cursor: 'pointer', transition: 'all 0.2s',
                color: 'var(--gray-700)', fontWeight: 600, fontSize: '0.9rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = link.color; e.currentTarget.style.background = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${link.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.color }}>
                <link.icon size={24} />
              </div>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
