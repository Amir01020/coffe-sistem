import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([])
  const isLoading = ref(false)
  const searchQuery = ref('')
  
  // Computed
  const filteredClients = computed(() => {
    if (!searchQuery.value) return clients.value
    
    const query = searchQuery.value.toLowerCase()
    return clients.value.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query)
    )
  })
  
  // Actions
  const fetchClients = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/clients')
      clients.value = response.data.data
      return clients.value
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const createClient = async (clientData) => {
    isLoading.value = true
    try {
      const response = await api.post('/clients', clientData)
      const newClient = response.data.data
      clients.value.unshift(newClient)
      return { success: true, client: newClient }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании клиента'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const getClient = async (clientId) => {
    try {
      const response = await api.get(`/clients/${clientId}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении клиента:', error)
      throw error
    }
  }
  
  const getClientHistory = async (clientId) => {
    try {
      const response = await api.get(`/clients/${clientId}/history`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении истории клиента:', error)
      throw error
    }
  }
  
  const updateClientStats = (clientId, visits, spent) => {
    const client = clients.value.find(c => c.id === clientId)
    if (client) {
      client.total_visits = visits
      client.total_spent = spent
    }
  }
  
  const setSearchQuery = (query) => {
    searchQuery.value = query
  }
  
  const clearSearch = () => {
    searchQuery.value = ''
  }
  
  return {
    clients,
    isLoading,
    searchQuery,
    filteredClients,
    fetchClients,
    createClient,
    getClient,
    getClientHistory,
    updateClientStats,
    setSearchQuery,
    clearSearch
  }
})