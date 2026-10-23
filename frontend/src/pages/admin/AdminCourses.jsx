import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2 } from 'lucide-react'

const EMPTY = { courseId: '', courseName: '', credits: 3, description: '', deptId: '', prerequisites: [] }

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
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
      const [cRes, dRes] = await Promise.all([apiService.courses.getAll(), apiService.departments.getAll()])
      setCourses(Array.isArray(cRes.data?.data || cRes.data) ? (cRes.data?.data || cRes.data) : [])
      setDepartments(Array.isArray(dRes.data?.data || dRes.data) ? (dRes.data?.data || dRes.data) : [])
    } catch { setAlert({ type: 'error', message: 'Failed to load courses.' }) }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  function openEdit(c) {
    setEditing(c.courseId)
    setForm({ courseId: c.courseId, courseName: c.courseName, credits: c.credits, description: c.description || '', deptId: c.department?.deptId || c.deptId || '', prerequisites: (c.prerequisites || []).map(p => p.prereqCourseId || p) })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, credits: Number(form.credits), deptId: Number(form.deptId) }
      if (editing) await apiService.courses.update(editing, payload)
      else await apiService.courses.create(payload)
      setAlert({ type: 'success', message: editing ? 'Course updated.' : 'Course created.' })
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete course ${id}?`)) return
    try {
      await apiService.courses.delete(id)
      setAlert({ type: 'success', message: 'Course deleted.' })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' })
    }
  }

  function togglePrereq(courseId) {
    setForm(f => ({
      ...f,
      prerequisites: f.prerequisites.includes(courseId)
        ? f.prerequisites.filter(p => p !== courseId)
        : [...f.prerequisites, courseId]
    }))
  }

  const filtered = courses.filter(c =>
    `${c.courseId} ${c.courseName} ${c.department?.deptName}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner message="Loading courses..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1 className="page-title">Courses</h1><p className="page-subtitle">{courses.length} courses in catalogue</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Course</button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, name, department…" />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Course ID</th><th>Name</th><th>Credits</th><th>Department</th><th>Prerequisites</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No courses found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.courseId}>
                  <td><span className="badge badge-info">{c.courseId}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.courseName}</td>
                  <td><span className="badge badge-success">{c.credits} cr</span></td>
                  <td>{c.department?.deptName || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                    {(c.prerequisites || []).map(p => p.prereqCourseId || p).join(', ') || 'None'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.courseId)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add New Course'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Course ID *</label>
                <input className="form-control" required value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value.toUpperCase() }))} placeholder="e.g. CS301" />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: editing ? '1/-1' : 'auto' }}>
              <label className="form-label">Course Name *</label>
              <input className="form-control" required value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Credits *</label>
              <input className="form-control" type="number" min={1} max={6} required value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" required value={form.deptId} onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Prerequisites (select all that apply)</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.5rem' }}>
                {courses.filter(c => c.courseId !== form.courseId).map(c => (
                  <label key={c.courseId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 0', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={form.prerequisites.includes(c.courseId)} onChange={() => togglePrereq(c.courseId)} />
                    {c.courseId} — {c.courseName}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update' : 'Add Course')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
