import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardList,
  Users, BookMarked, Award, Settings, LogOut, Menu, X,
  Building2, CalendarDays, Layers, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'Course Catalogue', icon: BookOpen },
  { to: '/student/register', label: 'Course Registration', icon: ClipboardList },
  { to: '/student/my-registrations', label: 'My Registrations', icon: BookMarked },
  { to: '/student/timetable', label: 'My Timetable', icon: CalendarDays }
]

const facultyLinks = [
  { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/faculty/offerings', label: 'My Offerings', icon: Layers },
  { to: '/faculty/grades', label: 'Grade Management', icon: Award }
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/semesters', label: 'Semesters', icon: CalendarDays },
  { to: '/admin/offerings', label: 'Offerings', icon: Layers }
]

function getLinks(role) {
  if (role === 'student') return studentLinks
  if (role === 'faculty') return facultyLinks
  if (role === 'admin') return adminLinks
  return []
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'
}

export default function Sidebar({ isDemo }) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = getLinks(user?.role)
  const roleLabel = { student: 'Student Portal', faculty: 'Faculty Portal', admin: 'Admin Portal' }[user?.role] || 'Portal'

  return (
    <>
      <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${isDemo ? 'demo-offset' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} color="white" />
          </div>
          <div className="sidebar-logo-text">
            <h2>UCRS</h2>
            <p>{roleLabel}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 8 }}>System</div>
          <NavLink
            to="/about"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={17} />
            <span>About UCRS</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">
                {user?.role} {user?.regNo ? `• ${user.regNo}` : user?.facultyId ? `• ID:${user.facultyId}` : ''}
              </div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
