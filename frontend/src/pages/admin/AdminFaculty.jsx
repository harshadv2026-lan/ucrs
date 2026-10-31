import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, X } from 'lucide-react'

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: 'Assistant Professor',
  deptId: '',
  password: 'faculty123'
}

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

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [fRes, dRes] = await Promise.all([
        apiService.faculty.getAll(),
        apiService.departments.getAll()
      ])
      const fData = Array.isArray(fRes.data?.data) ? fRes.data.data : (Array.isArray(fRes.data) ? fRes.data : [])
      const dData = Array.isArray(dRes.data?.data) ? dRes.data.data : (Array.isArray(dRes.data) ? dRes.data : [])
      setFaculty(fData)
      setDepartments(dData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load faculty members.' })
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(f) {
    setEditing(f.facultyId)
    setForm({
      firstName: f.firstName || '',
      lastName: f.lastName || '',
      email: f.email || '',
      phone: f.phone || '',
      designation: f.designation || 'Assistant Professor',
      deptId: f.department?.deptId ? String(f.department.deptId) : (f.deptId ? String(f.deptId) : ''),
      password: ''
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setAlert({ type: 'error', message: 'First name, last name, and email are required.' })
      return
    }
    if (!form.deptId) {
      setAlert({ type: 'error', message: 'Please select a department.' })
      return
    }

    try {
      setSaving(true)
      const deptIdNum = Number(form.deptId)
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        designation: form.designation,
        department: { deptId: deptIdNum },
        deptId: deptIdNum,
        password: form.password || 'faculty123'
      }

      if (editing) {
        await apiService.faculty.update(editing, payload)
        setAlert({ type: 'success', message: `Faculty member #${editing} updated successfully.` })
      } else {
        await apiService.faculty.create(payload)
        setAlert({ type: 'success', message: 'New faculty member added successfully.' })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save faculty record.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete faculty member #${id}? Active courses and department assignments may be affected.`)) return
    try {
      await apiService.faculty.delete(id)
      setAlert({ type: 'success', message: `Faculty member #${id} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete faculty member.' })
    }
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
  }

  const filtered = faculty.filter(f => {
    const q = search.toLowerCase()
    const id = String(f.facultyId || '')
    const name = `${f.firstName || ''} ${f.lastName || ''}`.toLowerCase()
    const email = (f.email || '').toLowerCase()
    const desig = (f.designation || '').toLowerCase()
    const dept = (f.department?.deptName || '').toLowerCase()
    return id.includes(q) || name.includes(q) || email.includes(q) || desig.includes(q) || dept.includes(q)
  })

  if (loading) return <LoadingSpinner message="Loading faculty members..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Management</h1>
          <p className="page-subtitle">{faculty.length} faculty members registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by ID, name, email, designation, or department…"
            />
          </div>
          {search && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSearch('')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    {search ? `No faculty match "${search}"` : 'No faculty records found.'}
                  </td>
                </tr>
              ) : filtered.map(f => (
                <tr key={f.facultyId}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{f.facultyId}</td>
                  <td style={{ fontWeight: 600 }}>{f.firstName} {f.lastName}</td>
                  <td>{f.email}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{f.phone || '—'}</td>
                  <td><span className="badge badge-info">{f.designation}</span></td>
                  <td>{f.department?.deptName || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" title="Edit Faculty" onClick={() => openEdit(f)}>
                        <Edit size={13} />
                      </button>
                      <button className="btn btn-danger btn-sm" title="Delete Faculty" onClick={() => handleDelete(f.facultyId)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Faculty #${editing}` : 'Add Faculty Member'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                className="form-control"
                required
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="e.g. Alan"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                className="form-control"
                required
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="e.g. Turing"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Email Address *</label>
              <input
                className="form-control"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="e.g. alan.turing@university.edu"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +1 555-0199"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <select
                className="form-select"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
              >
                {['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Lecturer', 'Adjunct Professor'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                required
                value={form.deptId}
                onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
                ))}
              </select>
            </div>
            {!editing && (
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Initial Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Default: faculty123"
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Faculty' : 'Add Faculty')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
