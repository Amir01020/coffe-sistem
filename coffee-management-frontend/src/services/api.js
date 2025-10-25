import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.response?.status === 401) {
      // Только очищаем токен, не редиректим автоматически
      localStorage.removeItem('token')
      
      // Редиректим только если мы не на странице логина
      // и только если это не запрос для проверки пользователя
      const isAuthRequest = error.config?.url?.includes('/auth/')
      const isOnLoginPage = window.location.pathname === '/login'
      
      if (!isAuthRequest && !isOnLoginPage) {
        console.log('Redirecting to login due to 401')
        window.location.href = '/login'
      }
    }
    
    // Если сервер недоступен
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.error('Сервер недоступен')
    }
    
    return Promise.reject(error)
  }
)

export default api