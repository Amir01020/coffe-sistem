import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useReportsStore = defineStore('reports', () => {
  // State
  const isLoading = ref(false)
  
  // Revenue report data
  const revenueData = ref({
    totalRevenue: 0,
    ordersCount: 0,
    averageCheck: 0,
    regularRevenue: 0,
    vipRevenue: 0,
    dayOfWeekBreakdown: [],
    maxDayRevenue: 0
  })
  
  // Shifts report data
  const shiftsData = ref({
    shifts: [],
    totalShifts: 0,
    totalRevenue: 0,
    averageRevenuePerShift: 0
  })
  
  // Clients report data
  const clientsData = ref({
    clients: [],
    totalClients: 0,
    totalSpent: 0,
    averagePerClient: 0
  })
  
  // Daily report data
  const dailyData = ref({
    revenue: 0,
    ordersCount: 0,
    tableSessionsCount: 0,
    vipSessionsCount: 0,
    hourlyBreakdown: []
  })
  
  // Fetch revenue report
  const fetchRevenueReport = async (params = {}) => {
    isLoading.value = true
    try {
      const response = await api.get('/reports/revenue', { params })
      const data = response.data.data
      
      // Get day of week breakdown from another endpoint
      const dailyResponse = await api.get('/reports/daily', { params })
      const dailyData = dailyResponse.data.data || []
      
      // Process day of week breakdown
      const dayOfWeekMap = {
        0: 'Воскресенье',
        1: 'Понедельник',
        2: 'Вторник',
        3: 'Среда',
        4: 'Четверг',
        5: 'Пятница',
        6: 'Суббота'
      }
      
      const dayBreakdown = [0, 1, 2, 3, 4, 5, 6].map(day => ({
        day,
        name: dayOfWeekMap[day],
        revenue: 0
      }))
      
      // Fill in revenue data
      dailyData.forEach(item => {
        const date = new Date(item.date)
        const dayOfWeek = date.getDay()
        dayBreakdown[dayOfWeek].revenue += Number(item.revenue) || 0
      })
      
      // Find max day revenue
      const maxDayRevenue = Math.max(...dayBreakdown.map(d => d.revenue), 1)
      
      // Update report
      revenueData.value = {
        totalRevenue: data.totalRevenue || 0,
        ordersCount: data.ordersCount || 0,
        averageCheck: data.ordersCount ? data.totalRevenue / data.ordersCount : 0,
        regularRevenue: data.regularRevenue || 0,
        vipRevenue: data.vipRevenue || 0,
        dayOfWeekBreakdown: dayBreakdown,
        maxDayRevenue
      }
      
      return revenueData.value
    } catch (error) {
      console.error('Error fetching revenue report:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch shifts report
  const fetchShiftsReport = async (params = {}) => {
    isLoading.value = true
    try {
      const response = await api.get('/reports/shifts', { params })
      const shifts = response.data.data || []
      
      // Calculate stats
      const totalRevenue = shifts.reduce((sum, shift) => sum + (Number(shift.total_revenue) || 0), 0)
      
      shiftsData.value = {
        shifts,
        totalShifts: shifts.length,
        totalRevenue,
        averageRevenuePerShift: shifts.length ? totalRevenue / shifts.length : 0
      }
      
      return shiftsData.value
    } catch (error) {
      console.error('Error fetching shifts report:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch clients report
  const fetchClientsReport = async (params = {}) => {
    isLoading.value = true
    try {
      const response = await api.get('/reports/clients', { params })
      const clients = response.data.data || []
      
      // Calculate stats
      const totalSpent = clients.reduce((sum, client) => sum + (Number(client.total_spent) || 0), 0)
      
      clientsData.value = {
        clients,
        totalClients: clients.length,
        totalSpent,
        averagePerClient: clients.length ? totalSpent / clients.length : 0
      }
      
      return clientsData.value
    } catch (error) {
      console.error('Error fetching clients report:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch daily report
  const fetchDailyReport = async (date) => {
    isLoading.value = true
    try {
      const response = await api.get('/reports/daily', { 
        params: { 
          date: date || new Date().toISOString().split('T')[0]
        } 
      })
      const data = response.data.data || {}
      
      // Create hourly breakdown (00:00 to 23:00, hourly)
      const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        revenue: 0,
        orders: 0
      }))
      
      // Fill in hourly data if available
      if (data.hourly) {
        data.hourly.forEach(item => {
          const hour = parseInt(item.hour) || 0
          if (hour >= 0 && hour < 24) {
            hourlyBreakdown[hour].revenue = Number(item.revenue) || 0
            hourlyBreakdown[hour].orders = Number(item.orders) || 0
          }
        })
      }
      
      dailyData.value = {
        revenue: data.revenue || 0,
        ordersCount: data.orders_count || 0,
        tableSessionsCount: data.table_sessions_count || 0,
        vipSessionsCount: data.vip_sessions_count || 0,
        hourlyBreakdown
      }
      
      return dailyData.value
    } catch (error) {
      console.error('Error fetching daily report:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    isLoading,
    revenueData,
    shiftsData,
    clientsData,
    dailyData,
    fetchRevenueReport,
    fetchShiftsReport,
    fetchClientsReport,
    fetchDailyReport
  }
})