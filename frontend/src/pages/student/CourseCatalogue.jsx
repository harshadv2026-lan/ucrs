import { useEffect, useState } from 'react'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import Modal from '../../components/common/Modal.jsx'
import { BookOpen, Users, Award, ChevronDown, Info } from 'lucide-react'

function SeatsBar({ enrolled, maxSeats }) {
  const pct = maxSeats > 0 ? Math.round((enrolled / maxSeats) * 100) : 0
  const colorClass = pct >= 90 ? 'low' : pct >= 60 ? 'medium' : 'high'
  return (
    <div className="seat-progress">
      <div className="seats-bar">
        <div className="seats-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} data-color={colorClass} />
      </div>
      <div className="seats-text">{enrolled ?? '?'} / {maxSeats ?? '?'} seats</div>
    </div>
  )
}

export default function CourseCatalogue() {
  const [offerings, setOfferings] = useState([])
  const [departments, setDepartments] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [filterCredits, setFilterCredits] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([
      apiService.offerings.getAll(),
      apiService.departments.getAll(),
      apiService.semesters.getAll()
    ]).then(([o, d, s]) => {
      setOfferings(Array.isArray(o.data?.data) ? o.data.data : Array.isArray(o.data) ? o.data : [])
      setDepartments(Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : [])
      setSemesters(Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = offerings.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (o.courseName || '').toLowerCase().includes(q) ||
      (o.courseId || '').toLowerCase().includes(q) ||
      (o.facultyName || '').toLowerCase().includes(q)
    const matchDept = !filterDept || String(o.departmentId) === filterDept
    const matchSem = !filterSem || String(o.semesterId) === filterSem
    const matchCredits = !filterCredits || String(o.credits) === filterCredits
    return matchSearch && matchDept && matchSem && matchCredits
  })

  const creditOptions = [...new Set(offerings.map(o => o.credits).filter(Boolean))].sort()

  return (
    <div>
      <div className="page-header">
        <h1>Course Catalogue</h1>
        <p>Browse all available course offerings this semester.</p>
      </div>

      <div className="filters-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by course name, ID, faculty..." />
        <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.departmentId || d.id} value={String(d.departmentId || d.id)}>{d.name || d.departmentName}</option>
          ))}
        </select>
        <select className="filter-select" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">All Semesters</option>
          {semesters.map(s => (
            <option key={s.semesterId || s.id} value={String(s.semesterId || s.id)}>{s.name || s.semesterName}</option>
          ))}
        </select>
        <select className="filter-select" value={filterCredits} onChange={e => setFilterCredits(e.target.value)}>
          <option value="">All Credits</option>
          {creditOptions.map(c => <option key={c} value={String(c)}>{c} Credits</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading courses..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No Courses Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filtered.map(offering => {
            const enrolled = offering.registeredCount ?? 0
            const pct = offering.maxSeats > 0 ? Math.round((enrolled / offering.maxSeats) * 100) : 0
            const colorClass = pct >= 90 ? 'low' : pct >= 60 ? 'medium' : 'high'
            return (
              <div key={offering.offeringId || offering.id} className="course-card">
                <div className="course-card-header">
                  <span className="course-card-name">{offering.courseName || offering.courseId}</span>
                  <span className="badge badge-navy">{offering.credits || '?'} cr</span>
                </div>

                <div className="course-card-meta">
                  <span><BookOpen size={13} />{offering.courseId}</span>
                  {offering.departmentName && <span><Award size={13} />{offering.departmentName}</span>}
                  {offering.facultyName && <span><Users size={13} />{offering.facultyName}</span>}
                  {offering.schedule && <span>🕐 {offering.schedule}</span>}
                </div>

                {offering.prerequisites && offering.prerequisites.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                    <strong>Prerequisites:</strong> {
                      Array.isArray(offering.prerequisites)
                        ? offering.prerequisites.join(', ')
                        : offering.prerequisites
                    }
                  </div>
                )}

                <div className="seat-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Seats Available</span>
                    <span style={{ fontWeight: 600 }}>
                      {Math.max(0, (offering.maxSeats || 0) - enrolled)} left
                    </span>
                  </div>
                  <div className="seats-bar">
                    <div className={`seats-bar-fill ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="seats-text">
                    {enrolled} / {offering.maxSeats || '?'} enrolled
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 4 }}
                  onClick={() => setSelected(offering)}
                >
                  <Info size={13} /> View Details
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.courseName || selected?.courseId || 'Course Details'}
        size="lg"
      >
        {selected && (
          <>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><div className="form-label">Course ID</div><div>{selected.courseId}</div></div>
                <div><div className="form-label">Credits</div><div><span className="badge badge-navy">{selected.credits}</span></div></div>
                <div><div className="form-label">Department</div><div>{selected.departmentName || '—'}</div></div>
                <div><div className="form-label">Semester</div><div>{selected.semesterName || '—'}</div></div>
                <div><div className="form-label">Faculty</div><div>{selected.facultyName || '—'}</div></div>
                <div><div className="form-label">Schedule</div><div>{selected.schedule || '—'}</div></div>
                <div><div className="form-label">Max Seats</div><div>{selected.maxSeats || '—'}</div></div>
                <div><div className="form-label">Enrolled</div><div>{selected.registeredCount ?? 0}</div></div>
              </div>
              {selected.description && (
                <div style={{ marginBottom: 16 }}>
                  <div className="form-label" style={{ marginBottom: 4 }}>Description</div>
                  <p style={{ color: 'var(--gray-700)', fontSize: 13.5 }}>{selected.description}</p>
                </div>
              )}
              {selected.prerequisites && selected.prerequisites.length > 0 && (
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>Prerequisites</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(Array.isArray(selected.prerequisites) ? selected.prerequisites : [selected.prerequisites]).map((p, i) => (
                      <span key={i} className="badge badge-warning">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
