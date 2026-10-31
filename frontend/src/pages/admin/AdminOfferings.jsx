import { useState, useEffect } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { Plus, Edit, Trash2, X, Calendar, User, BookOpen } from 'lucide-react'

const EMPTY = { courseId: '', semesterId: '', facultyId: '', maxSeats: 60, schedule: '' }

export default function AdminOfferings() {
  const [offerings, setOfferings] = useState([])
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSem, setFilterSem] = useState('')
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
      const [oRes, cRes, sRes, fRes] = await Promise.all([
        apiService.offerings.getAll(),
        apiService.courses.getAll(),
        apiService.semesters.getAll(),
        apiService.faculty.getAll()
      ])
      const oData = Array.isArray(oRes.data?.data) ? oRes.data.data : (Array.isArray(oRes.data) ? oRes.data : [])
      const cData = Array.isArray(cRes.data?.data) ? cRes.data.data : (Array.isArray(cRes.data) ? cRes.data : [])
      const sData = Array.isArray(sRes.data?.data) ? sRes.data.data : (Array.isArray(sRes.data) ? sRes.data : [])
      const fData = Array.isArray(fRes.data?.data) ? fRes.data.data : (Array.isArray(fRes.data) ? fRes.data : [])
      setOfferings(oData)
      setCourses(cData)
      setSemesters(sData)
      setFaculty(fData)
    } catch {
      setAlert({ type: 'error', message: 'Failed to load course offerings.' })
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(o) {
    setEditing(o.offeringId)
    setForm({
      courseId: o.course?.courseId || o.courseId || '',
      semesterId: o.semester?.semesterId ? String(o.semester.semesterId) : (o.semesterId ? String(o.semesterId) : ''),
      facultyId: o.faculty?.facultyId ? String(o.faculty.facultyId) : (o.facultyId ? String(o.facultyId) : ''),
      maxSeats: o.maxSeats || 60,
      schedule: o.schedule || ''
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.courseId) {
      setAlert({ type: 'error', message: 'Please select a course.' })
      return
    }
    if (!form.semesterId) {
      setAlert({ type: 'error', message: 'Please select a semester.' })
      return
    }

    try {
      setSaving(true)
      const semId = Number(form.semesterId)
      const facId = form.facultyId ? Number(form.facultyId) : null
      const maxSeatsNum = Number(form.maxSeats) || 60

      const payload = {
        course: { courseId: form.courseId },
        semester: { semesterId: semId },
        faculty: facId ? { facultyId: facId } : null,
        courseId: form.courseId,
        semesterId: semId,
        facultyId: facId,
        maxSeats: maxSeatsNum,
        schedule: form.schedule.trim()
      }

      if (editing) {
        await apiService.offerings.update(editing, payload)
        setAlert({ type: 'success', message: `Offering #${editing} updated successfully.` })
      } else {
        await apiService.offerings.create(payload)
        setAlert({ type: 'success', message: 'Course offering scheduled successfully.' })
      }
      setModalOpen(false)
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save offering.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete offering #${id}? Registered students and scheduled time slots will be affected.`)) return
    try {
      await apiService.offerings.delete(id)
      setAlert({ type: 'success', message: `Offering #${id} deleted successfully.` })
      fetchAll()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete offering.' })
    }
  }

  const handleSearchChange = (val) => {
    const query = typeof val === 'string' ? val : (val?.target?.value ?? '')
    setSearch(query)
  }

  const filtered = offerings.filter(o => {
    const matchesSem = !filterSem || String(o.semesterId || o.semester?.semesterId) === filterSem
    const courseId = (o.courseId || o.course?.courseId || '').toLowerCase()
    const courseName = (o.courseName || o.course?.courseName || '').toLowerCase()
    const facultyName = (o.facultyName || (o.faculty ? `${o.faculty.firstName} ${o.faculty.lastName}` : '')).toLowerCase()
    const schedule = (o.schedule || '').toLowerCase()
    const q = search.toLowerCase()
    const matchesSearch = !q || courseId.includes(q) || courseName.includes(q) || facultyName.includes(q) || schedule.includes(q)
    return matchesSem && matchesSearch
  })

  if (loading) return <LoadingSpinner message="Loading course offerings..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Offerings</h1>
          <p className="page-subtitle">{offerings.length} scheduled section offerings</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Offering
        </button>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by course code, title, faculty, or schedule…"
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s.semesterId} value={s.semesterId}>
                {s.semesterName} {s.isActive === 'Y' || s.isActive === true ? '(Active)' : ''}
              </option>
            ))}
          </select>
          {(search || filterSem) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setFilterSem('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={14} /> Reset Filters
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Course</th>
                <th>Faculty Instructor</th>
                <th>Semester</th>
                <th>Schedule</th>
                <th>Seat Occupancy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
                    No offerings found matching your search or filters.
                  </td>
                </tr>
              ) : filtered.map(o => {
                const max = o.maxSeats || 60
                const enrolled = o.registeredCount ?? 0
                const pct = Math.min(100, Math.round((enrolled / max) * 100))
                const courseCode = o.courseId || o.course?.courseId
                const courseTitle = o.courseName || o.course?.courseName || '—'
                const facultyDisplay = o.facultyName || (o.faculty ? `${o.faculty.firstName} ${o.faculty.lastName}` : 'Unassigned')
                const semDisplay = o.semesterName || o.semester?.semesterName || '—'

                return (
                  <tr key={o.offeringId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{o.offeringId}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{courseTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{courseCode}</div>
                    </td>
                    <td>{facultyDisplay}</td>
                    <td>{semDisplay}</td>
                    <td style={{ fontSize: '0.85rem' }}>{o.schedule || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                        <span><strong>{enrolled}</strong> / {max} seats</span>
                        <span style={{ color: pct >= 90 ? '#dc2626' : 'var(--gray-600)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '99px', width: '100px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '99px',
                            width: `${pct}%`,
                            background: pct >= 90 ? '#dc2626' : (pct >= 50 ? '#D4A72C' : '#21865B')
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" title="Edit Offering" onClick={() => openEdit(o)}>
                          <Edit size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete Offering" onClick={() => handleDelete(o.offeringId)}>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Offering #${editing}` : 'Add Course Offering'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Course *</label>
              <select
                className="form-select"
                required
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseId} — {c.courseName} ({c.credits} cr)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select
                className="form-select"
                required
                value={form.semesterId}
                onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))}
              >
                <option value="">Select semester</option>
                {semesters.map(s => (
                  <option key={s.semesterId} value={s.semesterId}>
                    {s.semesterName} {s.isActive === 'Y' || s.isActive === true ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Faculty Instructor</label>
              <select
                className="form-select"
                value={form.facultyId}
                onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}
              >
                <option value="">Select faculty (Optional)</option>
                {faculty.map(f => (
                  <option key={f.facultyId} value={f.facultyId}>
                    {f.firstName} {f.lastName} ({f.department?.deptName || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Seats *</label>
              <input
                className="form-control"
                type="number"
                min={1}
                max={500}
                required
                value={form.maxSeats}
                onChange={e => setForm(f => ({ ...f, maxSeats: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weekly Schedule</label>
              <input
                className="form-control"
                value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                placeholder="e.g. Mon/Wed 10:00-11:30, Room 301"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (editing ? 'Update Offering' : 'Add Offering')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
