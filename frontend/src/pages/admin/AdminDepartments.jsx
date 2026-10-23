import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import { Plus, Edit, Trash2 } from 'lucide-react'

const EMPTY = { deptName: '', hodId: '' }

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState([])
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
      const [dRes, fRes] = await Promise.all([apiService.departments.getAll(), apiService.faculty.getAll()])
      setDepartments(Array.isArray(dRes.data?.data || dRes.data) ? (dRes.data?.data || dRes.data) : [])
      setFaculty(Array.isArray(fRes.data?.data || fRes.data) ? (fRes.data?.data || fRes.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load departments.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(d) {
    setEditing(d.deptId)
    setForm({ deptName: d.deptName, hodId: d.hodId || '' })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, hodId: form.hodId ? Number(form.hodId) : null }
      if (editing) await apiService.departments.update(editing, payload)
      else await apiService.departments.create(payload)
      setAlert({ type: 'success', message: editing ? 'Department updated.' : 'Department created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department? Faculty and students in this department will be affected.')) return
    try {
      await apiService.departments.delete(id)
      setAlert({ type: 'success', message: 'Department deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' })
    }
  }

  if (loading) return <LoadingSpinner message="Loading departments..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Departments</h1><p className="page-subtitle">{departments.length} departments</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Department</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Dept ID</th><th>Department Name</th><th>Head of Department</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No departments found</td></tr>
              ) : departments.map(d => {
                const hod = faculty.find(f => f.facultyId === d.hodId)
                return (
                  <tr key={d.deptId}>
                    <td style={{ fontFamily: 'monospace' }}>{d.deptId}</td>
                    <td style={{ fontWeight: 700 }}>{d.deptName}</td>
                    <td>{hod ? `${hod.firstName} ${hod.lastName}` : (d.hodId ? `Faculty #${d.hodId}` : <span style={{ color: 'var(--gray-300)' }}>Not assigned</span>)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}><Edit size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.deptId)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input className="form-control" required value={form.deptName} onChange={e => setForm(f => ({ ...f, deptName: e.target.value }))} placeholder="e.g. Computer Science" />
          </div>
          <div className="form-group">
            <label className="form-label">Head of Department</label>
            <select className="form-select" value={form.hodId} onChange={e => setForm(f => ({ ...f, hodId: e.target.value }))}>
              <option value="">-- Not assigned --</option>
              {faculty.map(f => <option key={f.facultyId} value={f.facultyId}>{f.firstName} {f.lastName}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Add Department')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
