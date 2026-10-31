import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { findConflictingRegistration } from '../../utils/schedule.js'
import { ClipboardList, Check, Users, Calendar, AlertTriangle, BookOpen, Clock, RotateCcw } from 'lucide-react'

const MAX_SEMESTER_CREDITS = 20

export default function CourseRegistration() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState([])
  const [semesters, setSemesters] = useState([])
  const [departments, setDepartments] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSem, setFilterSem] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [search, setSearch] = useState('')
  const [hideFull, setHideFull] = useState(false)
  const [registering, setRegistering] = useState(null)
  const [alert, setAlert] = useState(null)

  const regNo = user?.regNo || user?.id || ''

  async function loadData() {
    setLoading(true)
    try {
      const [oRes, sRes, dRes] = await Promise.all([
        apiService.offerings.getAll(filterSem ? { semesterId: filterSem } : {}),
        apiService.semesters.getAll(),
        apiService.departments.getAll()
      ])

      const offData = Array.isArray(oRes.data?.data) ? oRes.data.data : (Array.isArray(oRes.data) ? oRes.data : [])
      setOfferings(offData)

      const sems = Array.isArray(sRes.data?.data) ? sRes.data.data : (Array.isArray(sRes.data) ? sRes.data : [])
      setSemesters(sems)

      const depts = Array.isArray(dRes.data?.data) ? dRes.data.data : (Array.isArray(dRes.data) ? dRes.data : [])
      setDepartments(depts)

      if (!filterSem && sems.length > 0) {
        const active = sems.find(sem => sem.isActive === true || sem.isActive === 'Y' || sem.is_active)
        if (active) {
          setFilterSem(String(active.semesterId || active.id))
        }
      }

      if (regNo) {
        try {
          const rRes = await apiService.registrations.getByStudent(regNo)
          const regData = Array.isArray(rRes.data?.data) ? rRes.data.data : (Array.isArray(rRes.data) ? rRes.data : [])
          setMyRegistrations(regData)
        } catch {
          setMyRegistrations([])
        }
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load course offerings. Please check your connection and refresh.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [regNo, filterSem])

  function resetFilters() {
    setFilterSem('')
    setFilterDept('')
    setSearch('')
    setHideFull(false)
  }

  // Active registered courses in the chosen semester
  const activeRegistrationsInSem = myRegistrations.filter(r => {
    if (r.status !== 'REGISTERED') return false
    if (!filterSem) return true
    return String(r.semesterId) === String(filterSem) || String(r.offering?.semester?.semesterId) === String(filterSem)
  })

  // Calculate current credits in semester
  const currentSemesterCredits = activeRegistrationsInSem.reduce((sum, r) => sum + (r.credits || 0), 0)
  const creditsRemaining = Math.max(0, MAX_SEMESTER_CREDITS - currentSemesterCredits)
  const creditPct = Math.min(100, Math.round((currentSemesterCredits / MAX_SEMESTER_CREDITS) * 100))

  const registeredOfferingIds = new Set(
    myRegistrations.filter(r => r.status === 'REGISTERED').map(r => r.offeringId || r.offering?.offeringId)
  )
  const completedOfferingIds = new Set(
    myRegistrations.filter(r => r.status === 'COMPLETED').map(r => r.offeringId || r.offering?.offeringId)
  )
  const completedCourseIds = new Set(
    myRegistrations.filter(r => r.status === 'COMPLETED' && r.grade).map(r => r.courseId || r.offering?.course?.courseId)
  )

  async function handleRegister(offering) {
    const id = offering.offeringId || offering.id
    setRegistering(id)
    setAlert(null)
    try {
      await apiService.registrations.register({
        studentRegNo: regNo,
        offeringId: id
      })
      setAlert({ type: 'success', message: `Successfully registered for ${offering.courseName || offering.courseId}!` })
      loadData()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setRegistering(null)
    }
  }

  const cleanSearch = (typeof search === 'string' ? search : '').trim().toLowerCase()
  const displayed = offerings.filter(o => {
    const matchSem = !filterSem || String(o.semesterId) === String(filterSem)
    const matchDept = !filterDept ||
      String(o.departmentId) === String(filterDept) ||
      (o.departmentName && o.departmentName.toLowerCase().includes(filterDept.toLowerCase()))

    const max = o.maxSeats || 0
    const enrolled = typeof o.registeredCount === 'number'
      ? o.registeredCount
      : (o.availableSeats != null ? Math.max(0, max - o.availableSeats) : 0)
    const available = typeof o.availableSeats === 'number'
      ? o.availableSeats
      : Math.max(0, max - enrolled)
    const full = available <= 0 && max > 0

    if (hideFull && full) return false

    if (!cleanSearch) return matchSem && matchDept

    const matchSearch =
      (o.courseName || '').toLowerCase().includes(cleanSearch) ||
      (o.courseId || '').toLowerCase().includes(cleanSearch) ||
      (o.facultyName || '').toLowerCase().includes(cleanSearch) ||
      (o.departmentName || '').toLowerCase().includes(cleanSearch)

    return matchSem && matchDept && matchSearch
  })

  return (
    <div>
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Course Registration</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: 4 }}>
            Register for course offerings with live conflict detection and seat availability.
          </p>
        </div>
        <Link to="/student/timetable" className="btn btn-secondary">
          <Calendar size={15} /> View My Timetable
        </Link>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Credit Tracking Card */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600 }}>Semester Credit Load Tracker</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>{currentSemesterCredits}</span>
              <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>/ {MAX_SEMESTER_CREDITS} Max Allowed Credits</span>
              <span className={`badge ${creditPct >= 90 ? 'badge-warning' : 'badge-info'}`} style={{ marginLeft: 6 }}>
                {creditsRemaining} cr remaining
              </span>
            </div>
          </div>
          <div style={{ minWidth: '220px', flex: 1, maxWidth: '340px' }}>
            <div style={{ height: 8, background: 'var(--gray-200)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${creditPct}%`,
                  background: creditPct >= 90 ? 'var(--warning)' : 'var(--blue)',
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-600)', marginTop: 4 }}>
              <span>0 cr</span>
              <span>12 cr (Full-Time)</span>
              <span>20 cr (Max)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar
              value={search}
              onChange={(val) => setSearch(typeof val === 'string' ? val : (val?.target?.value ?? ''))}
              placeholder="Search course code, title, faculty..."
            />
          </div>

          <select
            className="filter-select"
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s.semesterId || s.id} value={String(s.semesterId || s.id)}>
                {s.name || s.semesterName} {(s.isActive === true || s.isActive === 'Y' || s.is_active) ? '(Active)' : ''}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.deptId || d.departmentId || d.id} value={String(d.deptName || d.departmentName || d.name)}>
                {d.deptName || d.departmentName || d.name}
              </option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={hideFull}
              onChange={e => setHideFull(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span>Hide Full Courses</span>
          </label>

          {(filterSem || filterDept || search || hideFull) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={resetFilters}
              title="Reset all filters"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Checking available course offerings..." />
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>No Offerings Found</h3>
          <p>No course offerings match your current filter or search criteria.</p>
          {(filterSem || filterDept || search || hideFull) && (
            <button className="btn btn-secondary btn-sm" onClick={resetFilters} style={{ marginTop: 12 }}>
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Faculty</th>
                  <th>Schedule</th>
                  <th>Credits</th>
                  <th>Seat Availability</th>
                  <th>Prerequisites</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(offering => {
                  const id = offering.offeringId || offering.id
                  const max = offering.maxSeats || 0
                  const enrolled = typeof offering.registeredCount === 'number'
                    ? offering.registeredCount
                    : (offering.availableSeats != null ? Math.max(0, max - offering.availableSeats) : 0)
                  const available = typeof offering.availableSeats === 'number'
                    ? offering.availableSeats
                    : Math.max(0, max - enrolled)
                  const full = available <= 0 && max > 0

                  const alreadyReg = registeredOfferingIds.has(id)
                  const isCompleted = completedOfferingIds.has(id)
                  const isRegistering = registering === id
                  const prereqs = Array.isArray(offering.prerequisites)
                    ? offering.prerequisites
                    : (offering.prerequisites ? [offering.prerequisites] : [])

                  // Prerequisite checks
                  const unmetPrereqs = prereqs.filter(p => !completedCourseIds.has(p))
                  const hasUnmetPrereqs = unmetPrereqs.length > 0

                  // Schedule conflict detection
                  const conflictingReg = !alreadyReg && !isCompleted
                    ? findConflictingRegistration(offering.schedule, activeRegistrationsInSem)
                    : null

                  // Credit limit check
                  const wouldExceedCredits = !alreadyReg && !isCompleted && (currentSemesterCredits + (offering.credits || 0) > MAX_SEMESTER_CREDITS)

                  const pctOccupied = max > 0 ? Math.round((enrolled / max) * 100) : 0
                  const seatColor = full ? 'var(--error)' : pctOccupied >= 80 ? 'var(--warning)' : 'var(--success)'

                  return (
                    <tr key={id} style={{ opacity: full && !alreadyReg ? 0.75 : 1 }}>
                      <td>
                        <span className="badge badge-navy">{offering.courseId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{offering.courseName || offering.courseId}</div>
                        {offering.departmentName && (
                          <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{offering.departmentName}</div>
                        )}
                      </td>
                      <td>{offering.facultyName || '—'}</td>
                      <td>
                        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} style={{ opacity: 0.6 }} />
                          <span>{offering.schedule || 'TBA'}</span>
                        </div>
                        {conflictingReg && (
                          <div style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={11} /> Overlaps with {conflictingReg.courseId}
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-info">{offering.credits} cr</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                          <Users size={13} style={{ color: seatColor }} />
                          <span style={{ fontWeight: 600, color: seatColor }}>
                            {enrolled}/{max}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                            ({available} left)
                          </span>
                        </div>
                      </td>
                      <td>
                        {prereqs.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {prereqs.map((p, i) => {
                              const met = completedCourseIds.has(p)
                              return (
                                <span
                                  key={i}
                                  className={`badge badge-${met ? 'success' : 'warning'}`}
                                  style={{ fontSize: 11 }}
                                  title={met ? `Completed prerequisite ${p}` : `Unmet prerequisite: requires ${p}`}
                                >
                                  {met ? `✓ ${p}` : p}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12 }}>
                            <Check size={12} /> None
                          </span>
                        )}
                      </td>
                      <td>
                        {alreadyReg ? (
                          <span className="badge badge-success">
                            <Check size={11} style={{ marginRight: 3 }} /> Registered
                          </span>
                        ) : isCompleted ? (
                          <span className="badge badge-info">
                            <Check size={11} style={{ marginRight: 3 }} /> Completed
                          </span>
                        ) : full ? (
                          <span className="badge badge-error">Seats Full</span>
                        ) : conflictingReg ? (
                          <span
                            className="badge badge-error"
                            style={{ cursor: 'help' }}
                            title={`Conflict: ${offering.schedule} overlaps with registered ${conflictingReg.courseId} (${conflictingReg.schedule})`}
                          >
                            Time Conflict
                          </span>
                        ) : wouldExceedCredits ? (
                          <span
                            className="badge badge-warning"
                            style={{ cursor: 'help' }}
                            title={`Exceeds max limit of ${MAX_SEMESTER_CREDITS} credits (Current: ${currentSemesterCredits} + ${offering.credits} = ${currentSemesterCredits + offering.credits})`}
                          >
                            Exceeds Limit
                          </span>
                        ) : hasUnmetPrereqs ? (
                          <span
                            className="badge badge-warning"
                            style={{ cursor: 'help' }}
                            title={`Missing prerequisites: ${unmetPrereqs.join(', ')}`}
                          >
                            Prereq Required
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleRegister(offering)}
                            disabled={isRegistering}
                          >
                            {isRegistering
                              ? <><div className="loading-spinner sm" style={{ borderTopColor: 'white' }} />Registering...</>
                              : 'Register'
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
