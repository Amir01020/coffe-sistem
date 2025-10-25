import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  
  // Проверка валидности токена
  const isTokenValid = () => {
    const token = localStorage.getItem('token')
    const tokenExpiry = localStorage.getItem('token_expiry')
    
    if (!token || !tokenExpiry) {
      return false
    }
    
    const now = new Date().getTime()
    const expiryTime = parseInt(tokenExpiry)
    
    if (now > expiryTime) {
      // Токен истек - удаляем
      localStorage.removeItem('token')
      localStorage.removeItem('token_expiry')
      localStorage.removeItem('user_data')
      user.value = null
      return false
    }
    
    return true
  }
  
  // Инициализация пользователя из localStorage
  const initializeFromStorage = () => {
    if (isTokenValid()) {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          user.value = JSON.parse(userData)
          console.log('Пользователь загружен из localStorage:', user.value)
          return true
        } catch (error) {
          console.error('Ошибка парсинга user_data:', error)
          logout()
          return false
        }
      }
    }
    return false
  }
  
  const login = async (credentials) => {
    isLoading.value = true
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user: userData } = response.data.data
      
      // Сохраняем токен на 24 часа
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000) // 24 часа
      
      localStorage.setItem('token', token)
      localStorage.setItem('token_expiry', expiryTime.toString())
      localStorage.setItem('user_data', JSON.stringify(userData))
      
      user.value = userData
      
      console.log('Успешный вход, токен сохранен до:', new Date(expiryTime))
      
      return { success: true, user: userData }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Ошибка входа в систему' 
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchUser = async () => {
    if (!isTokenValid()) {
      throw new Error('Токен недействителен')
    }
    
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data
      
      user.value = userData
      localStorage.setItem('user_data', JSON.stringify(userData))
      
      return userData
    } catch (error) {
      // Если токен недействителен на сервере, очищаем локальные данные
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }
  
  const logout = () => {
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('user_data')
    console.log('Пользователь вышел из системы')
  }
  
  // Проверка авторизации (только проверка токена)
  const isAuthenticated = () => {
    return isTokenValid() && !!user.value
  }
  
  // Быстрая проверка токена без загрузки пользователя
  const hasValidToken = () => {
    return isTokenValid()
  }
  
  return {
    user,
    isLoading,
    login,
    fetchUser,
    logout,
    isAuthenticated,
    hasValidToken,
    initializeFromStorage
  }
})