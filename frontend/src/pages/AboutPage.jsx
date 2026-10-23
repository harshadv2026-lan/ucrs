import { useNavigate } from 'react-router-dom'
import { BookOpen, Server, Database, CheckCircle, GraduationCap, Users, Shield } from 'lucide-react'

const TECH_STACK = [
  { name: 'React.js + Vite', role: 'Frontend UI', color: '#61dafb', bg: '#20232a' },
  { name: 'Spring Boot 3', role: 'REST API Backend', color: '#6db33f', bg: '#ffffff' },
  { name: 'Oracle SQL/PL SQL', role: 'Primary Database', color: '#f80000', bg: '#ffffff' },
  { name: 'H2 (Demo Mode)', role: 'In-memory DB', color: '#2563eb', bg: '#f0f4ff' },
  { name: 'Spring Data JPA', role: 'ORM / JDBC', color: '#6db33f', bg: '#f0fff4' },
  { name: 'Swagger / OpenAPI', role: 'API Docs', color: '#85ea2d', bg: '#1b1b1b' }
]

const TABLES = [
  { name: 'DEPARTMENT', desc: 'Dept_ID (PK), Dept_Name, HOD_ID (FK→FACULTY, deferred)' },
  { name: 'FACULTY', desc: 'Faculty_ID (PK), First/Last Name, Email, Phone, Designation, Dept_ID (FK)' },
  { name: 'STUDENT', desc: 'Student_RegNo (PK), Name, Email, DOB, Gender, Dept_ID (FK), Semester_No, CGPA' },
  { name: 'COURSE', desc: 'Course_ID (PK), Course_Name, Credits (1–6), Description, Dept_ID (FK)' },
  { name: 'SEMESTER', desc: 'Semester_ID (PK), Name, Academic_Year, Start_Date, End_Date, Is_Active' },
  { name: 'COURSE_OFFERING', desc: 'Offering_ID (PK), Course_ID (FK), Semester_ID (FK), Faculty_ID (FK), Max_Seats, Schedule' },
  { name: 'REGISTRATION', desc: 'Reg_ID (PK), Student_RegNo (FK), Offering_ID (FK), Date, Grade, Status; UNIQUE(RegNo, Offering)' },
  { name: 'PREREQUISITE', desc: 'Course_ID + Prereq_Course_ID (Composite PK, both FK→COURSE)' }
]

const FEATURES = [
  'Role-based access control: Student, Faculty, Admin',
  'Course registration with backend + database validation',
  'Seat availability check with pessimistic locking (no double-booking)',
  'Prerequisite enforcement before registration',
  'Grade management with trigger preventing grade on dropped courses',
  'PL/SQL: REGISTER_STUDENT procedure, GET_TOTAL_CREDITS function',
  'Explicit cursor for listing course offerings',
  'Demo mode with H2 in-memory database (no Oracle needed)',
  'Full admin CRUD: Students, Faculty, Courses, Departments, Semesters, Offerings',
  'Responsive design: Mobile, Tablet, Desktop',
  'Swagger UI for API testing',
  'Centralized error handling with meaningful messages'
]

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', desc: 'Login (Student / Faculty / Admin)' },
  { method: 'GET', path: '/api/courses', desc: 'List all courses (filter: deptId, search)' },
  { method: 'GET', path: '/api/offerings', desc: 'List offerings (filter: semesterId, facultyId)' },
  { method: 'GET', path: '/api/offerings/{id}/students', desc: 'Students in an offering (Faculty/Admin)' },
  { method: 'GET', path: '/api/students/{regNo}', desc: 'Student profile' },
  { method: 'GET', path: '/api/registrations/{regNo}', desc: "Student's registrations" },
  { method: 'POST', path: '/api/registrations', desc: 'Register for a course (validated)' },
  { method: 'DELETE', path: '/api/registrations/{id}', desc: 'Drop a registration' },
  { method: 'PUT', path: '/api/registrations/{id}/grade', desc: 'Assign a grade (Faculty/Admin)' },
  { method: 'GET', path: '/api/registrations/{regNo}/credits', desc: 'Total credit hours' },
  { method: 'GET', path: '/api/admin/stats', desc: 'System-wide counts (Admin)' }
]

const METHOD_COLORS = { GET: '#10b981', POST: '#2563eb', PUT: '#f59e0b', DELETE: '#ef4444' }

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a2b4e 0%, #2a3d66 100%)', color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={40} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>University Course Registration System</h1>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.75)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          A full-stack DBMS project implementing Oracle SQL, PL/SQL, Spring Boot REST API, and React.js for managing university course registrations.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem', background: 'white', color: '#1a2b4e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
          Go to Login
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Tech Stack */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={22} /> Technology Stack
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem' }}>
            {TECH_STACK.map(t => (
              <div key={t.name} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.role}</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.95rem' }}>{t.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Database Schema */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={22} /> Database Schema (8 Tables)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {TABLES.map(t => (
              <div key={t.name} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ background: '#1a2b4e', color: 'white', fontFamily: 'monospace', fontSize: '0.8rem', padding: '3px 10px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.name}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>{t.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={22} /> Key Features
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '0.75rem' }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} /> API Endpoints
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.25rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              Base URL: <code>http://localhost:8080</code> | Swagger UI: <code>/swagger-ui/index.html</code>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>Method</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>Path</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((ep, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: METHOD_COLORS[ep.method] + '18', color: METHOD_COLORS[ep.method], fontWeight: 700, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>{ep.method}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--gray-700)' }}>{ep.path}</td>
                    <td style={{ padding: '10px 16px', fontSize: '0.875rem', color: 'var(--gray-600)' }}>{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Demo Credentials */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={22} /> Demo Login Credentials
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
            {[
              { role: 'Student', id: '2021CS001', pass: 'student123', icon: GraduationCap, color: '#2563eb' },
              { role: 'Faculty', id: 'alice.johnson@ucrs.edu', pass: 'faculty123', icon: Users, color: '#10b981' },
              { role: 'Admin', id: 'admin', pass: 'admin123', icon: Shield, color: '#8b5cf6' }
            ].map(cred => (
              <div key={cred.role} style={{ background: 'white', border: `2px solid ${cred.color}30`, borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${cred.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cred.color }}>
                    <cred.icon size={18} />
                  </div>
                  <span style={{ fontWeight: 700, color: cred.color }}>{cred.role}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>ID/Email:</strong> <code style={{ background: 'var(--gray-100)', padding: '1px 6px', borderRadius: '4px' }}>{cred.id}</code></div>
                  <div><strong>Password:</strong> <code style={{ background: 'var(--gray-100)', padding: '1px 6px', borderRadius: '4px' }}>{cred.pass}</code></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem', padding: '1rem 0' }}>
          UCRS — University Course Registration System • DBMS Project • Built with React + Spring Boot + Oracle SQL
        </div>
      </div>
    </div>
  )
}
