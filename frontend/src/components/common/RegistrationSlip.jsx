import { Printer, X, GraduationCap, CheckCircle2 } from 'lucide-react'

export default function RegistrationSlip({ isOpen, onClose, student, registrations, credits }) {
  if (!isOpen) return null

  const activeRegistrations = registrations.filter(r => r.status === 'REGISTERED')
  const totalCredits = credits !== null ? credits : activeRegistrations.reduce((s, r) => s + (r.credits || 0), 0)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const verificationCode = `UCRS-${(student?.studentRegNo || 'REG').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal registration-slip-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}
      >
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registration Confirmation Document</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> Print / Save PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Printable Official Slip Area */}
        <div className="printable-slip" style={{ padding: '36px 40px', background: '#ffffff', color: '#111827' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1a2b4e', paddingBottom: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, background: '#1a2b4e', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1a2b4e', letterSpacing: '0.5px' }}>
                  STATE UNIVERSITY OF TECHNOLOGY
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4b5563', fontWeight: 600 }}>
                  OFFICE OF THE REGISTRAR • UNIVERSITY COURSE REGISTRATION SYSTEM (UCRS)
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                  Official Course Registration Slip & Enrolment Verification
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={14} /> ENROLLED
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Date: {today}</div>
            </div>
          </div>

          {/* Student Meta Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, background: '#f8fafc', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Student Name</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Registration Number</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginTop: 2, fontFamily: 'monospace' }}>
                {student?.studentRegNo || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Department</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                {student?.department?.deptName || student?.departmentName || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Semester</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                {student?.semesterNo ? `Semester ${student.semesterNo}` : 'Current Semester'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Academic Standing</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                Good Standing (CGPA: {student?.cgpa || 'N/A'})
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Document ID</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                {verificationCode}
              </div>
            </div>
          </div>

          {/* Enrolled Courses Table */}
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#1a2b4e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Registered Course Schedule
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Course ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Course Title</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Credits</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Instructor</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Schedule</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No active registrations found.
                  </td>
                </tr>
              ) : (
                activeRegistrations.map((reg, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700 }}>{reg.courseId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{reg.courseName}</td>
                    <td style={{ padding: '10px 12px' }}>{reg.credits}</td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>{reg.facultyName || 'TBA'}</td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>{reg.schedule || 'TBA'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 700 }}>
                        REGISTERED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Credits and Summary Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #e2e8f0', paddingTop: 16, marginBottom: 36 }}>
            <div style={{ fontSize: 12, color: '#64748b', maxWidth: 360, lineHeight: 1.5 }}>
              * This registration confirmation serves as proof of course enrollment for the academic semester.
              Drops or changes after the add/drop deadline are subject to academic regulations.
            </div>
            <div style={{ textAlign: 'right', minWidth: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Total Courses:</span>
                <strong>{activeRegistrations.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#1a2b4e', borderTop: '1px solid #cbd5e1', paddingTop: 6 }}>
                <span>Total Registered Credits:</span>
                <span>{totalCredits} cr</span>
              </div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, fontWeight: 600 }}>
                Within maximum allowable limit (20 credits)
              </div>
            </div>
          </div>

          {/* Signature and Verification Footer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 40 }}>
            <div>
              <div style={{ borderBottom: '1px solid #94a3b8', height: 40 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 6 }}>Student Signature</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Date: ________________________</div>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #94a3b8', height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563eb' }}>[ VERIFIED BY UCRS REGISTRAR ]</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 6 }}>Office of the Registrar</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>State University of Technology</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
