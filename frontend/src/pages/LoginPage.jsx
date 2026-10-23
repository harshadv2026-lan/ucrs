import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react'
import DemoBanner from '../components/common/DemoBanner.jsx'

const TABS = ['student', 'faculty', 'admin']

const demoCreds = {
  student: { label: 'Reg. No', id: '2021CS001', password: 'student123' },
  faculty: { label: 'Faculty ID', id: '1', password: 'faculty123' },
  admin: { label: 'Username', id: 'admin', password: 'admin123' }
}

export default function LoginPage() {
  const { login, isDemo } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('student')
  const [fields, setFields] = useState({ identifier: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setField(key, val) {
    setFields(prev => ({ ...prev, [key]: val }))
    if (error) setError('')
  }

  function buildCredentials() {
    const role = tab.toUpperCase()
    return { identifier: fields.identifier, password: fields.password, role }
  }

  function validate() {
    if (!fields.identifier.trim()) {
      setError(`${tab === 'student' ? 'Registration Number' : tab === 'faculty' ? 'Faculty ID' : 'Username'} is required`)
      return false
    }
    if (!fields.password) {
      setError('Password is required')
      return false
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    const result = await login(buildCredentials())
    setLoading(false)
    if (result.success) {
      navigate(`/${result.role}/dashboard`, { replace: true })
    } else {
      setError(result.message)
    }
  }

  function fillDemo() {
    const cred = demoCreds[tab]
    setFields({ identifier: cred.id, password: cred.password })
    setError('')
  }

  function handleTabChange(t) {
    setTab(t)
    setFields({ identifier: '', password: '' })
    setError('')
  }

  const idLabel = tab === 'student' ? 'Registration Number' : tab === 'faculty' ? 'Faculty ID (numeric)' : 'Username'
  const idPlaceholder = tab === 'student' ? 'e.g. 2021CS001' : tab === 'faculty' ? 'e.g. 1' : 'e.g. admin'

  return (
    <div className="login-page">
      <DemoBanner />

      <div className="login-header">
        <div className="login-logo">
          <GraduationCap size={36} color="white" />
        </div>
        <h1>UCRS</h1>
        <p>University Course Registration System</p>
      </div>

      <div className="login-card">
        <div className="login-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`login-tab ${tab === t ? 'active' : ''}`}
              onClick={() => handleTabChange(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{idLabel}</label>
            <input
              className={`form-control ${error && !fields.identifier ? 'error' : ''}`}
              type="text"
              placeholder={idPlaceholder}
              value={fields.identifier}
              onChange={e => setField('identifier', e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={`form-control ${error && !fields.password ? 'error' : ''}`}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={fields.password}
                onChange={e => setField('password', e.target.value)}
                style={{ paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gray-400)', display: 'flex', alignItems: 'center'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? <><div className="loading-spinner sm" style={{ borderTopColor: 'white' }} />Signing in...</>
              : <><LogIn size={16} />Sign In as {tab.charAt(0).toUpperCase() + tab.slice(1)}</>
            }
          </button>
        </form>

        <div className="demo-credentials">
          <h4>Demo Credentials</h4>
          {TABS.map(t => {
            const c = demoCreds[t]
            return (
              <div key={t} className="demo-cred-row">
                <span style={{ textTransform: 'capitalize', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>{t}:</span>
                <span>{c.label}: {c.id} | Pass: {c.password}</span>
              </div>
            )
          })}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 10, width: '100%' }}
            type="button"
            onClick={fillDemo}
          >
            Fill Demo Credentials ({tab})
          </button>
        </div>
      </div>
    </div>
  )
}
