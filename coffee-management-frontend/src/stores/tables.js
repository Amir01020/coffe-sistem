import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { TABLE_STATUS } from '@/utils/constants'

export const useTablesStore = defineStore('tables', () => {
  const tables = ref([])
  const activeSessions = ref([])
  const isLoading = ref(false)
  const isRefreshing = ref(false)  // Добавлен флаг, чтобы избежать одновременных обновлений
  
  // Computed
  const tablesWithStatus = computed(() => {
    return tables.value.map(table => {
      const session = activeSessions.value.find(s => s.table_id === table.id)
      
      if (session) {
        // Преобразуем строковые значения в числа и добавляем недостающие поля
        const processedSession = {
          ...session,
          total_amount: parseFloat(session.total_amount || 0),
          orders_count: session.orders_count || 0,
          // Если orders_count нет, получаем из заказов
          table_number: table.table_number
        }
        
        return {
          ...table,
          status: TABLE_STATUS.OCCUPIED,
          session: processedSession
        }
      }
      
      return {
        ...table,
        status: TABLE_STATUS.FREE,
        session: null
      }
    })
  })
  
  const freeTablesCount = computed(() => {
    return tablesWithStatus.value.filter(t => t.status === TABLE_STATUS.FREE).length
  })
  
  const occupiedTablesCount = computed(() => {
    return tablesWithStatus.value.filter(t => t.status === TABLE_STATUS.OCCUPIED).length
  })
  
  // Actions
  const fetchTables = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/tables')
      tables.value = response.data.data
      return tables.value
    } catch (error) {
      console.error('Ошибка при загрузке столиков:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchActiveSessions = async () => {
    try {
      const response = await api.get('/table-sessions/active')
      activeSessions.value = response.data.data
      
      // Логируем для отладки
      console.log('Active table sessions from API:', activeSessions.value)
      
      return activeSessions.value
    } catch (error) {
      console.error('Ошибка при загрузке активных сессий:', error)
      throw error
    }
  }
  
  const createTable = async (tableData) => {
    isLoading.value = true
    try {
      const response = await api.post('/tables', tableData)
      const newTable = response.data.data
      tables.value.push(newTable)
      return { success: true, table: newTable }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании столика'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const occupyTable = async (tableId, clientId) => {
    isLoading.value = true
    try {
      const response = await api.post('/table-sessions', {
        table_id: tableId,
        client_id: clientId
      })
      const newSession = response.data.data
      activeSessions.value.push(newSession)
      return { success: true, session: newSession }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при занятии столика'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const releaseTable = async (sessionId) => {
    isLoading.value = true
    try {
      const response = await api.put(`/table-sessions/${sessionId}/close`)
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
        error: error.response?.data?.error || 'Ошибка при освобождении столика'
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const getSession = async (sessionId) => {
    try {
      const response = await api.get(`/table-sessions/${sessionId}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении сессии:', error)
      throw error
    }
  }
  
  // Метод для получения количества заказов для сессии
  const fetchSessionOrders = async (sessionId) => {
    try {
      const response = await api.get(`/orders/session/${sessionId}`)
      return response.data.data
    } catch (error) {
      console.error('Ошибка при получении заказов сессии:', error)
      return []
    }
  }
  
  // ИСПРАВЛЕНИЕ: Правильное обновление сессии с заказами
  const updateSessionAmount = async (sessionId, amount, ordersCount = null) => {
    const sessionIndex = activeSessions.value.findIndex(s => s.id === sessionId)
    if (sessionIndex > -1) {
      // Если количество заказов не передано, получаем из API
      if (ordersCount === null) {
        try {
          const orders = await fetchSessionOrders(sessionId)
          ordersCount = orders.length
        } catch (error) {
          ordersCount = 0
        }
      }
      
      activeSessions.value[sessionIndex] = {
        ...activeSessions.value[sessionIndex],
        total_amount: parseFloat(amount),
        orders_count: ordersCount
      }
      
      console.log('Updated session:', activeSessions.value[sessionIndex])
    }
  }
  
  // Новый метод: принудительное обновление сессии
  const refreshSession = async (sessionId) => {
    try {
      const sessionData = await getSession(sessionId)
      const sessionIndex = activeSessions.value.findIndex(s => s.id === sessionId)
      if (sessionIndex > -1) {
        // Получаем актуальные заказы
        const orders = await fetchSessionOrders(sessionId)
        
        activeSessions.value[sessionIndex] = {
          ...sessionData,
          total_amount: parseFloat(sessionData.total_amount || 0),
          orders_count: orders.length
        }
        
        console.log('Refreshed session:', activeSessions.value[sessionIndex])
      }
    } catch (error) {
      console.error('Ошибка при обновлении сессии:', error)
    }
  }
  
  // ИСПРАВЛЕНО: Метод refreshData оптимизирован для избежания бесконечного цикла
  const refreshData = async () => {
    // Предотвращаем запуск нескольких обновлений одновременно
    if (isRefreshing.value) {
      console.log('Обновление уже выполняется, пропускаем...')
      return
    }
    
    isRefreshing.value = true
    
    try {
      // Сначала загружаем основные данные
      await Promise.all([
        fetchTables(),
        fetchActiveSessions()
      ])
      
      // Не обновляем orders_count для каждой сессии, если их слишком много
      // Это избыточные запросы, которые вызывают перегрузку
      if (activeSessions.value.length <= 5) {
        const promises = activeSessions.value.map(async (session) => {
          try {
            const orders = await fetchSessionOrders(session.id)
            const sessionIndex = activeSessions.value.findIndex(s => s.id === session.id)
            if (sessionIndex > -1) {
              activeSessions.value[sessionIndex] = {
                ...activeSessions.value[sessionIndex],
                orders_count: orders.length
              }
            }
          } catch (error) {
            console.error(`Ошибка при загрузке заказов для сессии ${session.id}:`, error)
          }
        })
        
        // Ждем завершения обновления информации о заказах, но с таймаутом
        const timeout = new Promise((resolve) => setTimeout(resolve, 5000))
        await Promise.race([Promise.all(promises), timeout])
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error)
    } finally {
      isRefreshing.value = false
    }
  }
  
  return {
    tables,
    activeSessions,
    isLoading,
    tablesWithStatus,
    freeTablesCount,
    occupiedTablesCount,
    fetchTables,
    fetchActiveSessions,
    createTable,
    occupyTable,
    releaseTable,
    getSession,
    updateSessionAmount,
    refreshSession,
    refreshData,
    fetchSessionOrders
  }
})