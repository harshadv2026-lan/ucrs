import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import apiService from '../../services/api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import AlertMessage from '../../components/common/AlertMessage.jsx'
import { BookOpen, ChevronDown, ChevronUp, Users } from 'lucide-react'

export default function FacultyOfferings() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [studentLists, setStudentLists] = useState({})
  const [loadingStudents, setLoadingStudents] = useState({})

  useEffect(() => {
    async function fetchOfferings() {
      try {
        setLoading(true)
        const res = await apiService.offerings.getAll({ facultyId: user?.facultyId || user?.id })
        const data = res.data?.data || res.data || []
        setOfferings(Array.isArray(data) ? data : [])
      } catch {
        setError('Failed to load offerings.')
      } finally {
        setLoading(false)
      }
    }
    fetchOfferings()
  }, [user])

  async function toggleExpand(offeringId) {
    if (expandedId === offeringId) {
      setExpandedId(null)
      return
    }
    setExpandedId(offeringId)
    if (!studentLists[offeringId]) {
      setLoadingStudents(prev => ({ ...prev, [offeringId]: true }))
      try {
        const res = await apiService.offerings.getStudents(offeringId)
        const students = res.data?.data || res.data || []
        setStudentLists(prev => ({ ...prev, [offeringId]: Array.isArray(students) ? students : [] }))
      } catch {
        setStudentLists(prev => ({ ...prev, [offeringId]: [] }))
      } finally {
        setLoadingStudents(prev => ({ ...prev, [offeringId]: false }))
      }
    }
  }

  if (loading) return <LoadingSpinner message="Loading your offerings..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Course Offerings</h1>
          <p className="page-subtitle">View students enrolled in your courses</p>
        </div>
      </div>

      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

      {offerings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No course offerings assigned to you.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {offerings.map((offering) => (
            <div key={offering.offeringId} className="card" style={{ padding: 0 }}>
              <div
                style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => toggleExpand(offering.offeringId)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)' }}>
                    {offering.courseName || offering.course?.courseName || 'Unknown Course'}
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: 'var(--sky)', color: 'var(--blue)', padding: '2px 8px', borderRadius: '99px' }}>
                      {offering.courseId || offering.course?.courseId}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--gray-400)', display: 'flex', gap: '1.5rem' }}>
                    <span>📅 {offering.semesterName || offering.semester?.semesterName || 'N/A'}</span>
                    <span>🕐 {offering.schedule || 'No schedule'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={13} />
                      {offering.registeredCount ?? offering.enrolledCount ?? 0} / {offering.maxSeats || 60} seats
                    </span>
                  </div>
                </div>
                {expandedId === offering.offeringId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {expandedId === offering.offeringId && (
                <div style={{ borderTop: '1px solid var(--gray-200)', padding: '1rem 1.5rem' }}>
                  {loadingStudents[offering.offeringId] ? (
                    <LoadingSpinner message="Loading students..." />
                  ) : (
                    <>
                      <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--gray-700)' }}>
                        Enrolled Students ({(studentLists[offering.offeringId] || []).length})
                      </h3>
                      {(studentLists[offering.offeringId] || []).length === 0 ? (
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No students enrolled yet.</p>
                      ) : (
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Reg No</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(studentLists[offering.offeringId] || []).map((s, i) => {
                                const regNo = s.student?.studentRegNo || s.studentRegNo || '—'
                                const name = s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() : (s.studentName || s.firstName || '—')
                                const dept = s.student?.department?.deptName || s.department?.deptName || s.deptName || '—'
                                return (
                                  <tr key={s.regId || regNo || i}>
                                    <td style={{ fontFamily: 'monospace' }}>{regNo}</td>
                                    <td>{name}</td>
                                    <td>{dept}</td>
                                    <td>
                                      <span className={`badge badge-${s.status === 'REGISTERED' ? 'info' : s.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                                        {s.status || 'REGISTERED'}
                                      </span>
                                    </td>
                                    <td>{s.grade || '—'}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
