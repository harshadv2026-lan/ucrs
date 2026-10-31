import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, CheckCircle, XCircle, X } from 'lucide-react'

const EMPTY = {
  semesterName: '',
  academicYear: '',
  startDate: '',
  endDate: '',
  isActive: 'N'
}

export default function AdminSemesters() {
  const [semesters, setSemesters] = useState([])
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
      const res = await apiService.semesters.getAll()
      const sData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      setSemesters(sData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load academic semesters.' })
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
    setEditing(s.semesterId)
    const activeVal = (s.isActive === 'Y' || s.isActive === true || s.isActive === 'true') ? 'Y' : 'N'
    setForm({
      semesterName: s.semesterName || '',
      academicYear: s.academicYear || '',
      startDate: s.startDate ? s.startDate.split('T')[0] : '',
      endDate: s.endDate ? s.endDate.split('T')[0] : '',
      isActive: activeVal
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.semesterName.trim()) {
      setAlert({ type: 'error', message: 'Semester name is required.' })
      return
    }

    try {
      setSaving(true)
      const payload = {
        semesterName: form.semesterName.trim(),
        academicYear: form.academicYear.trim(),
        startDate: form.startDate ? form.startDate : null,
        endDate: form.endDate ? form.endDate : null,
        isActive: form.isActive === 'Y' ? 'Y' : 'N'
      }

      if (editing) {
        await apiService.semesters.update(editing, payload)
        setAlert({ type: 'success', message: `Semester '${payload.semesterName}' updated successfully.` })
      } else {
        await apiService.semesters.create(payload)
        setAlert({ type: 'success', message: `Semester '${payload.semesterName}' created successfully.` })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save semester.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete semester #${id}? Active course offerings and registrations may be affected.`)) return
    try {
      await apiService.semesters.delete(id)
      setAlert({ type: 'success', message: `Semester #${id} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete semester.' })
    }
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
  }

  const filtered = semesters.filter(s => {
    const q = search.toLowerCase()
    const id = String(s.semesterId || '')
    const name = (s.semesterName || '').toLowerCase()
    const year = (s.academicYear || '').toLowerCase()
    const isActive = (s.isActive === 'Y' || s.isActive === true)
    const statusText = isActive ? 'active' : 'inactive'
    return id.includes(q) || name.includes(q) || year.includes(q) || statusText.includes(q)
  })

  if (loading) return <LoadingSpinner message="Loading semesters..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Semester Management</h1>
          <p className="page-subtitle">{semesters.length} academic semesters configured</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Semester
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by ID, semester name, academic year, or active status…"
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
                <th>Semester Name</th>
                <th>Academic Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    {search ? `No semesters match "${search}"` : 'No semesters configured.'}
                  </td>
                </tr>
              ) : filtered.map(s => {
                const isActive = (s.isActive === 'Y' || s.isActive === true || s.isActive === 'true')
                return (
                  <tr key={s.semesterId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{s.semesterId}</td>
                    <td style={{ fontWeight: 600 }}>{s.semesterName}</td>
                    <td>{s.academicYear || '—'}</td>
                    <td>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                    <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                    <td>
                      {isActive ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" title="Edit Semester" onClick={() => openEdit(s)}>
                          <Edit size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete Semester" onClick={() => handleDelete(s.semesterId)}>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Semester #${editing}` : 'Add Semester'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Semester Name *</label>
              <input
                className="form-control"
                required
                value={form.semesterName}
                onChange={e => setForm(f => ({ ...f, semesterName: e.target.value }))}
                placeholder="e.g. Fall 2024"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input
                className="form-control"
                value={form.academicYear}
                onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                placeholder="e.g. 2024-25"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Status *</label>
              <select
                className="form-select"
                value={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))}
              >
                <option value="Y">Active (Open for Registration)</option>
                <option value="N">Inactive (Archived / Closed)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="form-control"
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                className="form-control"
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Semester' : 'Add Semester')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
