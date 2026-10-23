import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2 } from 'lucide-react'

const EMPTY = { courseId: '', semesterId: '', facultyId: '', maxSeats: 60, schedule: '' }

export default function AdminOfferings() {
  const [offerings, setOfferings] = useState([])
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [oRes, cRes, sRes, fRes] = await Promise.all([
        apiService.offerings.getAll(),
        apiService.courses.getAll(),
        apiService.semesters.getAll(),
        apiService.faculty.getAll()
      ])
      setOfferings(Array.isArray(oRes.data?.data || oRes.data) ? (oRes.data?.data || oRes.data) : [])
      setCourses(Array.isArray(cRes.data?.data || cRes.data) ? (cRes.data?.data || cRes.data) : [])
      setSemesters(Array.isArray(sRes.data?.data || sRes.data) ? (sRes.data?.data || sRes.data) : [])
      setFaculty(Array.isArray(fRes.data?.data || fRes.data) ? (fRes.data?.data || fRes.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load offerings.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(o) {
    setEditing(o.offeringId)
    setForm({
      courseId: o.course?.courseId || o.courseId || '',
      semesterId: o.semester?.semesterId || o.semesterId || '',
      facultyId: o.faculty?.facultyId || o.facultyId || '',
      maxSeats: o.maxSeats || 60,
      schedule: o.schedule || ''
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, semesterId: Number(form.semesterId), facultyId: Number(form.facultyId), maxSeats: Number(form.maxSeats) }
      if (editing) await apiService.offerings.update(editing, payload)
      else await apiService.offerings.create(payload)
      setAlert({ type: 'success', message: editing ? 'Offering updated.' : 'Offering created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this offering? All student registrations for it will be affected.')) return
    try {
      await apiService.offerings.delete(id)
      setAlert({ type: 'success', message: 'Offering deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' })
    }
  }

  const filtered = offerings.filter(o => {
    const matchesSem = !filterSem || String(o.semester?.semesterId || o.semesterId) === filterSem
    const matchesSearch = `${o.course?.courseId} ${o.course?.courseName} ${o.faculty?.firstName} ${o.faculty?.lastName}`.toLowerCase().includes(search.toLowerCase())
    return matchesSem && matchesSearch
  })

  if (loading) return <LoadingSpinner message="Loading offerings..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Course Offerings</h1><p className="page-subtitle">{offerings.length} offerings configured</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Offering</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search course or faculty…" />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: '180px' }} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s.semesterId} value={s.semesterId}>{s.semesterName}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Course</th><th>Faculty</th><th>Semester</th><th>Schedule</th><th>Seats</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No offerings found</td></tr>
              ) : filtered.map(o => {
                const enrolled = o.registeredCount || o.enrolledCount || 0
                const pct = Math.round((enrolled / (o.maxSeats || 60)) * 100)
                return (
                  <tr key={o.offeringId}>
                    <td style={{ fontFamily: 'monospace' }}>{o.offeringId}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.course?.courseName || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.course?.courseId}</div>
                    </td>
                    <td>{o.faculty ? `${o.faculty.firstName} ${o.faculty.lastName}` : '—'}</td>
                    <td>{o.semester?.semesterName || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{o.schedule || '—'}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', marginBottom: '3px' }}>{enrolled}/{o.maxSeats || 60}</div>
                      <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '99px', width: '80px' }}>
                        <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: pct > 90 ? 'var(--error)' : 'var(--blue)' }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(o)}><Edit size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.offeringId)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Offering' : 'Add Course Offering'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Course *</label>
              <select className="form-select" required value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseId} — {c.courseName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-select" required value={form.semesterId} onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))}>
                <option value="">Select semester</option>
                {semesters.map(s => <option key={s.semesterId} value={s.semesterId}>{s.semesterName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Faculty *</label>
              <select className="form-select" required value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                <option value="">Select faculty</option>
                {faculty.map(f => <option key={f.facultyId} value={f.facultyId}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Seats *</label>
              <input className="form-control" type="number" min={1} max={500} required value={form.maxSeats} onChange={e => setForm(f => ({ ...f, maxSeats: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Schedule</label>
              <input className="form-control" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Mon/Wed 10:00–11:30 AM, Room 301" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Add Offering')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
