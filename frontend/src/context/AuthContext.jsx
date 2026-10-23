import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ucrs_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const isDemo = user?.demoMode === true

  const login = useCallback(async (credentials) => {
    try {
      const response = await apiService.auth.login(credentials)
      const data = response.data

      // Support both {token, role, name, id, ...} directly or wrapped in data
      const userData = data.data || data
      const token = userData.token || data.token
      const role = (userData.role || data.role || '').toLowerCase()
      const name = userData.name || data.name || credentials.username || credentials.registrationNumber || credentials.facultyId || 'User'
      const id = userData.id || data.id || credentials.registrationNumber || credentials.facultyId || null
      const regNo = userData.registrationNumber || data.registrationNumber || null
      const facultyId = userData.facultyId || data.facultyId || null
      const demoMode = userData.demoMode || data.demoMode || false
      const departmentId = userData.departmentId || data.departmentId || null
      const semesterId = userData.semesterId || data.semesterId || null

      const userObj = {
        token,
        role,
        name,
        id,
        regNo,
        facultyId,
        demoMode,
        departmentId,
        semesterId
      }

      localStorage.setItem('ucrs_token', token)
      localStorage.setItem('ucrs_user', JSON.stringify(userObj))
      setUser(userObj)

      return { success: true, role }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please check your credentials.'
      return { success: false, message }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ucrs_token')
    localStorage.removeItem('ucrs_user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, login, logout, isDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
