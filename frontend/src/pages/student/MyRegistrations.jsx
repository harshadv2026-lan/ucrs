import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import { BookMarked, Download, AlertTriangle, Trash2 } from 'lucide-react'

const STATUS_COLORS = { REGISTERED: 'info', COMPLETED: 'success', DROPPED: 'gray' }

export default function MyRegistrations() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [alert, setAlert] = useState(null)
  const [dropping, setDropping] = useState(null)
  const [confirmDrop, setConfirmDrop] = useState(null)

  const regNo = user?.regNo || user?.id

  function loadData() {
    setLoading(true)
    Promise.all([
      apiService.registrations.getByStudent(regNo),
      apiService.registrations.getCredits(regNo)
    ]).then(([r, c]) => {
      setRegistrations(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [])
      const raw = c.data?.data
      setCredits(raw && typeof raw === 'object' ? (raw.totalCredits ?? 0) : (raw ?? c.data?.credits ?? 0))
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { if (regNo) loadData() }, [regNo])

  async function handleDrop(reg) {
    const id = reg.registrationId || reg.regId || reg.id
    setDropping(id)
    setAlert(null)
    try {
      await apiService.registrations.drop(id)
      setAlert({ type: 'success', message: `Dropped ${reg.courseName || reg.courseId} successfully.` })
      setConfirmDrop(null)
      loadData()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to drop course.' })
    } finally {
      setDropping(null)
    }
  }

  function exportCSV() {
    const headers = ['Reg ID', 'Course ID', 'Course Name', 'Faculty', 'Semester', 'Date', 'Status', 'Grade']
    const rows = filtered.map(r => [
      r.registrationId || r.regId || r.id,
      r.courseId,
      r.courseName || '',
      r.facultyName || '',
      r.semesterName || '',
      r.registrationDate ? new Date(r.registrationDate).toLocaleDateString() : '',
      r.status,
      r.grade || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations_${regNo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = registrations.filter(r => !filterStatus || r.status === filterStatus)

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Registrations</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: 4 }}>Manage your course registrations.</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Total Credits</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
              {credits !== null ? credits : '—'}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--gray-200)' }} />
          <div>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Total Registrations</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>{registrations.length}</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--gray-200)' }} />
          <div>
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Active</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)', lineHeight: 1.2 }}>
              {registrations.filter(r => r.status === 'REGISTERED').length}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="COMPLETED">Completed</option>
          <option value="DROPPED">Dropped</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading registrations..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookMarked size={48} />
          <h3>No Registrations Found</h3>
          <p>{filterStatus ? `No ${filterStatus.toLowerCase()} registrations.` : "You haven't registered for any courses yet."}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Semester</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(reg => {
                  const id = reg.registrationId || reg.regId || reg.id
                  return (
                    <tr key={id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{reg.courseName || reg.courseId}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>{reg.courseId}</div>
                      </td>
                      <td>{reg.facultyName || '—'}</td>
                      <td>{reg.semesterName || '—'}</td>
                      <td style={{ fontSize: 12.5 }}>
                        {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${STATUS_COLORS[reg.status] || 'gray'}`}>{reg.status}</span>
                      </td>
                      <td>
                        {reg.grade
                          ? <span className="badge badge-purple">{reg.grade}</span>
                          : <span style={{ color: 'var(--gray-400)' }}>—</span>
                        }
                      </td>
                      <td>
                        {reg.status === 'REGISTERED' ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDrop(reg)}
                            disabled={dropping === id}
                          >
                            <Trash2 size={12} />
                            {dropping === id ? 'Dropping...' : 'Drop'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>—</span>
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

      {/* Confirm Drop Modal */}
      <Modal isOpen={!!confirmDrop} onClose={() => setConfirmDrop(null)} title="Confirm Drop">
        {confirmDrop && (
          <>
            <div className="modal-body">
              <div style={{ textAlign: 'center' }}>
                <div className="confirm-icon" style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>Drop this course?</h3>
                <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>
                  Are you sure you want to drop <strong>{confirmDrop.courseName || confirmDrop.courseId}</strong>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDrop(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDrop(confirmDrop)}
                disabled={!!dropping}
              >
                {dropping ? 'Dropping...' : 'Yes, Drop Course'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
