import { useNavigate } from 'react-router-dom'
import { BookOpen, Server, Database, CheckCircle, GraduationCap, Users, Shield, Share2, Sparkles, Layers } from 'lucide-react'

const TECH_STACK = [
  { name: 'React.js + Vite', role: 'Frontend UI', color: '#21865B', desc: 'Modern responsive SPA with interactive dashboards and timetable visualization' },
  { name: 'Spring Boot 3', role: 'REST API Backend', color: '#15382E', desc: 'Enterprise Java 17 framework with transactional service architecture' },
  { name: 'H2 Relational Database', role: 'Registrations & ACID Ops', color: '#21865B', desc: 'In-memory RDBMS providing pessimistic locking, seat counts & credit limits' },
  { name: 'Neo4j Graph Database', role: 'Prerequisites & Recommendations', color: '#D4A72C', desc: 'Native Bolt graph engine executing Cypher traversals for prerequisite trees and AI recommendations' },
  { name: 'Oracle SQL / PL-SQL', role: 'Enterprise Target (Optional / Planned)', color: '#475569', desc: 'Optional production deployment target with complete schema, packages and triggers ready' },
  { name: 'Spring Data JPA & Bolt Driver', role: 'Polyglot Persistence Layer', color: '#15382E', desc: 'Unified repository and driver layer coordinating relational and graph stores' }
]

const GRAPH_NODES = [
  { label: 'Course', desc: 'Node representing an academic course with ID, title, credits, department' },
  { label: 'Student', desc: 'Node representing an enrolled student with regNo, name, department, CGPA' },
  { label: 'Topic', desc: 'Knowledge domain node (e.g., Algorithms, Cloud, AI, Security, Networks)' },
  { label: 'Department', desc: 'Academic division node (e.g., Computer Science, IT, Electronics)' }
]

const GRAPH_RELS = [
  { name: 'REQUIRES_PREREQUISITE / PREREQUISITE_OF', desc: 'Bi-directional prerequisite graph edges linking courses for DAG traversal' },
  { name: 'COVERS_TOPIC', desc: 'Course-to-topic semantic mapping for interest-based relevance scoring' },
  { name: 'MAJORS_IN / OFFERED_BY', desc: 'Departmental alignment linking students and courses to academic departments' },
  { name: 'COMPLETED / CURRENTLY_ENROLLED', desc: 'Academic history edges tracking past grades and active semester courses' }
]

const RELATIONAL_TABLES = [
  { name: 'DEPARTMENT', desc: 'Dept_ID (PK), Dept_Name, HOD_ID (FK to FACULTY, safely deferred)' },
  { name: 'FACULTY', desc: 'Faculty_ID (PK), First/Last Name, Email, Phone, Designation, Dept_ID (FK)' },
  { name: 'STUDENT', desc: 'Student_RegNo (PK), Name, Email, DOB, Gender, Dept_ID (FK), Semester_No, CGPA' },
  { name: 'COURSE', desc: 'Course_ID (PK), Course_Name, Credits (1–6), Description, Dept_ID (FK)' },
  { name: 'SEMESTER', desc: 'Semester_ID (PK), Name, Academic_Year, Start_Date, End_Date, Is_Active' },
  { name: 'COURSE_OFFERING', desc: 'Offering_ID (PK), Course_ID (FK), Semester_ID (FK), Faculty_ID (FK), Max_Seats, Schedule' },
  { name: 'REGISTRATION', desc: 'Reg_ID (PK), Student_RegNo (FK), Offering_ID (FK), Date, Grade, Status; UNIQUE(RegNo, Offering)' },
  { name: 'PREREQUISITE', desc: 'Course_ID + Prereq_Course_ID (Composite PK, both FK to COURSE)' }
]

const FEATURES = [
  'Role-based access control: Student, Faculty, and Administrator dashboards',
  'ACID-compliant course registration with pessimistic row locking (zero double-booking)',
  'Enforced 20-credit maximum semester limit and prerequisite validation in H2',
  'Neo4j graph traversals for recursive prerequisite tree resolution and path validation',
  'Neo4j course recommendation engine with topic interest scoring and unmet prerequisite alerts',
  'Polyglot synchronization: relational changes mirror instantaneously into Neo4j graph',
  'Safe transactional admin deletion with dependency pre-checks preserving academic records',
  'Conflict-free timetable generation with schedule collision detection',
  'Real-time seat occupancy analytics and downloadable registration confirmations',
  'Demo mode with in-memory H2 database and dual live/embedded Neo4j Bolt support',
  'Swagger OpenAPI 3 interactive documentation for all REST endpoints',
  'Deep Emerald, Forest Green, and Warm Gold unified theme'
]

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', desc: 'Authentication (Student / Faculty / Admin)' },
  { method: 'GET', path: '/api/recommendations/{regNo}', desc: 'Neo4j course recommendations with interest matching and prerequisite validation' },
  { method: 'GET', path: '/api/recommendations/status', desc: 'Live Neo4j Bolt connection status, engine mode, node/edge counts and Cypher history' },
  { method: 'POST', path: '/api/recommendations/sync', desc: 'Manually synchronize relational entities into Neo4j graph nodes and edges' },
  { method: 'GET', path: '/api/courses', desc: 'List courses with department filters and search' },
  { method: 'DELETE', path: '/api/courses/{id}', desc: 'Admin delete course (protected: blocks deletion if prerequisite for other courses or offerings exist)' },
  { method: 'GET', path: '/api/offerings', desc: 'Course offerings with live available seat counts' },
  { method: 'DELETE', path: '/api/offerings/{id}', desc: 'Admin delete offering (protected: blocks deletion if students are registered)' },
  { method: 'POST', path: '/api/registrations', desc: 'Transactional course registration with pessimistic lock and credit checks' },
  { method: 'DELETE', path: '/api/registrations/{id}', desc: 'Drop registration (releases seat count back to available capacity)' },
  { method: 'DELETE', path: '/api/students/{regNo}', desc: 'Admin delete student (protected: blocks deletion if completed grades or active enrollments exist)' },
  { method: 'DELETE', path: '/api/faculty/{id}', desc: 'Admin delete faculty (protected: blocks deletion if assigned to active offerings)' },
  { method: 'DELETE', path: '/api/departments/{id}', desc: 'Admin delete department (protected: blocks deletion if students, faculty, or courses exist)' },
  { method: 'DELETE', path: '/api/semesters/{id}', desc: 'Admin delete semester (protected: blocks deletion if active or contains offerings)' },
  { method: 'GET', path: '/api/admin/stats', desc: 'System-wide summary metrics for students, faculty, courses and offerings' }
]

const METHOD_COLORS = { GET: '#21865B', POST: '#21865B', PUT: '#D4A72C', DELETE: '#ef4444' }

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D241D 0%, #15382E 50%, #21865B 100%)', color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(33,134,91,0.25)', border: '2px solid #D4A72C', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={40} color="#D4A72C" />
          </div>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>University Course Registration System</h1>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', maxWidth: '720px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          An advanced full-stack university management platform utilizing <strong>React + Vite</strong>, <strong>Spring Boot 3</strong>, 
          <strong> H2 Relational Database</strong> for transactional registrations, and <strong>Neo4j Graph Database</strong> for recursive 
          prerequisite hierarchies and intelligent course recommendations.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2.25rem', background: '#D4A72C', color: '#15382E', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          Launch UCRS Portal
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Tech Stack */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Server size={22} color="#21865B" /> Technology Stack &amp; Architecture
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {TECH_STACK.map(t => (
              <div key={t.name} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: t.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.role}</span>
                  {t.name.includes('Neo4j') && <span style={{ background: '#D4A72C20', color: '#D4A72C', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>Live Graph</span>}
                  {t.name.includes('Optional') && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>Planned</span>}
                </div>
                <div style={{ fontWeight: 700, color: '#15382E', fontSize: '1.05rem', marginBottom: '0.4rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why H2 and Neo4j Work Together (Polyglot Architecture) */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Share2 size={22} color="#D4A72C" /> Polyglot Persistence: Why H2 &amp; Neo4j Work Together
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '14px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ color: 'var(--gray-700)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              UCRS employs a <strong>Polyglot Persistence</strong> architecture, combining the strengths of relational and graph database models. 
              Each storage engine handles the workloads for which it is fundamentally optimized:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Database size={20} color="#21865B" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15382E' }}>H2 Relational Database (ACID Engine)</h3>
                </div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.5 }}>
                  <li><strong>Seat Inventory Locks:</strong> Uses pessimistic write locking (<code>PESSIMISTIC_WRITE</code>) to eliminate race conditions and avoid double-booking limited classroom seats during high-traffic registration windows.</li>
                  <li><strong>Credit Cap Enforcement:</strong> Instantly sums active course credits to ensure no student exceeds the strict 20-credit semester cap.</li>
                  <li><strong>Transactional Integrity:</strong> Ensures atomic rollbacks if any registration rule, constraint, or foreign-key dependency check fails.</li>
                  <li><strong>Oracle SQL Ready:</strong> Identical relational schema can be repointed to an Oracle 19c/21c database for production deployments.</li>
                </ul>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={20} color="#D4A72C" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15382E' }}>Neo4j Graph Database (Traversal Engine)</h3>
                </div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.5 }}>
                  <li><strong>Recursive Prerequisite DAG:</strong> Prerequisite chains are naturally modeled as directed edges (<code>c-[:REQUIRES_PREREQUISITE*]-&gt;p</code>), eliminating expensive multi-table recursive SQL self-joins.</li>
                  <li><strong>Personalized Recommendation Scoring:</strong> Evaluates completed courses, department curriculum rules, topic interest alignments (<code>COVERS_TOPIC</code>), and remaining credit headroom in a single Cypher query.</li>
                  <li><strong>Explainable Unmet Prerequisites:</strong> Traverses prerequisite paths in real time to show students exactly which foundational courses they still need.</li>
                  <li><strong>Dual Live/Embedded Support:</strong> Seamlessly operates over live Bolt (<code>bolt://localhost:7687</code>) or embedded property graph fallback.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Data Model: Relational & Graph */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="#21865B" /> Dual Data Models
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Relational Schema */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15382E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Database size={17} color="#21865B" /> Relational Schema (8 Tables)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {RELATIONAL_TABLES.map(t => (
                  <div key={t.name} style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ background: '#15382E', color: '#D4A72C', fontFamily: 'monospace', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.4 }}>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neo4j Graph Model */}
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15382E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Share2 size={17} color="#D4A72C" /> Neo4j Graph Schema (Nodes &amp; Edges)
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.4rem' }}>Node Labels</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {GRAPH_NODES.map(n => (
                    <div key={n.label} style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.65rem 0.9rem' }}>
                      <span style={{ background: '#21865B', color: 'white', fontFamily: 'monospace', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>:{n.label}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{n.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.4rem' }}>Relationship Types</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {GRAPH_RELS.map(r => (
                    <div key={r.name} style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.65rem 0.9rem' }}>
                      <span style={{ background: '#D4A72C', color: '#15382E', fontFamily: 'monospace', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>[:{r.name}]</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle size={22} color="#21865B" /> Key Features &amp; Capabilities
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
                  <CheckCircle size={16} color="#21865B" style={{ flexShrink: 0, marginTop: '3px' }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={22} color="#21865B" /> Primary REST API Endpoints
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid var(--gray-200)', fontSize: '0.825rem', color: 'var(--gray-600)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>Base URL: <code style={{ fontWeight: 700, color: '#15382E' }}>http://localhost:8080</code></span>
              <span>OpenAPI Swagger UI: <code style={{ fontWeight: 700, color: '#21865B' }}>/swagger-ui/index.html</code></span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600, width: '90px' }}>Method</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>Endpoint Path</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((ep, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: METHOD_COLORS[ep.method] + '18', color: METHOD_COLORS[ep.method], fontWeight: 700, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>{ep.method}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#15382E', fontWeight: 600 }}>{ep.path}</td>
                      <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.4 }}>{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Demo Credentials */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15382E', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={22} color="#D4A72C" /> Demo Portal Credentials
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { role: 'Student', id: '2021CS001', pass: 'student123', icon: GraduationCap, color: '#21865B', desc: 'Browse courses, register, view timetable, and get Neo4j recommendations' },
              { role: 'Faculty', id: 'alice.johnson@ucrs.edu', pass: 'faculty123', icon: Users, color: '#15382E', desc: 'Manage assigned offerings, grade enrolled students, view rosters' },
              { role: 'Administrator', id: 'admin', pass: 'admin123', icon: Shield, color: '#D4A72C', desc: 'Full system CRUD with dependency protection and enrollment analytics' }
            ].map(cred => (
              <div key={cred.role} style={{ background: 'white', border: `2px solid ${cred.color}30`, borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${cred.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cred.color }}>
                    <cred.icon size={18} />
                  </div>
                  <span style={{ fontWeight: 700, color: cred.color, fontSize: '1rem' }}>{cred.role}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.75rem', lineHeight: 1.4 }}>{cred.desc}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                  <div><strong>Username / ID:</strong> <code style={{ color: '#15382E', fontWeight: 600 }}>{cred.id}</code></div>
                  <div><strong>Password:</strong> <code style={{ color: '#15382E', fontWeight: 600 }}>{cred.pass}</code></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem', padding: '1.5rem 0', borderTop: '1px solid var(--gray-200)' }}>
          UCRS — University Course Registration System • Polyglot DBMS Project • React + Vite • Spring Boot • H2 &amp; Neo4j
        </div>
      </div>
    </div>
  )
}
