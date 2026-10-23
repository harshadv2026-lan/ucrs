import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import { Users, BookOpen, Building2, CalendarDays, GraduationCap, LayoutDashboard } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const res = await apiService.admin ? apiService.admin.getStats() : null
        // Fallback: fetch counts individually
        const [stuRes, facRes, crsRes, depRes] = await Promise.all([
          apiService.students.getAll(),
          apiService.faculty.getAll(),
          apiService.courses.getAll(),
          apiService.departments.getAll()
        ])
        setStats({
          students: (stuRes.data?.data || stuRes.data || []).length,
          faculty: (facRes.data?.data || facRes.data || []).length,
          courses: (crsRes.data?.data || crsRes.data || []).length,
          departments: (depRes.data?.data || depRes.data || []).length
        })
      } catch {
        setError('Failed to load dashboard statistics.')
        setStats({ students: '—', faculty: '—', courses: '—', departments: '—' })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const quickLinks = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', color: '#2563eb' },
    { label: 'Manage Faculty', icon: Users, path: '/admin/faculty', color: '#10b981' },
    { label: 'Manage Courses', icon: BookOpen, path: '/admin/courses', color: '#8b5cf6' },
    { label: 'Departments', icon: Building2, path: '/admin/departments', color: '#f59e0b' },
    { label: 'Semesters', icon: CalendarDays, path: '/admin/semesters', color: '#ef4444' },
    { label: 'Course Offerings', icon: LayoutDashboard, path: '/admin/offerings', color: '#0891b2' }
  ]

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">University Course Registration System — Administration</p>
        </div>
      </div>

      {error && <AlertMessage type="warning" message={error} onClose={() => setError('')} />}

      <div className="stats-grid">
        {[
          { label: 'Total Students', value: stats?.students, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: GraduationCap },
          { label: 'Total Faculty', value: stats?.faculty, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Users },
          { label: 'Total Courses', value: stats?.courses, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: BookOpen },
          { label: 'Departments', value: stats?.departments, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Building2 }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{s.value ?? '—'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem', padding: '1rem 0 0.5rem' }}>
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
