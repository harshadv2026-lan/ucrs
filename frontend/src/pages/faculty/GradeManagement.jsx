import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'W']

export default function GradeManagement() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState('')
  const [students, setStudents] = useState([])
  const [gradeInputs, setGradeInputs] = useState({})
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    async function fetchOfferings() {
      try {
        setLoadingOfferings(true)
        const res = await apiService.offerings.getAll({ facultyId: user?.facultyId || user?.id })
        const data = res.data?.data || res.data || []
        setOfferings(Array.isArray(data) ? data : [])
      } catch {
        setAlert({ type: 'error', message: 'Failed to load offerings.' })
      } finally {
        setLoadingOfferings(false)
      }
    }
    fetchOfferings()
  }, [user])

  async function loadStudents(offeringId) {
    if (!offeringId) { setStudents([]); return }
    try {
      setLoadingStudents(true)
      const res = await apiService.offerings.getStudents(offeringId)
      const data = res.data?.data || res.data || []
      const list = Array.isArray(data) ? data : []
      setStudents(list)
      const inputs = {}
      list.forEach(s => { inputs[s.regId || s.registrationId] = s.grade || '' })
      setGradeInputs(inputs)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load students.' })
    } finally {
      setLoadingStudents(false)
    }
  }

  async function saveGrade(regId, currentStatus) {
    if (currentStatus === 'DROPPED') {
      setAlert({ type: 'error', message: 'Cannot assign a grade to a dropped registration.' })
      return
    }
    const grade = gradeInputs[regId]
    if (!grade) { setAlert({ type: 'error', message: 'Please select a grade before saving.' }); return }
    try {
      setSavingId(regId)
      await apiService.registrations.updateGrade(regId, grade)
      setAlert({ type: 'success', message: `Grade "${grade}" saved successfully.` })
      setStudents(prev => prev.map(s =>
        (s.regId || s.registrationId) === regId ? { ...s, grade } : s
      ))
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save grade.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Management</h1>
          <p className="page-subtitle">Enter or update grades for your course offerings</p>
        </div>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Select Course Offering</label>
        {loadingOfferings ? (
          <LoadingSpinner message="Loading offerings..." />
        ) : (
          <select
            className="form-select"
            value={selectedOffering}
            onChange={e => { setSelectedOffering(e.target.value); loadStudents(e.target.value) }}
          >
            <option value="">-- Choose an offering --</option>
            {offerings.map(o => (
              <option key={o.offeringId} value={o.offeringId}>
                {o.course?.courseId} — {o.course?.courseName} ({o.semester?.semesterName})
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingStudents && <LoadingSpinner message="Loading enrolled students..." />}

      {!loadingStudents && selectedOffering && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Enrolled Students ({students.length})</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              Grades cannot be assigned to DROPPED registrations
            </span>
          </div>
          {students.length === 0 ? (
            <p style={{ padding: '1.5rem', color: 'var(--gray-400)' }}>No students enrolled in this offering.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Reg ID</th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Current Grade</th>
                    <th>New Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const rid = s.regId || s.registrationId
                    const isDropped = s.status === 'DROPPED'
                    return (
                      <tr key={rid} style={{ opacity: isDropped ? 0.55 : 1 }}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{rid}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.studentRegNo}</td>
                        <td>{s.firstName || s.studentName} {s.lastName || ''}</td>
                        <td>
                          <span className={`badge badge-${s.status === 'REGISTERED' ? 'info' : s.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>{s.grade ? <span className="badge badge-success">{s.grade}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: '0.875rem', minWidth: '80px' }}
                            value={gradeInputs[rid] || ''}
                            onChange={e => setGradeInputs(prev => ({ ...prev, [rid]: e.target.value }))}
                            disabled={isDropped}
                            title={isDropped ? 'Cannot grade dropped registrations' : ''}
                          >
                            <option value="">Select</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={isDropped || savingId === rid}
                            onClick={() => saveGrade(rid, s.status)}
                          >
                            {savingId === rid ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
