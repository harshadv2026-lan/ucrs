import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2 } from 'lucide-react'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', designation: 'Assistant Professor', deptId: '', password: 'faculty123' }

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [fRes, dRes] = await Promise.all([apiService.faculty.getAll(), apiService.departments.getAll()])
      setFaculty(Array.isArray(fRes.data?.data || fRes.data) ? (fRes.data?.data || fRes.data) : [])
      setDepartments(Array.isArray(dRes.data?.data || dRes.data) ? (dRes.data?.data || dRes.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load faculty.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(f) {
    setEditing(f.facultyId)
    setForm({ firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone || '', designation: f.designation || 'Assistant Professor', deptId: f.department?.deptId || f.deptId || '', password: '' })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, deptId: Number(form.deptId) }
      if (editing) await apiService.faculty.update(editing, payload)
      else await apiService.faculty.create(payload)
      setAlert({ type: 'success', message: editing ? 'Faculty updated.' : 'Faculty member created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this faculty member?')) return
    try {
      await apiService.faculty.delete(id)
      setAlert({ type: 'success', message: 'Faculty member deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' })
    }
  }

  const filtered = faculty.filter(f =>
    `${f.facultyId} ${f.firstName} ${f.lastName} ${f.email} ${f.designation}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner message="Loading faculty..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Faculty</h1><p className="page-subtitle">{faculty.length} faculty members</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Faculty</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, designation…" />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Designation</th><th>Department</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No faculty found</td></tr>
              ) : filtered.map(f => (
                <tr key={f.facultyId}>
                  <td style={{ fontFamily: 'monospace' }}>{f.facultyId}</td>
                  <td>{f.firstName} {f.lastName}</td>
                  <td>{f.email}</td>
                  <td><span className="badge badge-info">{f.designation}</span></td>
                  <td>{f.department?.deptName || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}><Edit size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.facultyId)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Faculty' : 'Add Faculty Member'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-control" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-control" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <select className="form-select" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                {['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Lecturer'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" required value={form.deptId} onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Default: faculty123" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Add Faculty')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
