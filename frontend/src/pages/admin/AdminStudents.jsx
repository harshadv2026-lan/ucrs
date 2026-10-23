import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react'

const EMPTY = { studentRegNo: '', firstName: '', lastName: '', email: '', phone: '', gender: 'M', address: '', semesterNo: 1, cgpa: 0, deptId: '', password: 'student123' }

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [sRes, dRes] = await Promise.all([apiService.students.getAll(), apiService.departments.getAll()])
      setStudents(Array.isArray(sRes.data?.data || sRes.data) ? (sRes.data?.data || sRes.data) : [])
      setDepartments(Array.isArray(dRes.data?.data || dRes.data) ? (dRes.data?.data || dRes.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load students.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(s) {
    setEditing(s.studentRegNo)
    setForm({ studentRegNo: s.studentRegNo, firstName: s.firstName, lastName: s.lastName, email: s.email, phone: s.phone || '', gender: s.gender || 'M', address: s.address || '', semesterNo: s.semesterNo || 1, cgpa: s.cgpa || 0, deptId: s.department?.deptId || s.deptId || '', password: '' })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, deptId: Number(form.deptId), semesterNo: Number(form.semesterNo), cgpa: parseFloat(form.cgpa) }
      if (editing) await apiService.students.update(editing, payload)
      else await apiService.students.create(payload)
      setAlert({ type: 'success', message: editing ? 'Student updated.' : 'Student created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save student.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(regNo) {
    if (!window.confirm(`Delete student ${regNo}? This cannot be undone.`)) return
    try {
      await apiService.students.delete(regNo)
      setAlert({ type: 'success', message: 'Student deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete student.' })
    }
  }

  const filtered = students.filter(s =>
    `${s.studentRegNo} ${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <LoadingSpinner message="Loading students..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Students</h1><p className="page-subtitle">{students.length} students registered</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Student</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
          <SearchBar value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, reg no, email…" />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Reg No</th><th>Name</th><th>Email</th><th>Dept</th><th>Semester</th><th>CGPA</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No students found</td></tr>
              ) : paginated.map(s => (
                <tr key={s.studentRegNo}>
                  <td style={{ fontFamily: 'monospace' }}>{s.studentRegNo}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>{s.department?.deptName || '—'}</td>
                  <td>{s.semesterNo}</td>
                  <td>{s.cgpa?.toFixed(2) || '0.00'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Edit size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.studentRegNo)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add New Student'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!editing && (
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Registration Number *</label>
                <input className="form-control" required value={form.studentRegNo} onChange={e => setForm(f => ({ ...f, studentRegNo: e.target.value }))} placeholder="e.g. 2024CS001" />
              </div>
            )}
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
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" required value={form.deptId} onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester No *</label>
              <input className="form-control" type="number" min={1} max={8} required value={form.semesterNo} onChange={e => setForm(f => ({ ...f, semesterNo: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input className="form-control" type="number" step="0.01" min={0} max={10} value={form.cgpa} onChange={e => setForm(f => ({ ...f, cgpa: e.target.value }))} />
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Default: student123" />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update Student' : 'Add Student')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
