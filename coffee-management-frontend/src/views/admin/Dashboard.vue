<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Панель управления</h1>
          <p class="text-gray-600 mt-2">Добро пожаловать, {{ authStore.user?.name }}</p>
        </div>
        <div class="mt-4 sm:mt-0 flex items-center gap-4">
          <button
            @click="refreshData"
            :disabled="isRefreshing"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon :class="`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`" />
            {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
          </button>
          <div class="text-right">
            <p class="text-sm text-gray-500">{{ currentDate }}</p>
            <p class="text-xs text-gray-400">Последнее обновление: {{ lastUpdateTime }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Shift Alert -->
    <div v-if="!shiftStore.currentShift" class="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center">
        <div class="p-2 bg-amber-100 rounded-lg">
          <ExclamationTriangleIcon class="h-6 w-6 text-amber-600" />
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-amber-800 font-medium text-lg">Смена не начата</h3>
          <p class="text-amber-700 text-sm mt-1">
            Для работы с системой необходимо начать смену
          </p>
        </div>
        <RouterLink to="/admin/shift">
          <button class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors">
            Начать смену
          </button>
        </RouterLink>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Today's Revenue -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-xl">
            <CurrencyDollarIcon class="h-7 w-7 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Выручка за день</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.todayRevenue) }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ stats.todayOrders }} {{ getOrderWord(stats.todayOrders) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Active Tables -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <TableCellsIcon class="h-7 w-7 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Занятые столики</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activeTables }}</p>
            <p class="text-xs text-gray-500 mt-1">
              из {{ stats.totalTables }} столиков
            </p>
          </div>
        </div>
      </div>

      <!-- Active VIP Sessions -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-xl">
            <StarIcon class="h-7 w-7 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Активные VIP</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activeVipSessions }}</p>
            <p class="text-xs text-gray-500 mt-1">
              VIP сессий
            </p>
          </div>
        </div>
      </div>

      <!-- Average Check -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-xl">
            <ShoppingBagIcon class="h-7 w-7 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Средний чек</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.averageCheck) }}</p>
            <p class="text-xs text-gray-500 mt-1">
              за заказ
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <RouterLink to="/admin/tables" class="block group">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group-hover:scale-105">
          <div class="text-center">
            <div class="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <TableCellsIcon class="h-8 w-8 text-blue-600" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Управление столиками</h3>
            <p class="text-sm text-gray-600">Посмотреть статус и управлять столиками</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/admin/vip" class="block group">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all group-hover:scale-105">
          <div class="text-center">
            <div class="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <StarIcon class="h-8 w-8 text-purple-600" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">VIP зал</h3>
            <p class="text-sm text-gray-600">Управление VIP сессиями</p>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/admin/clients" class="block group">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all group-hover:scale-105">
          <div class="text-center">
            <div class="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <UsersIcon class="h-8 w-8 text-green-600" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Клиенты</h3>
            <p class="text-sm text-gray-600">Управление базой клиентов</p>
          </div>
        </div>
      </RouterLink>

      <div @click="refreshData" class="block group cursor-pointer">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-400 transition-all group-hover:scale-105">
          <div class="text-center">
            <div class="p-3 bg-gray-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
              <ArrowPathIcon class="h-8 w-8 text-gray-600" :class="{ 'animate-spin': isRefreshing }" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Обновить данные</h3>
            <p class="text-sm text-gray-600">Получить актуальную информацию</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity and Active Sessions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Последние заказы</h3>
          <p class="text-sm text-gray-600 mt-1">Недавние заказы за сегодня</p>
        </div>
        <div class="p-6">
          <div v-if="recentOrders.length > 0" class="space-y-4">
            <div
              v-for="order in recentOrders.slice(0, 5)"
              :key="order.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center">
                <div class="p-2 bg-white rounded-lg shadow-sm">
                  <ShoppingBagIcon class="h-5 w-5 text-gray-600" />
                </div>
                <div class="ml-3">
                  <p class="font-medium text-gray-900">{{ order.item_name }}</p>
                  <p class="text-sm text-gray-600">
                    {{ order.session_type === 'table' ? `Столик ${order.table_number}` : 'VIP зал' }}
                    • {{ formatTime(order.created_at) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900">{{ formatCurrency(order.price) }}</p>
                <p class="text-xs text-gray-500">×{{ order.quantity || 1 }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <div class="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <ShoppingBagIcon class="h-10 w-10 text-gray-400" />
            </div>
            <p class="text-gray-500 font-medium">Заказов пока нет</p>
            <p class="text-sm text-gray-400 mt-1">Заказы появятся здесь после их создания</p>
          </div>
        </div>
      </div>

      <!-- Active Sessions Summary -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Активные сессии</h3>
          <p class="text-sm text-gray-600 mt-1">Текущие столики и VIP сессии</p>
        </div>
        <div class="p-6">
          <div v-if="activeSessions.length > 0" class="space-y-4">
            <div
              v-for="session in activeSessions.slice(0, 6)"
              :key="`${session.type}-${session.id}`"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center">
                <div class="p-2 bg-white rounded-lg shadow-sm">
                  <TableCellsIcon v-if="session.type === 'table'" class="h-5 w-5 text-blue-600" />
                  <StarIcon v-else class="h-5 w-5 text-purple-600" />
                </div>
                <div class="ml-3">
                  <p class="font-medium text-gray-900">
                    {{ session.type === 'table' ? `Столик ${session.table_number}` : 'VIP зал' }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ session.client_name || 'Клиент не указан' }} • {{ getDuration(session.start_time) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900">{{ formatCurrency(session.current_total || session.total_amount || 0) }}</p>
                <p class="text-xs text-gray-500">{{ session.orders_count || 0 }} заказов</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <div class="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <TableCellsIcon class="h-10 w-10 text-gray-400" />
            </div>
            <p class="text-gray-500 font-medium">Нет активных сессий</p>
            <p class="text-sm text-gray-400 mt-1">Активные столики и VIP сессии появятся здесь</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShiftStore } from '@/stores/shift'
import { formatCurrency, formatTime, getDuration } from '@/utils/formatters'
import api from '@/services/api'
import {
  ExclamationTriangleIcon,
  TableCellsIcon,
  StarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const shiftStore = useShiftStore()

const stats = ref({
  activeTables: 0,
  totalTables: 0,
  activeVipSessions: 0,
  todayRevenue: 0,
  todayOrders: 0,
  averageCheck: 0
})

const recentOrders = ref([])
const activeSessions = ref([])
const isRefreshing = ref(false)
const lastUpdateTime = ref('')
let refreshInterval = null

const currentDate = computed(() => {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const getOrderWord = (count) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'заказ'
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'заказа'
  return 'заказов'
}

const fetchStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Получаем данные параллельно
    const [tablesResponse, vipResponse, ordersResponse, allTablesResponse] = await Promise.all([
      api.get('/table-sessions/active'),
      api.get('/vip-sessions/active'), 
      api.get(`/orders/stats?date=${today}`),
      api.get('/tables') // Получаем все столики для подсчета общего количества
    ])

    const activeTables = tablesResponse.data.data || []
    const activeVip = vipResponse.data.data || []
    const ordersStats = ordersResponse.data.data || {}
    const allTables = allTablesResponse.data.data || []

    // Рассчитываем выручку за день из разных источников
    let todayRevenue = 0
    let todayOrders = 0

    // Проверяем разные возможные поля в ответе API
    if (ordersStats.total_revenue) {
      todayRevenue = parseFloat(ordersStats.total_revenue)
    } else if (ordersStats.revenue) {
      todayRevenue = parseFloat(ordersStats.revenue)
    } else {
      // Если API не возвращает выручку, рассчитываем из заказов
      const ordersResponse = await api.get(`/orders?date=${today}`)
      const orders = ordersResponse.data.data || []
      todayRevenue = orders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)
    }

    if (ordersStats.total_orders) {
      todayOrders = parseInt(ordersStats.total_orders)
    } else if (ordersStats.orders_count) {
      todayOrders = parseInt(ordersStats.orders_count)
    } else {
      // Если API не возвращает количество заказов, рассчитываем
      const ordersResponse = await api.get(`/orders?date=${today}`)
      const orders = ordersResponse.data.data || []
      todayOrders = orders.length
    }

    // Рассчитываем средний чек
    const averageCheck = todayOrders > 0 ? todayRevenue / todayOrders : 0

    stats.value = {
      activeTables: activeTables.length,
      totalTables: allTables.length,
      activeVipSessions: activeVip.length,
      todayRevenue,
      todayOrders,
      averageCheck
    }

    // Объединяем активные сессии для отображения
    activeSessions.value = [
      ...activeTables.map(session => ({ ...session, type: 'table' })),
      ...activeVip.map(session => ({ ...session, type: 'vip' }))
    ].sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

  } catch (error) {
    console.error('Ошибка при загрузке статистики:', error)
    
    // В случае ошибки пытаемся получить данные альтернативным способом
    try {
      const today = new Date().toISOString().split('T')[0]
      const ordersResponse = await api.get(`/orders?date=${today}`)
      const orders = ordersResponse.data.data || []
      
      const todayRevenue = orders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)
      const todayOrders = orders.length
      const averageCheck = todayOrders > 0 ? todayRevenue / todayOrders : 0
      
      stats.value.todayRevenue = todayRevenue
      stats.value.todayOrders = todayOrders
      stats.value.averageCheck = averageCheck
      
    } catch (fallbackError) {
      console.error('Ошибка при альтернативной загрузке данных:', fallbackError)
    }
  }
}

const fetchRecentOrders = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await api.get(`/orders?date=${today}&limit=10`)
    const orders = response.data.data || []
    recentOrders.value = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    console.error('Ошибка при загрузке заказов:', error)
    recentOrders.value = []
  }
}

const refreshData = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      shiftStore.fetchCurrentShift(),
      fetchStats(),
      fetchRecentOrders()
    ])
    lastUpdateTime.value = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  refreshData()
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(refreshData, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>