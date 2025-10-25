import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const isLoading = ref(false)
  
  // Computed
  const admins = computed(() => {
    return users.value.filter(user => user.role === 'admin')
  })
  
  const activeAdmins = computed(() => {
    // Здесь можно добавить логику для определения активных админов
    return admins.value
  })
  
  // Actions
  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/users')
      users.value = response.data.data
      return users.value
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const createUser = async (userData) => {
    isLoading.value = true
    try {
      const response = await api.post('/users', userData)
      const newUser = response.data.data
      users.value.push(newUser)
      return { success: true, user: newUser }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании пользователя'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const getUser = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении пользователя:', error)
      throw error
    }
  }
  
  const deleteUser = async (userId) => {
    isLoading.value = true
    try {
      await api.delete(`/users/${userId}`)
      
      // Удаляем пользователя из списка
      const index = users.value.findIndex(u => u.id === userId)
      if (index > -1) {
        users.value.splice(index, 1)
      }
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при удалении пользователя'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    users,
    isLoading,
    admins,
    activeAdmins,
    fetchUsers,
    createUser,
    getUser,
    deleteUser
  }
})