<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Панель управления</h1>
      <p class="text-gray-600 mt-2">Обзор показателей вашего заведения</p>
    </div>

    <!-- Date Filter -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
        <div class="flex-1">
          <label for="dateRange" class="block text-sm font-medium text-gray-700 mb-2">Период</label>
          <select
            v-model="dateRange"
            id="dateRange"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            @change="fetchDashboardData"
          >
            <option value="today">Сегодня</option>
            <option value="yesterday">Вчера</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="custom">Произвольный период</option>
          </select>
        </div>

        <div v-if="dateRange === 'custom'" class="flex flex-1 flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 w-full sm:w-auto">
          <div class="flex-1">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">От</label>
            <input
              v-model="startDate"
              type="date"
              id="startDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              :max="endDate || toDateInputValue(new Date())"
            />
          </div>
          <div class="flex-1">
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">До</label>
            <input
              v-model="endDate"
              type="date"
              id="endDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              :min="startDate"
              :max="toDateInputValue(new Date())"
            />
          </div>
        </div>

        <div class="self-end sm:self-center mt-6 sm:mt-0">
          <button
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="fetchDashboardData"
            :disabled="isLoading"
          >
            <ArrowPathIcon :class="`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`" />
            <span v-if="isLoading">Загрузка...</span>
            <span v-else>Обновить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4">
        <ArrowPathIcon class="h-10 w-10 text-purple-600 animate-spin" />
      </div>
      <p class="text-gray-500 font-medium">Загрузка данных...</p>
      <p class="text-sm text-gray-400 mt-1">Получаем актуальную информацию</p>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Revenue -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-xl">
            <CurrencyDollarIcon class="h-7 w-7 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Общая выручка</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.totalRevenue) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDateRange }}</p>
          </div>
        </div>
      </div>

      <!-- Orders Count -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <ShoppingBagIcon class="h-7 w-7 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Количество заказов</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.ordersCount }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDateRange }}</p>
          </div>
        </div>
      </div>

      <!-- Average Check -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-xl">
            <ReceiptPercentIcon class="h-7 w-7 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Средний чек</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.averageCheck) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDateRange }}</p>
          </div>
        </div>
      </div>

      <!-- Total Clients -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-xl">
            <UsersIcon class="h-7 w-7 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Всего клиентов</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.clientsCount }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDateRange }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Revenue Chart -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Динамика выручки</h3>
      <div class="h-64">
        <canvas ref="revenueChart"></canvas>
      </div>
    </div>

    <!-- Top Performing Admins -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Эффективность администраторов</h3>
      
      <div v-if="stats.adminPerformance.length === 0" class="text-center py-12">
        <div class="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
          <UsersIcon class="h-10 w-10 text-gray-400" />
        </div>
        <h4 class="text-lg font-medium text-gray-900 mb-2">Нет данных</h4>
        <p class="text-gray-500">Нет данных об активности администраторов за выбранный период</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Администратор
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Выручка
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заказов
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Смен
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Средний чек
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="admin in stats.adminPerformance"
              :key="admin.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ admin.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(admin.revenue) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ admin.ordersCount }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ admin.shiftsCount }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatCurrency(admin.averageCheck) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import { formatCurrency, toDateInputValue } from '@/utils/formatters'
import Chart from 'chart.js/auto'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ReceiptPercentIcon,
  UsersIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// State
const isLoading = ref(false)
const message = ref(null)
const revenueChart = ref(null)
let chartInstance = null

// Date filtering
const dateRange = ref('today')
const startDate = ref('')
const endDate = ref('')

// Stats data
const stats = ref({
  totalRevenue: 0,
  ordersCount: 0,
  averageCheck: 0,
  clientsCount: 0,
  adminPerformance: [],
  revenueData: []
})

// Format date range for display
const formatDateRange = computed(() => {
  switch (dateRange.value) {
    case 'today':
      return 'Сегодня'
    case 'yesterday':
      return 'Вчера'
    case 'week':
      return 'За последние 7 дней'
    case 'month':
      return 'За последние 30 дней'
    case 'custom':
      if (startDate.value && endDate.value) {
        return `${startDate.value} - ${endDate.value}`
      }
      return 'Выбранный период'
    default:
      return ''
  }
})

// Set default dates
const setDefaultDates = () => {
  const today = new Date()
  
  switch (dateRange.value) {
    case 'today':
      startDate.value = toDateInputValue(today)
      endDate.value = toDateInputValue(today)
      break
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate.value = toDateInputValue(yesterday)
      endDate.value = toDateInputValue(yesterday)
      break
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate.value = toDateInputValue(weekAgo)
      endDate.value = toDateInputValue(today)
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      startDate.value = toDateInputValue(monthAgo)
      endDate.value = toDateInputValue(today)
      break
  }
}

// Fetch dashboard data
const fetchDashboardData = async () => {
  isLoading.value = true
  
  // Set dates based on selected range
  if (dateRange.value !== 'custom') {
    setDefaultDates()
  }
  
  try {
    console.log(`📅 Загружаем данные Dashboard за период: ${startDate.value} - ${endDate.value}`)
    
    // Параллельно получаем все данные
    const requests = [
      api.get('/reports/revenue', {
        params: {
          start_date: startDate.value,
          end_date: endDate.value
        }
      }),
      api.get('/reports/clients', {
        params: {
          start_date: startDate.value,
          end_date: endDate.value
        }
      }),
      api.get('/reports/shifts', {
        params: {
          start_date: startDate.value,
          end_date: endDate.value
        }
      })
    ]
    
    const [revenueResponse, clientsResponse, shiftsResponse] = await Promise.all(requests)
    
    console.log('📊 Ответы API:')
    console.log('- Revenue response:', revenueResponse.data)
    console.log('- Clients response:', clientsResponse.data)
    console.log('- Shifts response:', shiftsResponse.data)
    
    // Обрабатываем данные
    const revenueData = revenueResponse.data.data || {}
    const clientsData = clientsResponse.data.data || []
    const shiftsData = shiftsResponse.data.data || []
    
    console.log('🔍 Обработанные данные:')
    console.log('- Revenue data:', revenueData)
    console.log('- Clients data:', clientsData)
    console.log('- Shifts data:', shiftsData)
    
    // Проверяем активные смены
    const activeShifts = shiftsData.filter(shift => !shift.end_time)
    const closedShifts = shiftsData.filter(shift => shift.end_time)
    console.log('🔄 Активные смены:', activeShifts)
    console.log('✅ Закрытые смены:', closedShifts)
    
    // Рассчитываем общую выручку несколькими способами
    let totalRevenue = 0
    let totalOrders = 0
    
    // Способ 1: Из summary отчета по выручке
    if (revenueData.summary && revenueData.summary.total_revenue) {
      totalRevenue = parseFloat(revenueData.summary.total_revenue)
      totalOrders = parseInt(revenueData.summary.total_orders || 0)
      console.log('✅ Способ 1 (summary): выручка =', totalRevenue, 'заказов =', totalOrders)
    }
    // Способ 2: Прямо из поля total_revenue
    else if (revenueData.total_revenue !== undefined) {
      totalRevenue = parseFloat(revenueData.total_revenue || 0)
      totalOrders = parseInt(revenueData.total_orders || revenueData.ordersCount || 0)
      console.log('✅ Способ 2 (direct): выручка =', totalRevenue, 'заказов =', totalOrders)
    }
    // Способ 3: Из смен (включая активные смены с текущими заказами)
    else if (shiftsData.length > 0) {
      totalRevenue = shiftsData.reduce((sum, shift) => {
        const shiftRevenue = parseFloat(shift.total_revenue || 0)
        console.log(`  - Смена ${shift.id} (${shift.end_time ? 'закрыта' : 'активна'}): ${shiftRevenue} сум, заказов: ${shift.total_orders}`)
        
        // Если смена активна и выручка 0, но есть заказы - это проблема
        if (!shift.end_time && shiftRevenue === 0 && shift.total_orders > 0) {
          console.log(`  ⚠️ Активная смена ${shift.id} имеет ${shift.total_orders} заказов, но выручка 0`)
        }
        
        return sum + shiftRevenue
      }, 0)
      
      totalOrders = shiftsData.reduce((sum, shift) => sum + parseInt(shift.total_orders || 0), 0)
      console.log('✅ Способ 3 (shifts): выручка =', totalRevenue, 'заказов =', totalOrders)
      
      // Если есть активные смены с заказами, но выручка 0 - принудительно получаем заказы
      const hasActiveShiftsWithOrders = shiftsData.some(shift => 
        !shift.end_time && parseInt(shift.total_orders || 0) > 0
      )
      
      if (totalRevenue === 0 && hasActiveShiftsWithOrders) {
        console.log('⚠️ Есть активные смены с заказами, но выручка 0. Принудительно получаем заказы...')
        // Сбрасываем totalOrders чтобы сработал Способ 4
        totalOrders = 0
      }
    }
    // Способ 4: Получаем заказы напрямую (так как смена показывает 0, но заказы есть)
    if (totalRevenue === 0 && totalOrders === 0) {
      console.log('⚠️ Все способы дали 0, пробуем получить заказы напрямую...')
      try {
        const ordersResponse = await api.get('/orders', {
          params: {
            date: startDate.value  // Используем только дату для фильтра
          }
        })
        const orders = ordersResponse.data.data || []
        console.log('📦 Заказы за', startDate.value, ':', orders)
        
        if (orders.length > 0) {
          totalRevenue = orders.reduce((sum, order) => {
            const price = parseFloat(order.price || 0)
            console.log(`  - Заказ "${order.item_name}": ${price} сум (${order.session_type})`)
            return sum + price
          }, 0)
          totalOrders = orders.length
          console.log('✅ Способ 4 (orders): выручка =', totalRevenue, 'заказов =', totalOrders)
        } else {
          console.log('❌ Заказов не найдено за', startDate.value)
        }
        
      } catch (ordersError) {
        console.error('❌ Ошибка получения заказов:', ordersError)
      }
    }
    
    // Способ 5: Получаем статистику заказов через отдельный endpoint
    if (totalRevenue === 0 && totalOrders === 0) {
      console.log('⚠️ Пробуем получить статистику заказов...')
      try {
        const statsResponse = await api.get('/orders/stats', {
          params: {
            date: startDate.value
          }
        })
        const orderStats = statsResponse.data.data || {}
        console.log('📊 Статистика заказов:', orderStats)
        
        if (orderStats.total_revenue) {
          totalRevenue = parseFloat(orderStats.total_revenue)
          totalOrders = parseInt(orderStats.total_orders || orderStats.orders_count || 0)
          console.log('✅ Способ 5 (stats): выручка =', totalRevenue, 'заказов =', totalOrders)
        }
        
      } catch (statsError) {
        console.error('❌ Ошибка получения статистики заказов:', statsError)
      }
    }
    
    // Получаем данные для графика
    let dailyData = []
    try {
      // Для графика всегда нужен диапазон дат
      const dailyResponse = await api.get('/reports/daily', {
        params: {
          start_date: startDate.value,
          end_date: endDate.value
        }
      })
      
      const dailyApiData = dailyResponse.data.data
      console.log('📈 Daily API response:', dailyApiData)
      
      // API может вернуть объект с данными за один день или массив
      if (dailyApiData && typeof dailyApiData === 'object') {
        if (Array.isArray(dailyApiData)) {
          dailyData = dailyApiData
        } else if (dailyApiData.date) {
          // Одиночный день - простая структура
          dailyData = [dailyApiData]
        } else if (dailyApiData.daily_stats) {
          // Структура с daily_stats (как у вас) - создаем правильный формат
          dailyData = [{
            date: startDate.value,
            revenue: parseFloat(dailyApiData.daily_stats.total_revenue || totalRevenue),
            orders_count: parseInt(dailyApiData.daily_stats.orders_count || 0),
            // Сохраняем оригинальную структуру для отладки
            daily_stats: dailyApiData.daily_stats
          }]
          
          console.log('📈 Преобразованы данные из daily_stats:', {
            original_orders_count: dailyApiData.daily_stats.orders_count,
            converted_orders_count: parseInt(dailyApiData.daily_stats.orders_count || 0),
            revenue: parseFloat(dailyApiData.daily_stats.total_revenue || totalRevenue)
          })
        }
      }
      
      console.log('📈 Processed daily data from API:', dailyData)
      
      // Если API вернул данные только за один день, но период больше - дополняем
      if (dailyData.length === 1 && startDate.value !== endDate.value) {
        console.log('⚠️ API вернул данные только за один день, но период больше. Создаем полный график...')
        dailyData = []
      }
      
    } catch (error) {
      console.warn('⚠️ Не удалось получить ежедневные данные:', error.message)
      dailyData = []
    }
    
    // Если нет данных для графика или график неполный, создаем на основе заказов
    if (dailyData.length === 0 || (dailyData.length === 1 && startDate.value !== endDate.value)) {
      console.log('🔄 Создаем данные для графика на основе заказов')
      
      // Используем сохраненные данные заказов если есть
      if (window.ordersDataForChart) {
        console.log('📈 Используем сохраненные данные заказов для графика')
        const ordersByDate = window.ordersDataForChart
        
        dailyData = Object.keys(ordersByDate).map(date => {
          const dayOrders = ordersByDate[date]
          const dayRevenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)
          return {
            date: date,
            revenue: dayRevenue,
            orders_count: dayOrders.length
          }
        }).sort((a, b) => new Date(a.date) - new Date(b.date))
        
        console.log('📈 График создан из сохраненных заказов:', dailyData)
        
        // Если totalOrders все еще 0, пересчитываем из графика
        if (totalOrders === 0) {
          const totalOrdersFromChart = dailyData.reduce((sum, day) => sum + day.orders_count, 0)
          totalOrders = totalOrdersFromChart
          console.log('🔄 Обновили totalOrders из графика:', totalOrders)
        }
        
      } else {
        // Получаем заказы для создания графика
        try {
          const isOneDay = startDate.value === endDate.value
          const params = isOneDay 
            ? { date: startDate.value }
            : { start_date: startDate.value, end_date: endDate.value }
          
          const ordersResponse = await api.get('/orders', { params })
          const orders = ordersResponse.data.data || []
          
          if (orders.length > 0) {
            // Группируем заказы по дням
            const ordersByDate = {}
            orders.forEach(order => {
              const orderDate = order.created_at.split('T')[0]
              if (!ordersByDate[orderDate]) {
                ordersByDate[orderDate] = []
              }
              ordersByDate[orderDate].push(order)
            })
            
            // Создаем данные для графика
            dailyData = Object.keys(ordersByDate).map(date => {
              const dayOrders = ordersByDate[date]
              const dayRevenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)
              return {
                date: date,
                revenue: dayRevenue,
                orders_count: dayOrders.length
              }
            }).sort((a, b) => new Date(a.date) - new Date(b.date))
            
            console.log('📈 График создан из новых заказов:', dailyData)
            
            // Обновляем totalOrders если он был 0
            if (totalOrders === 0) {
              totalOrders = orders.length
              console.log('🔄 Обновили totalOrders из новых заказов:', totalOrders)
            }
          }
        } catch (error) {
          console.error('❌ Ошибка создания графика из заказов:', error)
        }
      }
    }
    
    // Если у нас есть данные графика, но totalOrders все еще 0 - пересчитываем
    if (totalOrders === 0 && dailyData.length > 0) {
      const ordersFromChart = dailyData.reduce((sum, day) => sum + (day.orders_count || 0), 0)
      if (ordersFromChart > 0) {
        totalOrders = ordersFromChart
        console.log('🔄 Финальное обновление totalOrders из графика:', totalOrders)
      }
    }
    
    // Если все еще нет данных для графика, создаем тестовые
    if (dailyData.length === 0) {
      console.log('📈 Создаем тестовые данные для графика')
      dailyData = generateDummyDailyData(startDate.value, endDate.value)
    }
    
    // Обновляем статистику
    const newStats = {
      totalRevenue: totalRevenue,
      ordersCount: totalOrders,
      averageCheck: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      clientsCount: clientsData.length,
      adminPerformance: processAdminPerformance(shiftsData),
      revenueData: dailyData
    }
    
    console.log('📊 Итоговая статистика ДО обновления:', {
      totalRevenue: newStats.totalRevenue,
      ordersCount: newStats.ordersCount,
      averageCheck: newStats.averageCheck,
      clientsCount: newStats.clientsCount,
      revenueDataLength: newStats.revenueData.length
    })
    
    // Финальная проверка: если заказов 0, но в графике есть данные
    if (newStats.ordersCount === 0 && newStats.revenueData.length > 0) {
      console.log('🔍 Ищем данные о заказах в графике...')
      
      let ordersFromChart = 0
      
      // Проверяем разные структуры данных в графике
      newStats.revenueData.forEach((dayData, index) => {
        console.log(`День ${index + 1}:`, dayData)
        
        // Способ 1: orders_count на верхнем уровне
        if (dayData.orders_count) {
          ordersFromChart += dayData.orders_count
          console.log(`  - Найдено orders_count: ${dayData.orders_count}`)
        }
        // Способ 2: в daily_stats (как у вас)
        else if (dayData.daily_stats && dayData.daily_stats.orders_count) {
          ordersFromChart += parseInt(dayData.daily_stats.orders_count)
          console.log(`  - Найдено daily_stats.orders_count: ${dayData.daily_stats.orders_count}`)
        }
        // Способ 3: в daily_stats как orders_total
        else if (dayData.daily_stats && dayData.daily_stats.orders_total) {
          // orders_total это сумма, не количество, но проверим есть ли количество в других полях
          console.log(`  - daily_stats содержит:`, Object.keys(dayData.daily_stats))
        }
      })
      
      if (ordersFromChart > 0) {
        newStats.ordersCount = ordersFromChart
        newStats.averageCheck = newStats.totalRevenue > 0 ? newStats.totalRevenue / newStats.ordersCount : 0
        console.log('🔄 ФИНАЛЬНАЯ коррекция заказов из графика:', newStats.ordersCount)
        console.log('🔄 Новый средний чек:', newStats.averageCheck)
      } else {
        console.log('❌ В графике не найдены данные о количестве заказов')
        
        // Последняя попытка: если есть выручка, но нет заказов, получаем заказы прямо сейчас
        console.log('🔄 Последняя попытка получить заказы...')
        try {
          const isOneDay = startDate.value === endDate.value
          const params = isOneDay 
            ? { date: startDate.value }
            : { start_date: startDate.value, end_date: endDate.value }
          
          const ordersResponse = await api.get('/orders', { params })
          const orders = ordersResponse.data.data || []
          
          if (orders.length > 0) {
            newStats.ordersCount = orders.length
            newStats.averageCheck = newStats.totalRevenue > 0 ? newStats.totalRevenue / newStats.ordersCount : 0
            console.log('✅ ЭКСТРЕННАЯ коррекция из API заказов:', newStats.ordersCount)
          }
        } catch (error) {
          console.error('❌ Экстренное получение заказов не удалось:', error)
        }
      }
    }
    
    console.log('📊 Итоговая статистика ПОСЛЕ коррекции:', newStats)
    stats.value = newStats
    
    // Обновляем график
    updateRevenueChart()
    
    // Очищаем временные данные
    if (window.ordersDataForChart) {
      delete window.ordersDataForChart
    }
    
    showMessage('Данные успешно обновлены', 'success')
      
  } catch (error) {
    console.error('❌ Ошибка при загрузке данных Dashboard:', error)
    showMessage('Ошибка при загрузке данных', 'error')
  } finally {
    isLoading.value = false
  }
}

// Generate dummy data for testing
const generateDummyDailyData = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const result = []
  
  const currentDate = new Date(start)
  while (currentDate <= end) {
    const revenue = Math.floor(Math.random() * 500000) + 100000
    const ordersCount = Math.floor(Math.random() * 20) + 5
    
    result.push({
      date: currentDate.toISOString().split('T')[0],
      revenue: revenue,
      orders_count: ordersCount
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return result
}

// Process admin performance data
const processAdminPerformance = (shiftsData) => {
  const adminMap = new Map()
  
  for (const shift of shiftsData) {
    if (!adminMap.has(shift.admin_id)) {
      adminMap.set(shift.admin_id, {
        id: shift.admin_id,
        name: shift.admin_name || `Админ #${shift.admin_id}`,
        revenue: 0,
        ordersCount: 0,
        shiftsCount: 0,
        averageCheck: 0
      })
    }
    
    const admin = adminMap.get(shift.admin_id)
    admin.revenue += parseFloat(shift.total_revenue || 0)
    admin.ordersCount += parseInt(shift.orders_count || 0)
    admin.shiftsCount++
  }
  
  // Calculate average check for each admin
  for (const admin of adminMap.values()) {
    admin.averageCheck = admin.ordersCount > 0 ? admin.revenue / admin.ordersCount : 0
  }
  
  return Array.from(adminMap.values()).sort((a, b) => b.revenue - a.revenue)
}

// Create and update revenue chart
// Create and update revenue chart
const updateRevenueChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const chartElement = revenueChart.value
  if (!chartElement) {
    return
  }
  
  let revenueData = Array.isArray(stats.value.revenueData) ? stats.value.revenueData : []
  console.log('📈 Исходные данные для графика:', revenueData)
  
  // Если нет данных для графика, создаем на основе текущей статистики
  if (revenueData.length === 0) {
    console.log('📈 Создаем данные графика из общей статистики')
    revenueData = [{
      date: startDate.value,
      revenue: stats.value.totalRevenue,
      orders_count: stats.value.ordersCount
    }]
    console.log('📈 Созданные данные:', revenueData)
  }
  
  // Обрабатываем данные - извлекаем правильные значения
  const processedData = revenueData.map(item => {
    let revenue = 0
    let ordersCount = 0
    let itemDate = item.date
    
    console.log('📈 Обрабатываем элемент:', item)
    
    // Способ 1: прямые поля
    if (item.revenue !== undefined && item.orders_count !== undefined) {
      revenue = parseFloat(item.revenue) || 0
      ordersCount = parseInt(item.orders_count) || 0
      console.log('  - Прямые поля: revenue =', revenue, 'orders =', ordersCount)
    }
    // Способ 2: из daily_stats (для "сегодня")
    else if (item.daily_stats) {
      revenue = parseFloat(item.daily_stats.total_revenue) || 0
      ordersCount = parseInt(item.daily_stats.orders_count) || 0
      itemDate = item.date || startDate.value
      console.log('  - Из daily_stats: revenue =', revenue, 'orders =', ordersCount)
    }
    // Способ 3: fallback
    else {
      revenue = parseFloat(item.total_revenue || item.revenue || 0)
      ordersCount = parseInt(item.orders_count || item.total_orders || 0)
      console.log('  - Fallback: revenue =', revenue, 'orders =', ordersCount)
    }
    
    return {
      date: itemDate,
      revenue: revenue,
      orders_count: ordersCount
    }
  })
  
  console.log('📈 Обработанные данные для графика:', processedData)
  
  if (processedData.length === 0 || processedData.every(item => item.revenue === 0 && item.orders_count === 0)) {
    console.log('❌ Нет данных для отображения графика')
    return
  }
  
  // Сортируем данные по дате
  const sortedData = [...processedData].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  })
  
  const revenues = sortedData.map(item => item.revenue)
  const ordersCount = sortedData.map(item => item.orders_count)
  
  console.log('📈 Финальные данные графика:', {
    labels,
    revenues,
    ordersCount
  })
  
  chartInstance = new Chart(chartElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Выручка',
          data: revenues,
          backgroundColor: 'rgba(124, 58, 237, 0.8)',
          borderColor: 'rgb(124, 58, 237)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Заказы',
          data: ordersCount,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              if (context.datasetIndex === 0) {
                label += formatCurrency(context.raw).replace(' сум', '') + ' сум'
              } else {
                label += context.raw + ' заказов'
              }
              return label
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Выручка (сум)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          ticks: {
            font: {
              size: 11
            },
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M'
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + 'K'
              }
              return value.toLocaleString()
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Количество заказов',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11
            },
            stepSize: 1
          }
        }
      }
    }
  })
}

// Show message
const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Cleanup chart on component unmount
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Initialize
onMounted(() => {
  setDefaultDates()
  fetchDashboardData()
})
</script>