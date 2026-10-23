import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'

const EMPTY = { semesterName: '', academicYear: '', startDate: '', endDate: '', isActive: 'N' }

export default function AdminSemesters() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const res = await apiService.semesters.getAll()
      setSemesters(Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load semesters.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(s) {
    setEditing(s.semesterId)
    setForm({
      semesterName: s.semesterName, academicYear: s.academicYear || '',
      startDate: s.startDate ? s.startDate.split('T')[0] : '',
      endDate: s.endDate ? s.endDate.split('T')[0] : '',
      isActive: s.isActive || 'N'
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      if (editing) await apiService.semesters.update(editing, form)
      else await apiService.semesters.create(form)
      setAlert({ type: 'success', message: editing ? 'Semester updated.' : 'Semester created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this semester? This may affect offerings and registrations.')) return
    try {
      await apiService.semesters.delete(id)
      setAlert({ type: 'success', message: 'Semester deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' })
    }
  }

  if (loading) return <LoadingSpinner message="Loading semesters..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Semesters</h1><p className="page-subtitle">{semesters.length} semesters configured</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Semester</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Academic Year</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {semesters.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No semesters found</td></tr>
              ) : semesters.map(s => (
                <tr key={s.semesterId}>
                  <td style={{ fontFamily: 'monospace' }}>{s.semesterId}</td>
                  <td style={{ fontWeight: 700 }}>{s.semesterName}</td>
                  <td>{s.academicYear || '—'}</td>
                  <td>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                  <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                  <td>
                    {(s.isActive === 'Y' || s.isActive === true) ? (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Edit size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.semesterId)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Semester' : 'Add Semester'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Semester Name *</label>
              <input className="form-control" required value={form.semesterName} onChange={e => setForm(f => ({ ...f, semesterName: e.target.value }))} placeholder="e.g. Fall 2024" />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input className="form-control" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2024-25" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))}>
                <option value="N">Inactive</option>
                <option value="Y">Active</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-control" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-control" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Add Semester')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
