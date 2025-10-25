import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useShiftStore = defineStore('shift', () => {
  const currentShift = ref(null)
  const isLoading = ref(false)
  
  const fetchCurrentShift = async () => {
    try {
      const response = await api.get('/shifts/current')
      currentShift.value = response.data.data
      return currentShift.value
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Ошибка при получении текущей смены:', error)
      }
      currentShift.value = null
      return null
    }
  }
  
  const startShift = async () => {
    isLoading.value = true
    try {
      const response = await api.post('/shifts/start')
      currentShift.value = response.data.data
      return { success: true, shift: currentShift.value }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при начале смены'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const endShift = async () => {
    isLoading.value = true
    try {
      const response = await api.post('/shifts/end')
      const endedShift = response.data.data
      currentShift.value = null
      return { success: true, shift: endedShift }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при завершении смены'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchShifts = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const response = await api.get(`/shifts?${params}`)
      return response.data.data
    } catch (error) {
      throw error
    }
  }
  
  return {
    currentShift,
    isLoading,
    fetchCurrentShift,
    startShift,
    endShift,
    fetchShifts
  }
})