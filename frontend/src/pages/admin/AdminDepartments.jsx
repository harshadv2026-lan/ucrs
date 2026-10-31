import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, X, Building2 } from 'lucide-react'

const EMPTY = { deptName: '', hodId: '' }

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState([])
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
      const [dRes, fRes] = await Promise.all([
        apiService.departments.getAll(),
        apiService.faculty.getAll()
      ])
      const dData = Array.isArray(dRes.data?.data) ? dRes.data.data : (Array.isArray(dRes.data) ? dRes.data : [])
      const fData = Array.isArray(fRes.data?.data) ? fRes.data.data : (Array.isArray(fRes.data) ? fRes.data : [])
      setDepartments(dData)
      setFaculty(fData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load university departments.' })
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(d) {
    setEditing(d.deptId)
    setForm({
      deptName: d.deptName || '',
      hodId: d.hodId ? String(d.hodId) : ''
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.deptName.trim()) {
      setAlert({ type: 'error', message: 'Department name is required.' })
      return
    }

    try {
      setSaving(true)
      const payload = {
        deptName: form.deptName.trim(),
        hodId: form.hodId ? Number(form.hodId) : null
      }

      if (editing) {
        await apiService.departments.update(editing, payload)
        setAlert({ type: 'success', message: `Department '${payload.deptName}' updated successfully.` })
      } else {
        await apiService.departments.create(payload)
        setAlert({ type: 'success', message: `Department '${payload.deptName}' created successfully.` })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save department.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete department #${id}? Faculty, students, and courses in this department will be affected.`)) return
    try {
      await apiService.departments.delete(id)
      setAlert({ type: 'success', message: `Department #${id} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete department.' })
    }
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
  }

  const filtered = departments.filter(d => {
    const q = search.toLowerCase()
    const id = String(d.deptId || '')
    const name = (d.deptName || '').toLowerCase()
    const hod = faculty.find(f => f.facultyId === d.hodId)
    const hodName = hod ? `${hod.firstName} ${hod.lastName}`.toLowerCase() : ''
    return id.includes(q) || name.includes(q) || hodName.includes(q)
  })

  if (loading) return <LoadingSpinner message="Loading departments..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Department Management</h1>
          <p className="page-subtitle">{departments.length} academic departments</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by department ID, name, or Head of Department…"
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
                <th>Department Name</th>
                <th>Head of Department (HOD)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    {search ? `No departments match "${search}"` : 'No departments found.'}
                  </td>
                </tr>
              ) : filtered.map(d => {
                const hod = faculty.find(f => f.facultyId === d.hodId)
                return (
                  <tr key={d.deptId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{d.deptId}</td>
                    <td style={{ fontWeight: 600 }}>{d.deptName}</td>
                    <td>
                      {hod ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{hod.firstName} {hod.lastName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: '6px' }}>({hod.designation})</span>
                        </div>
                      ) : (
                        d.hodId ? `Faculty #${d.hodId}` : <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" title="Edit Department" onClick={() => openEdit(d)}>
                          <Edit size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete Department" onClick={() => handleDelete(d.deptId)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Department #${editing}` : 'Add Department'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              className="form-control"
              required
              value={form.deptName}
              onChange={e => setForm(f => ({ ...f, deptName: e.target.value }))}
              placeholder="e.g. Electrical & Computer Engineering"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Head of Department (Faculty)</label>
            <select
              className="form-select"
              value={form.hodId}
              onChange={e => setForm(f => ({ ...f, hodId: e.target.value }))}
            >
              <option value="">-- None / Not Assigned --</option>
              {faculty.map(f => (
                <option key={f.facultyId} value={f.facultyId}>
                  #{f.facultyId} — {f.firstName} {f.lastName} ({f.department?.deptName || 'Faculty'})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Department' : 'Add Department')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
