<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Управление сменой</h1>
      <p class="text-gray-600 mt-2">Начните или завершите рабочую смену</p>
    </div>

    <!-- Current Shift Status -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
      <div v-if="shiftStore.currentShift" class="text-center">
        <!-- Active Shift -->
        <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircleIcon class="h-10 w-10 text-green-600" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Смена активна</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-1">Начало смены</p>
            <p class="text-lg text-gray-900">{{ formatDateTime(shiftStore.currentShift.start_time) }}</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-1">Длительность</p>
            <p class="text-lg text-gray-900">{{ getShiftDuration(shiftStore.currentShift.start_time) }}</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-1">Выручка за смену</p>
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(calculatedRevenue) }}</p>
          </div>
        </div>
        
        <!-- End Shift Button -->
        <button
          @click="showEndShiftModal = true"
          class="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="shiftStore.isLoading"
        >
          <span v-if="shiftStore.isLoading">Завершаем...</span>
          <span v-else>Завершить смену</span>
        </button>
      </div>

      <div v-else class="text-center">
        <!-- No Active Shift -->
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <ClockIcon class="h-10 w-10 text-gray-400" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Смена не начата</h2>
        <p class="text-gray-600 mb-8 max-w-md mx-auto">
          Для работы с системой необходимо начать новую смену. После начала смены вы сможете принимать заказы и управлять столиками.
        </p>
        
        <!-- Start Shift Button -->
        <button
          @click="handleStartShift"
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="shiftStore.isLoading"
        >
          <span v-if="shiftStore.isLoading">Начинаем...</span>
          <span v-else>Начать смену</span>
        </button>
      </div>
    </div>

    <!-- Shift Statistics -->
    <div v-if="shiftStore.currentShift" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <TableCellsIcon class="h-7 w-7 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Активные столики</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeTables }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-xl">
            <StarIcon class="h-7 w-7 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">VIP сессии</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeVipSessions }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-xl">
            <ShoppingBagIcon class="h-7 w-7 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Заказов</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalOrders }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-xl">
            <CurrencyDollarIcon class="h-7 w-7 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Средний чек</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(averageCheck) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Revenue Breakdown -->
    <div v-if="shiftStore.currentShift" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Детализация выручки</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Выручка со столиков:</span>
            <span class="font-semibold text-gray-900">{{ formatCurrency(revenueBreakdown.tables) }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Выручка с VIP:</span>
            <span class="font-semibold text-gray-900">{{ formatCurrency(revenueBreakdown.vip) }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span class="text-green-800 font-medium">Общая выручка:</span>
            <span class="font-bold text-green-800 text-lg">{{ formatCurrency(calculatedRevenue) }}</span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Заказов со столиков:</span>
            <span class="font-semibold text-gray-900">{{ orderBreakdown.tables }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">Заказов с VIP:</span>
            <span class="font-semibold text-gray-900">{{ orderBreakdown.vip }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span class="text-blue-800 font-medium">Всего заказов:</span>
            <span class="font-bold text-blue-800 text-lg">{{ totalOrders }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- End Shift Confirmation Modal -->
    <div
      v-if="showEndShiftModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">Завершить смену?</h3>
        
        <div class="space-y-4 mb-8">
          <p class="text-gray-600">При завершении смены:</p>
          <ul class="text-sm text-gray-600 space-y-2 ml-4">
            <li class="flex items-start">
              <span class="text-red-500 mr-2">•</span>
              <span>Все активные столики будут освобождены</span>
            </li>
            <li class="flex items-start">
              <span class="text-red-500 mr-2">•</span>
              <span>VIP сессии будут завершены</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-500 mr-2">•</span>
              <span>Будет сформирован отчет по смене</span>
            </li>
          </ul>
          
          <div class="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
            <div class="space-y-2">
              <p class="text-sm font-medium text-green-800">Итоги смены:</p>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-green-700">Выручка:</span>
                  <span class="font-bold text-green-800 ml-1">{{ formatCurrency(calculatedRevenue) }}</span>
                </div>
                <div>
                  <span class="text-green-700">Заказов:</span>
                  <span class="font-bold text-green-800 ml-1">{{ totalOrders }}</span>
                </div>
              </div>
              <div>
                <span class="text-green-700">Длительность:</span>
                <span class="font-bold text-green-800 ml-1">{{ getShiftDuration(shiftStore.currentShift?.start_time) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button
            @click="showEndShiftModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="handleEndShift"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="shiftStore.isLoading"
          >
            <span v-if="shiftStore.isLoading">Завершаем...</span>
            <span v-else>Завершить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 z-50">
      <div
        class="rounded-lg p-4 shadow-xl max-w-sm border"
        :class="{
          'bg-green-50 border-green-200 text-green-800': message.type === 'success',
          'bg-red-50 border-red-200 text-red-800': message.type === 'error'
        }"
      >
        <div class="flex items-center">
          <CheckCircleIcon v-if="message.type === 'success'" class="h-5 w-5 mr-2" />
          <ExclamationTriangleIcon v-else class="h-5 w-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useShiftStore } from '@/stores/shift'
import { formatCurrency, formatTime, getDuration } from '@/utils/formatters'
import api from '@/services/api'
import {
  CheckCircleIcon,
  ClockIcon,
  TableCellsIcon,
  StarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const shiftStore = useShiftStore()

const showEndShiftModal = ref(false)
const message = ref(null)
const activeTables = ref(0)
const activeVipSessions = ref(0)
const totalOrders = ref(0)
const revenueBreakdown = ref({
  tables: 0,
  vip: 0
})
const orderBreakdown = ref({
  tables: 0,
  vip: 0
})

let refreshInterval = null

const calculatedRevenue = computed(() => {
  return revenueBreakdown.value.tables + revenueBreakdown.value.vip
})

const averageCheck = computed(() => {
  return totalOrders.value > 0 ? calculatedRevenue.value / totalOrders.value : 0
})

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getShiftDuration = (startTime) => {
  const start = new Date(startTime)
  const now = new Date()
  const diffMs = now - start
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}ч ${minutes}м`
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const fetchShiftStats = async () => {
  if (!shiftStore.currentShift) return
  
  try {
    const shiftDate = new Date(shiftStore.currentShift.start_time).toISOString().split('T')[0]
    
    // Добавляем отладочные логи
    console.log('Fetching shift stats for date:', shiftDate)
    
    const [tablesResponse, vipResponse, ordersResponse] = await Promise.all([
      api.get('/table-sessions/active'),
      api.get('/vip-sessions/active'),
      api.get(`/orders?date=${shiftDate}`)
    ])

    const activeTablesData = tablesResponse.data.data || []
    const activeVipData = vipResponse.data.data || []
    const ordersData = ordersResponse.data.data || []

    // Отладочные логи
    console.log('Active tables:', activeTablesData)
    console.log('Active VIP:', activeVipData)
    console.log('Orders data:', ordersData)

    activeTables.value = activeTablesData.length
    activeVipSessions.value = activeVipData.length
    totalOrders.value = ordersData.length

    // Попробуем несколько способов получения данных о заказах
    let tableRevenue = 0
    let vipRevenue = 0
    let tableOrdersCount = 0
    let vipOrdersCount = 0

    // Способ 1: Из заказов с фильтрацией по session_type
    const tableOrders = ordersData.filter(order => order.session_type === 'table')
    const vipOrders = ordersData.filter(order => order.session_type === 'vip')

    console.log('Table orders:', tableOrders)
    console.log('VIP orders:', vipOrders)

    tableRevenue += tableOrders.reduce((sum, order) => {
      const price = parseFloat(order.price || order.total_price || order.amount || 0)
      console.log('Table order price:', price, order)
      return sum + price
    }, 0)

    vipRevenue += vipOrders.reduce((sum, order) => {
      const price = parseFloat(order.price || order.total_price || order.amount || 0)
      console.log('VIP order price:', price, order)
      return sum + price
    }, 0)

    tableOrdersCount = tableOrders.length
    vipOrdersCount = vipOrders.length

    // Способ 2: Из активных сессий (может быть более актуально)
    const activeTablesRevenue = activeTablesData.reduce((sum, session) => {
      const amount = parseFloat(session.current_total || session.total_amount || 0)
      console.log('Active table session revenue:', amount, session)
      return sum + amount
    }, 0)

    const activeVipRevenue = activeVipData.reduce((sum, session) => {
      const amount = parseFloat(session.current_total || session.total_amount || 0)
      console.log('Active VIP session revenue:', amount, session)
      return sum + amount
    }, 0)

    // Способ 3: Если заказы не разделены по типам, пробуем по table_number или другим признакам
    if (tableOrders.length === 0 && vipOrders.length === 0 && ordersData.length > 0) {
      console.log('Orders not filtered by session_type, trying alternative approach...')
      
      // Пробуем разделить по наличию table_number
      const ordersWithTable = ordersData.filter(order => order.table_number)
      const ordersWithoutTable = ordersData.filter(order => !order.table_number)

      tableRevenue = ordersWithTable.reduce((sum, order) => {
        const price = parseFloat(order.price || order.total_price || order.amount || 0)
        return sum + price
      }, 0)

      vipRevenue = ordersWithoutTable.reduce((sum, order) => {
        const price = parseFloat(order.price || order.total_price || order.amount || 0)
        return sum + price
      }, 0)

      tableOrdersCount = ordersWithTable.length
      vipOrdersCount = ordersWithoutTable.length

      console.log('Alternative calculation - Table revenue:', tableRevenue, 'VIP revenue:', vipRevenue)
    }

    // Способ 4: Если ничего не помогает, считаем всю выручку как "столики"
    if (tableRevenue === 0 && vipRevenue === 0 && ordersData.length > 0) {
      console.log('Fallback: counting all orders as table orders')
      tableRevenue = ordersData.reduce((sum, order) => {
        const price = parseFloat(order.price || order.total_price || order.amount || 0)
        return sum + price
      }, 0)
      tableOrdersCount = ordersData.length
    }

    // Используем максимальные значения из разных источников
    revenueBreakdown.value = {
      tables: Math.max(tableRevenue, activeTablesRevenue),
      vip: Math.max(vipRevenue, activeVipRevenue)
    }

    orderBreakdown.value = {
      tables: tableOrdersCount,
      vip: vipOrdersCount
    }

    console.log('Final revenue breakdown:', revenueBreakdown.value)
    console.log('Final order breakdown:', orderBreakdown.value)

  } catch (error) {
    console.error('Ошибка при загрузке статистики смены:', error)
    
    // Fallback: пробуем получить хотя бы общую сумму заказов
    try {
      const today = new Date().toISOString().split('T')[0]
      const fallbackResponse = await api.get(`/orders?date=${today}`)
      const fallbackOrders = fallbackResponse.data.data || []
      
      const totalRevenue = fallbackOrders.reduce((sum, order) => {
        return sum + parseFloat(order.price || order.total_price || order.amount || 0)
      }, 0)
      
      console.log('Fallback total revenue:', totalRevenue)
      
      revenueBreakdown.value = {
        tables: totalRevenue,
        vip: 0
      }
      
      orderBreakdown.value = {
        tables: fallbackOrders.length,
        vip: 0
      }
      
      totalOrders.value = fallbackOrders.length
      
    } catch (fallbackError) {
      console.error('Fallback также не сработал:', fallbackError)
    }
  }
}

const handleStartShift = async () => {
  const result = await shiftStore.startShift()
  
  if (result.success) {
    showMessage('Смена успешно начата! Теперь вы можете принимать заказы.', 'success')
    await fetchShiftStats()
    // Начинаем автообновление после успешного старта смены
    refreshInterval = setInterval(fetchShiftStats, 30000)
  } else {
    showMessage(result.error || 'Ошибка при начале смены', 'error')
  }
}

const handleEndShift = async () => {
  const result = await shiftStore.endShift()
  
  if (result.success) {
    showMessage(`Смена успешно завершена! Выручка: ${formatCurrency(calculatedRevenue.value)}`, 'success')
    showEndShiftModal.value = false
    
    // Обнуляем статистику
    activeTables.value = 0
    activeVipSessions.value = 0
    totalOrders.value = 0
    revenueBreakdown.value = { tables: 0, vip: 0 }
    orderBreakdown.value = { tables: 0, vip: 0 }
    
    // Останавливаем автообновление
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  } else {
    showMessage(result.error || 'Ошибка при завершении смены', 'error')
  }
}

onMounted(async () => {
  await shiftStore.fetchCurrentShift()
  if (shiftStore.currentShift) {
    await fetchShiftStats()
    // Запускаем автообновление если смена активна
    refreshInterval = setInterval(fetchShiftStats, 30000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>