import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])
  
  const addNotification = (message, type = 'warning') => {
    const id = Date.now()
    notifications.value.push({ id, message, type })
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 10000)
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const checkExpiringVipSessions = async () => {
    try {
      const response = await api.get('/vip-sessions/expiring')
      const expiringSessions = response.data.data
      
      // Clear old VIP notifications
      notifications.value = notifications.value.filter(n => !n.message.includes('VIP сессия'))
      
      // Add new notifications for expiring sessions
      expiringSessions.forEach(session => {
        const timeLeft = Math.ceil((new Date(session.end_time) - new Date()) / (1000 * 60))
        addNotification(`VIP сессия клиента ${session.client_name} истекает через ${timeLeft} мин`)
      })
    } catch (error) {
      console.error('Ошибка при проверке VIP сессий:', error)
    }
  }
  
  return {
    notifications,
    addNotification,
    removeNotification,
    checkExpiringVipSessions
  }
})