import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - attach auth token and role
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ucrs_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    try {
      const user = JSON.parse(localStorage.getItem('ucrs_user') || '{}')
      if (user.role) {
        config.headers['X-User-Role'] = user.role.toUpperCase()
      }
    } catch (_) {}
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ucrs_token')
      localStorage.removeItem('ucrs_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const apiService = {
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout')
  },

  courses: {
    getAll: (params) => api.get('/courses', { params }),
    getById: (id) => api.get(`/courses/${id}`),
    create: (data) => api.post('/courses', data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`)
  },

  offerings: {
    getAll: (params) => api.get('/offerings', { params }),
    getById: (id) => api.get(`/offerings/${id}`),
    getStudents: (id) => api.get(`/offerings/${id}/students`),
    create: (data) => api.post('/offerings', data),
    update: (id, data) => api.put(`/offerings/${id}`, data),
    delete: (id) => api.delete(`/offerings/${id}`)
  },

  registrations: {
    getByStudent: (regNo) => api.get(`/registrations/${regNo}`),
    register: (data) => api.post('/registrations', data),
    drop: (regId) => api.delete(`/registrations/${regId}`),
    updateGrade: (regId, grade) => api.put(`/registrations/${regId}/grade`, { grade }),
    getCredits: (regNo) => api.get(`/registrations/${regNo}/credits`)
  },

  students: {
    getAll: () => api.get('/students'),
    getById: (regNo) => api.get(`/students/${regNo}`),
    create: (data) => api.post('/students', data),
    update: (regNo, data) => api.put(`/students/${regNo}`, data),
    delete: (regNo) => api.delete(`/students/${regNo}`)
  },

  faculty: {
    getAll: () => api.get('/faculty'),
    getById: (id) => api.get(`/faculty/${id}`),
    create: (data) => api.post('/faculty', data),
    update: (id, data) => api.put(`/faculty/${id}`, data),
    delete: (id) => api.delete(`/faculty/${id}`)
  },

  departments: {
    getAll: () => api.get('/departments'),
    getById: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`)
  },

  semesters: {
    getAll: () => api.get('/semesters'),
    getById: (id) => api.get(`/semesters/${id}`),
    create: (data) => api.post('/semesters', data),
    update: (id, data) => api.put(`/semesters/${id}`, data),
    delete: (id) => api.delete(`/semesters/${id}`)
  }
}

export default apiService
