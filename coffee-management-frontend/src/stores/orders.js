import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { ORDER_DELETE_TIME_LIMIT } from '@/utils/constants'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const sessionOrders = ref([])
  const isLoading = ref(false)
  
  // Computed
  const sessionOrdersTotal = computed(() => {
    return sessionOrders.value.reduce((total, order) => total + order.price, 0)
  })
  
  const recentOrders = computed(() => {
    return orders.value
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
  })
  
  const deletableOrders = computed(() => {
    const cutoffTime = new Date(Date.now() - ORDER_DELETE_TIME_LIMIT * 60 * 1000)
    return sessionOrders.value.filter(order => 
      order.can_delete && new Date(order.created_at) > cutoffTime
    )
  })
  
  // Actions
  const fetchOrders = async (filters = {}) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.session_type) params.append('session_type', filters.session_type)
      
      const response = await api.get(`/orders?${params}`)
      orders.value = response.data.data
      return orders.value
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchSessionOrders = async (sessionId, sessionType) => {
    isLoading.value = true
    try {
      const endpoint = sessionType === 'vip' 
        ? `/orders/vip-session/${sessionId}`
        : `/orders/session/${sessionId}`
      
      const response = await api.get(endpoint)
      sessionOrders.value = response.data.data
      return sessionOrders.value
    } catch (error) {
      console.error('Ошибка при загрузке заказов сессии:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const createOrder = async (orderData) => {
    isLoading.value = true
    try {
      const response = await api.post('/orders', orderData)
      const newOrder = response.data.data
      
      // Добавляем в список заказов сессии
      sessionOrders.value.push(newOrder)
      
      // Добавляем в общий список заказов
      orders.value.unshift(newOrder)
      
      return { success: true, order: newOrder }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании заказа'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const deleteOrder = async (orderId) => {
    isLoading.value = true
    try {
      await api.delete(`/orders/${orderId}`)
      
      // Удаляем из списка заказов сессии
      const sessionIndex = sessionOrders.value.findIndex(o => o.id === orderId)
      if (sessionIndex > -1) {
        sessionOrders.value.splice(sessionIndex, 1)
      }
      
      // Удаляем из общего списка заказов
      const ordersIndex = orders.value.findIndex(o => o.id === orderId)
      if (ordersIndex > -1) {
        orders.value.splice(ordersIndex, 1)
      }
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при удалении заказа'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const getOrdersStats = async (date = null) => {
    try {
      const params = date ? `?date=${date}` : ''
      const response = await api.get(`/orders/stats${params}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при загрузке статистики заказов:', error)
      throw error
    }
  }
  
  const canDeleteOrder = (order) => {
    if (!order.can_delete) return false
    
    const orderTime = new Date(order.created_at)
    const cutoffTime = new Date(Date.now() - ORDER_DELETE_TIME_LIMIT * 60 * 1000)
    
    return orderTime > cutoffTime
  }
  
  const getTimeToDelete = (order) => {
    const orderTime = new Date(order.created_at)
    const deleteDeadline = new Date(orderTime.getTime() + ORDER_DELETE_TIME_LIMIT * 60 * 1000)
    const now = new Date()
    
    if (now >= deleteDeadline) return null
    
    const diffMs = deleteDeadline - now
    const minutes = Math.floor(diffMs / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  const clearSessionOrders = () => {
    sessionOrders.value = []
  }
  
  return {
    orders,
    sessionOrders,
    isLoading,
    sessionOrdersTotal,
    recentOrders,
    deletableOrders,
    fetchOrders,
    fetchSessionOrders,
    createOrder,
    deleteOrder,
    getOrdersStats,
    canDeleteOrder,
    getTimeToDelete,
    clearSessionOrders
  }
})