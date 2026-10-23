import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import { ClipboardList, Check, AlertTriangle, Users } from 'lucide-react'

export default function CourseRegistration() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState([])
  const [semesters, setSemesters] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSem, setFilterSem] = useState('')
  const [registering, setRegistering] = useState(null)
  const [alert, setAlert] = useState(null)

  const regNo = user?.regNo || user?.id

  function loadData() {
    setLoading(true)
    Promise.all([
      apiService.offerings.getAll(filterSem ? { semesterId: filterSem } : {}),
      apiService.semesters.getAll(),
      apiService.registrations.getByStudent(regNo)
    ]).then(([o, s, r]) => {
      setOfferings(Array.isArray(o.data?.data) ? o.data.data : Array.isArray(o.data) ? o.data : [])
      const sems = Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : []
      setSemesters(sems)
      if (!filterSem) {
        const active = sems.find(sem => sem.isActive || sem.is_active)
        if (active) setFilterSem(String(active.semesterId || active.id))
      }
      setMyRegistrations(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { if (regNo) loadData() }, [regNo, filterSem])

  const registeredOfferingIds = new Set(
    myRegistrations.filter(r => r.status === 'REGISTERED').map(r => r.offeringId || r.offering?.offeringId)
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

  const displayed = offerings.filter(o =>
    !filterSem || String(o.semesterId) === filterSem
  )

  return (
    <div>
      <div className="page-header">
        <h1>Course Registration</h1>
        <p>Register for course offerings available this semester.</p>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div className="filters-row" style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
          Semester:
        </label>
        <select
          className="filter-select"
          value={filterSem}
          onChange={e => setFilterSem(e.target.value)}
        >
          <option value="">All Semesters</option>
          {semesters.map(s => (
            <option key={s.semesterId || s.id} value={String(s.semesterId || s.id)}>
              {s.name || s.semesterName} {(s.isActive || s.is_active) ? '(Active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading offerings..." />
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>No Offerings Available</h3>
          <p>There are no course offerings for the selected semester.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Schedule</th>
                  <th>Credits</th>
                  <th>Seats</th>
                  <th>Prerequisites</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(offering => {
                  const id = offering.offeringId || offering.id
                  const enrolled = offering.registeredCount ?? 0
                  const max = offering.maxSeats || 0
                  const full = enrolled >= max && max > 0
                  const alreadyReg = registeredOfferingIds.has(id)
                  const isRegistering = registering === id
                  const prereqs = Array.isArray(offering.prerequisites)
                    ? offering.prerequisites
                    : offering.prerequisites ? [offering.prerequisites] : []

                  return (
                    <tr key={id}>
                      <td>
                        <span className="badge badge-navy">{offering.courseId}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{offering.courseName || offering.courseId}</td>
                      <td>{offering.facultyName || '—'}</td>
                      <td style={{ fontSize: 12.5 }}>{offering.schedule || '—'}</td>
                      <td><span className="badge badge-info">{offering.credits}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={13} style={{ color: full ? 'var(--error)' : 'var(--success)' }} />
                          <span style={{ fontSize: 13, color: full ? 'var(--error)' : 'inherit' }}>
                            {enrolled}/{max}
                          </span>
                        </div>
                      </td>
                      <td>
                        {prereqs.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {prereqs.map((p, i) => (
                              <span key={i} className="badge badge-warning" style={{ fontSize: 11 }}>{p}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 13 }}>
                            <Check size={13} /> None
                          </span>
                        )}
                      </td>
                      <td>
                        {alreadyReg ? (
                          <span className="badge badge-success">
                            <Check size={11} style={{ marginRight: 3 }} /> Registered
                          </span>
                        ) : full ? (
                          <span className="badge badge-error">Seats Full</span>
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
