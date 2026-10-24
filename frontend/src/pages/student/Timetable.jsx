import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import { parseSchedule } from '../../utils/schedule.js'
import { Calendar, Clock, Printer, BookOpen, AlertCircle } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

const COLOR_PALETTE = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', badge: '#dbeafe' },
  { bg: '#f0fdf4', border: '#22c55e', text: '#166534', badge: '#dcfce7' },
  { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8', badge: '#f3e8ff' },
  { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#fef3c7' },
  { bg: '#fdf2f8', border: '#ec4899', text: '#9d174d', badge: '#fce7f3' },
  { bg: '#f0fdfa', border: '#14b8a6', text: '#115e59', badge: '#ccfbf1' },
  { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: '#fee2e2' },
]

export default function Timetable() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSem, setSelectedSem] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const regNo = user?.regNo || user?.id

  useEffect(() => {
    if (!regNo) return
    setLoading(true)
    Promise.all([
      apiService.registrations.getByStudent(regNo),
      apiService.semesters.getAll()
    ]).then(([rRes, sRes]) => {
      const regList = Array.isArray(rRes.data?.data) ? rRes.data.data : []
      const semList = Array.isArray(sRes.data?.data) ? sRes.data.data : []
      setRegistrations(regList)
      setSemesters(semList)

      const active = semList.find(s => s.isActive || s.is_active)
      if (active) {
        setSelectedSem(String(active.semesterId || active.id))
      } else if (semList.length > 0) {
        setSelectedSem(String(semList[0].semesterId || semList[0].id))
      }
    }).catch(() => setError('Failed to load schedule data.'))
      .finally(() => setLoading(false))
  }, [regNo])

  // Filter registrations for active/registered in the selected semester
  const activeRegistrations = registrations.filter(r => {
    if (r.status !== 'REGISTERED') return false
    if (!selectedSem) return true
    return String(r.semesterId) === selectedSem || String(r.offering?.semester?.semesterId) === selectedSem
  })

  // Assign a consistent color to each unique course
  const courseColorMap = {}
  activeRegistrations.forEach((r, idx) => {
    if (!courseColorMap[r.courseId]) {
      courseColorMap[r.courseId] = COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }
  })

  // Build grid events
  const dayEvents = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }
  const unscheduledCourses = []

  activeRegistrations.forEach(reg => {
    const parsed = parseSchedule(reg.schedule)
    if (!parsed) {
      unscheduledCourses.push(reg)
      return
    }

    parsed.days.forEach(day => {
      if (dayEvents[day]) {
        dayEvents[day].push({
          registration: reg,
          startMin: parsed.startMinutes,
          endMin: parsed.endMinutes,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          color: courseColorMap[reg.courseId] || COLOR_PALETTE[0]
        })
      }
    })
  })

  // Sort events by start time
  Object.keys(dayEvents).forEach(d => {
    dayEvents[d].sort((a, b) => a.startMin - b.startMin)
  })

  const totalCredits = activeRegistrations.reduce((sum, r) => sum + (r.credits || 0), 0)

  return (
    <div className="timetable-page">
      <div className="page-header-row no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Academic Timetable</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: 4 }}>
            Visual weekly lecture schedule and room details.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="filter-select"
            value={selectedSem}
            onChange={e => setSelectedSem(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s.semesterId || s.id} value={String(s.semesterId || s.id)}>
                {s.name || s.semesterName} {s.isActive ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={15} /> Print Timetable
          </button>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {/* Summary Bar */}
      <div className="card timetable-summary-bar no-print" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Enrolled Courses</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>{activeRegistrations.length}</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--gray-200)' }} />
          <div>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Total Credits</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{totalCredits} cr</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--gray-200)' }} />
          <div>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Semester Limit</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-700)' }}>20 cr max</div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Building timetable..." />
      ) : activeRegistrations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No Scheduled Classes</h3>
            <p>You have no active course registrations for the selected semester.</p>
            <Link to="/student/register" className="btn btn-primary" style={{ marginTop: 12 }}>
              <BookOpen size={15} /> Register for Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="card timetable-card" style={{ padding: 0, overflowX: 'auto' }}>
          <div className="timetable-grid-wrapper">
            <div className="timetable-header-row">
              <div className="timetable-time-corner">Time</div>
              {DAYS.map(day => (
                <div key={day} className="timetable-day-header">
                  {day}day
                </div>
              ))}
            </div>

            <div className="timetable-body">
              {HOURS.map(hour => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`
                return (
                  <div key={hour} className="timetable-hour-row">
                    <div className="timetable-time-cell">
                      <Clock size={11} style={{ opacity: 0.6 }} />
                      <span>{hourFormatted}</span>
                    </div>
                    {DAYS.map(day => {
                      // Find events that start in this hour slot
                      const slotEvents = dayEvents[day].filter(e => {
                        const startH = Math.floor(e.startMin / 60)
                        return startH === hour
                      })

                      return (
                        <div key={day} className="timetable-cell">
                          {slotEvents.map((evt, idx) => {
                            const durationMinutes = evt.endMin - evt.startMin
                            const heightPx = Math.max(54, (durationMinutes / 60) * 60 - 6)

                            return (
                              <div
                                key={idx}
                                className="timetable-event-block"
                                style={{
                                  backgroundColor: evt.color.bg,
                                  borderColor: evt.color.border,
                                  color: evt.color.text,
                                  minHeight: `${heightPx}px`
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{evt.registration.courseId}</span>
                                  <span style={{ fontSize: 11, opacity: 0.8 }}>{evt.registration.credits} cr</span>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 4px', lineHeight: 1.2 }}>
                                  {evt.registration.courseName}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={10} />
                                  <span>{evt.startTime} - {evt.endTime}</span>
                                </div>
                                {evt.registration.facultyName && (
                                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                                    👤 {evt.registration.facultyName}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {unscheduledCourses.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--navy)', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>Courses with Flexible / TBA Schedule ({unscheduledCourses.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {unscheduledCourses.map(r => (
              <div key={r.regId} style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                <div style={{ fontWeight: 600 }}>{r.courseName} ({r.courseId})</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>
                  Faculty: {r.facultyName || 'TBA'} • Credits: {r.credits}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
