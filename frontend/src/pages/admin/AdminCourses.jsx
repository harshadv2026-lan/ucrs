import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, X, BookOpen } from 'lucide-react'

const EMPTY = {
  courseId: '',
  courseName: '',
  credits: 3,
  description: '',
  deptId: '',
  prerequisites: []
}

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

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [cRes, dRes] = await Promise.all([
        apiService.courses.getAll(),
        apiService.departments.getAll()
      ])
      const cData = Array.isArray(cRes.data?.data) ? cRes.data.data : (Array.isArray(cRes.data) ? cRes.data : [])
      const dData = Array.isArray(dRes.data?.data) ? dRes.data.data : (Array.isArray(dRes.data) ? dRes.data : [])
      setCourses(cData)
      setDepartments(dData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load courses from catalogue.' })
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditing(c.courseId)
    setForm({
      courseId: c.courseId,
      courseName: c.courseName || '',
      credits: c.credits || 3,
      description: c.description || '',
      deptId: c.department?.deptId ? String(c.department.deptId) : (c.deptId ? String(c.deptId) : ''),
      prerequisites: (c.prerequisites || []).map(p => (typeof p === 'string' ? p : (p.prereqCourseId || p)))
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.courseName.trim()) {
      setAlert({ type: 'error', message: 'Course name is required.' })
      return
    }
    if (!editing && !form.courseId.trim()) {
      setAlert({ type: 'error', message: 'Course ID is required.' })
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
        courseId: form.courseId.trim().toUpperCase(),
        courseName: form.courseName.trim(),
        credits: Number(form.credits),
        description: form.description.trim(),
        department: { deptId: deptIdNum },
        deptId: deptIdNum,
        prerequisites: form.prerequisites
      }

      if (editing) {
        await apiService.courses.update(editing, payload)
        setAlert({ type: 'success', message: `Course ${editing} updated successfully.` })
      } else {
        await apiService.courses.create(payload)
        setAlert({ type: 'success', message: `Course ${payload.courseId} created successfully.` })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save course.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete course ${id}? Active offerings, registrations, and prerequisites may be affected.`)) return
    try {
      await apiService.courses.delete(id)
      setAlert({ type: 'success', message: `Course ${id} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete course.' })
    }
  }

  function togglePrereq(targetCourseId) {
    setForm(f => ({
      ...f,
      prerequisites: f.prerequisites.includes(targetCourseId)
        ? f.prerequisites.filter(p => p !== targetCourseId)
        : [...f.prerequisites, targetCourseId]
    }))
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
  }

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const id = (c.courseId || '').toLowerCase()
    const name = (c.courseName || '').toLowerCase()
    const dept = (c.department?.deptName || '').toLowerCase()
    const desc = (c.description || '').toLowerCase()
    return id.includes(q) || name.includes(q) || dept.includes(q) || desc.includes(q)
  })

  if (loading) return <LoadingSpinner message="Loading courses..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Management</h1>
          <p className="page-subtitle">{courses.length} courses catalogued</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Course
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by course code, name, department, or description…"
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
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Department</th>
                <th>Prerequisites</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    {search ? `No courses match "${search}"` : 'No courses found in catalogue.'}
                  </td>
                </tr>
              ) : filtered.map(c => {
                const prereqList = (c.prerequisites || []).map(p => (typeof p === 'string' ? p : (p.prereqCourseId || p)))
                return (
                  <tr key={c.courseId}>
                    <td><span className="badge badge-info">{c.courseId}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.courseName}</div>
                      {c.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-success">{c.credits} cr</span></td>
                    <td>{c.department?.deptName || '—'}</td>
                    <td>
                      {prereqList.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {prereqList.map(pr => (
                            <span key={pr} className="badge" style={{ background: '#f1f5f9', color: '#15382E', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>
                              {pr}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" title="Edit Course" onClick={() => openEdit(c)}>
                          <Edit size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete Course" onClick={() => handleDelete(c.courseId)}>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Course ${editing}` : 'Add New Course'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input
                  className="form-control"
                  required
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CS302"
                />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: editing ? '1/-1' : 'auto' }}>
              <label className="form-label">Course Name *</label>
              <input
                className="form-control"
                required
                value={form.courseName}
                onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))}
                placeholder="e.g. Distributed Computing"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Credits (1–6) *</label>
              <input
                className="form-control"
                type="number"
                min={1}
                max={6}
                required
                value={form.credits}
                onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
              />
            </div>
            <div className="form-group">
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
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Course Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Overview, syllabus topics, or learning outcomes…"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Prerequisites (select all required)</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.6rem' }}>
                {courses.filter(c => c.courseId !== form.courseId).length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>No other courses available.</div>
                ) : courses.filter(c => c.courseId !== form.courseId).map(c => (
                  <label key={c.courseId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 0', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.prerequisites.includes(c.courseId)}
                      onChange={() => togglePrereq(c.courseId)}
                    />
                    <span style={{ fontWeight: 600 }}>{c.courseId}</span> — {c.courseName}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
