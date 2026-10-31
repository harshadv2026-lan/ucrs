import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, X } from 'lucide-react'

const EMPTY = {
  studentRegNo: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'M',
  address: '',
  semesterNo: 1,
  cgpa: 0,
  deptId: '',
  password: 'student123'
}

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

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [sRes, dRes] = await Promise.all([
        apiService.students.getAll(),
        apiService.departments.getAll()
      ])
      const sData = Array.isArray(sRes.data?.data) ? sRes.data.data : (Array.isArray(sRes.data) ? sRes.data : [])
      const dData = Array.isArray(dRes.data?.data) ? dRes.data.data : (Array.isArray(dRes.data) ? dRes.data : [])
      setStudents(sData)
      setDepartments(dData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load students and departments from server.' })
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(s) {
    setEditing(s.studentRegNo)
    setForm({
      studentRegNo: s.studentRegNo,
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      phone: s.phone || '',
      gender: s.gender || 'M',
      address: s.address || '',
      semesterNo: s.semesterNo || 1,
      cgpa: s.cgpa || 0,
      deptId: s.department?.deptId ? String(s.department.deptId) : (s.deptId ? String(s.deptId) : ''),
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
    if (!editing && !form.studentRegNo.trim()) {
      setAlert({ type: 'error', message: 'Student registration number is required.' })
      return
    }

    try {
      setSaving(true)
      const deptIdNum = form.deptId ? Number(form.deptId) : null
      const payload = {
        studentRegNo: form.studentRegNo.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        address: form.address.trim(),
        semesterNo: Number(form.semesterNo) || 1,
        cgpa: parseFloat(form.cgpa) || 0.0,
        department: deptIdNum ? { deptId: deptIdNum } : null,
        deptId: deptIdNum,
        password: form.password || 'student123'
      }

      if (editing) {
        await apiService.students.update(editing, payload)
        setAlert({ type: 'success', message: `Student '${editing}' updated successfully.` })
      } else {
        await apiService.students.create(payload)
        setAlert({ type: 'success', message: `Student '${payload.studentRegNo}' created successfully.` })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save student record.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(regNo) {
    if (!window.confirm(`Delete student ${regNo}? This cannot be undone.`)) return
    try {
      await apiService.students.delete(regNo)
      setAlert({ type: 'success', message: `Student ${regNo} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete student.' })
    }
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
    setPage(1)
  }

  const cleanQuery = search.trim().toLowerCase()
  const filtered = students.filter(s => {
    if (!cleanQuery) return true
    const reg = (s.studentRegNo || '').toLowerCase()
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const email = (s.email || '').toLowerCase()
    const dept = (s.department?.deptName || '').toLowerCase()
    const phone = (s.phone || '').toLowerCase()
    return reg.includes(cleanQuery) || name.includes(cleanQuery) || email.includes(cleanQuery) || dept.includes(cleanQuery) || phone.includes(cleanQuery)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <LoadingSpinner message="Loading students..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students enrolled in system</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search students by name, reg no, email, or department…"
            />
          </div>
          {search && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleSearchChange('')}
              title="Clear search"
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
                <th>Reg No</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Semester</th>
                <th>CGPA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    {search ? `No students found matching "${search}"` : 'No students found'}
                  </td>
                </tr>
              ) : paginated.map(s => (
                <tr key={s.studentRegNo}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.studentRegNo}</td>
                  <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>
                    {s.department?.deptName ? (
                      <span className="badge badge-info">{s.department.deptName}</span>
                    ) : '—'}
                  </td>
                  <td>Semester {s.semesterNo}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.cgpa >= 8.5 ? '#21865B' : '#15382E' }}>
                      {typeof s.cgpa === 'number' ? s.cgpa.toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} title="Edit Student">
                        <Edit size={13} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.studentRegNo)} title="Delete Student">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--gray-200)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Page {page} of {totalPages} ({filtered.length} results)</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Student: ${editing}` : 'Add New Student'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!editing && (
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Registration Number *</label>
                <input
                  className="form-control"
                  required
                  value={form.studentRegNo}
                  onChange={e => setForm(f => ({ ...f, studentRegNo: e.target.value }))}
                  placeholder="e.g. 2024CS015"
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                className="form-control"
                required
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="e.g. Alex"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                className="form-control"
                required
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="e.g. Smith"
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
                placeholder="alex.smith@student.ucrs.edu"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="555-0199"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                required
                value={form.deptId}
                onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}
              >
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester Number *</label>
              <input
                className="form-control"
                type="number"
                min={1}
                max={12}
                required
                value={form.semesterNo}
                onChange={e => setForm(f => ({ ...f, semesterNo: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CGPA (0.00 - 10.00)</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={form.cgpa}
                onChange={e => setForm(f => ({ ...f, cgpa: e.target.value }))}
              />
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Default: student123"
                />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Residential address"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
