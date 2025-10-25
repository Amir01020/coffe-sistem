import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { getRemainingTime } from '@/utils/formatters'

export const useVipSessionsStore = defineStore('vipSessions', () => {
  const activeSessions = ref([])
  const expiringSessions = ref([])
  const isLoading = ref(false)
  
  // Computed
  const activeSessionsWithTimers = computed(() => {
    return activeSessions.value.map(session => ({
      ...session,
      remaining_time: getRemainingTime(session.end_time),
      is_expiring: new Date(session.end_time) - new Date() < 30 * 60 * 1000, // 30 минут
      is_expired: new Date(session.end_time) <= new Date()
    }))
  })
  
  const expiredSessions = computed(() => {
    return activeSessionsWithTimers.value.filter(session => session.is_expired)
  })
  
  const totalActiveRevenue = computed(() => {
    return activeSessions.value.reduce((total, session) => {
      return total + (session.paid_amount || 0) + (session.total_orders_amount || 0)
    }, 0)
  })
  
  // Actions
  const fetchActiveSessions = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/vip-sessions/active')
      activeSessions.value = response.data.data
      return activeSessions.value
    } catch (error) {
      console.error('Ошибка при загрузке VIP сессий:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchExpiringSessions = async () => {
    try {
      const response = await api.get('/vip-sessions/expiring')
      expiringSessions.value = response.data.data
      return expiringSessions.value
    } catch (error) {
      console.error('Ошибка при загрузке истекающих сессий:', error)
      throw error
    }
  }
  
  const createSession = async (sessionData) => {
    isLoading.value = true
    try {
      const response = await api.post('/vip-sessions', sessionData)
      const newSession = response.data.data
      activeSessions.value.push(newSession)
      return { success: true, session: newSession }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании VIP сессии'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const extendSession = async (sessionId, extensionData) => {
    isLoading.value = true
    try {
      const response = await api.put(`/vip-sessions/${sessionId}/extend`, extensionData)
      const updatedSession = response.data.data
      
      // Обновляем сессию в списке
      const index = activeSessions.value.findIndex(s => s.id === sessionId)
      if (index > -1) {
        activeSessions.value[index] = updatedSession
      }
      
      return { success: true, session: updatedSession }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при продлении сессии'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const closeSession = async (sessionId) => {
    isLoading.value = true
    try {
      const response = await api.put(`/vip-sessions/${sessionId}/close`)
      const closedSession = response.data.data
      
      // Удаляем сессию из активных
      const index = activeSessions.value.findIndex(s => s.id === sessionId)
      if (index > -1) {
        activeSessions.value.splice(index, 1)
      }
      
      return { success: true, session: closedSession }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при закрытии сессии'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const getSession = async (sessionId) => {
    try {
      const response = await api.get(`/vip-sessions/${sessionId}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении VIP сессии:', error)
      throw error
    }
  }
  
  const updateSessionAmount = (sessionId, ordersAmount) => {
    const session = activeSessions.value.find(s => s.id === sessionId)
    if (session) {
      session.total_orders_amount = ordersAmount
    }
  }
  
  const refreshData = async () => {
    await Promise.all([
      fetchActiveSessions(),
      fetchExpiringSessions()
    ])
  }
  
  return {
    activeSessions,
    expiringSessions,
    isLoading,
    activeSessionsWithTimers,
    expiredSessions,
    totalActiveRevenue,
    fetchActiveSessions,
    fetchExpiringSessions,
    createSession,
    extendSession,
    closeSession,
    getSession,
    updateSessionAmount,
    refreshData
  }
})