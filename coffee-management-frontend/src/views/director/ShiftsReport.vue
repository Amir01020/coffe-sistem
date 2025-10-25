<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Отчет по сменам</h1>
      <p class="text-gray-600 mt-1">Анализ эффективности рабочих смен</p>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
        <div class="flex-1">
          <label for="dateRange" class="block text-sm font-medium text-gray-700 mb-1">Период</label>
          <select
            v-model="filters.dateRange"
            id="dateRange"
            class="input-field"
            @change="onDateRangeChange"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">3 месяца</option>
            <option value="custom">Произвольный период</option>
          </select>
        </div>

        <div v-if="filters.dateRange === 'custom'" class="flex flex-1 flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 w-full sm:w-auto">
          <div class="flex-1">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">От</label>
            <input
              v-model="filters.startDate"
              type="date"
              id="startDate"
              class="input-field"
              :max="filters.endDate || toDateInputValue(new Date())"
            />
          </div>
          <div class="flex-1">
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">До</label>
            <input
              v-model="filters.endDate"
              type="date"
              id="endDate"
              class="input-field"
              :min="filters.startDate"
              :max="toDateInputValue(new Date())"
            />
          </div>
        </div>

        <div class="flex-1">
          <label for="adminFilter" class="block text-sm font-medium text-gray-700 mb-1">Администратор</label>
          <select
            v-model="filters.adminId"
            id="adminFilter"
            class="input-field"
          >
            <option value="">Все администраторы</option>
            <option v-for="admin in admins" :key="admin.id" :value="admin.id">
              {{ admin.name }}
            </option>
          </select>
        </div>

        <div class="self-end sm:self-center mt-6 sm:mt-0">
          <button
            class="btn-primary"
            @click="fetchData"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Загрузка...</span>
            <span v-else>Применить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <ClockIcon class="h-6 w-6 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Всего смен</p>
            <p class="text-2xl font-bold text-gray-900">{{ shiftsData.totalShifts }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <CurrencyDollarIcon class="h-6 w-6 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Общая выручка</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(shiftsData.totalRevenue) }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <ChartBarIcon class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Средняя выручка за смену</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(shiftsData.averageRevenuePerShift) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue by Shift Chart -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Эффективность смен</h3>
      <div class="h-64">
        <canvas ref="shiftsChart"></canvas>
      </div>
    </div>

    <!-- Shifts Table -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Список смен</h3>
      
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2">Загрузка данных...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="shiftsData.shifts.length === 0" class="text-center py-8">
        <ClockIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p class="text-gray-500">Нет данных о сменах за выбранный период</p>
      </div>
      
      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Администратор
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Начало
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Окончание
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Длительность
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Выручка
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заказов
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="shift in shiftsData.shifts"
              :key="shift.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ shift.admin_name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDateTime(shift.start_time) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ shift.end_time ? formatDateTime(shift.end_time) : '—' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ getShiftDuration(shift.start_time, shift.end_time) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatCurrency(shift.total_revenue) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ shift.orders_count || 0 }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="shift.end_time ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'"
                >
                  {{ shift.end_time ? 'Завершена' : 'Активна' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Admin Performance -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Эффективность администраторов</h3>
      
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2">Загрузка данных...</p>
      </div>
      
      <div v-else-if="adminPerformance.length === 0" class="text-center py-8">
        <UsersIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p class="text-gray-500">Нет данных об активности администраторов</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="text-sm font-medium text-gray-500 mb-3">По выручке</h4>
          <div class="space-y-3">
            <div
              v-for="admin in adminPerformance"
              :key="admin.id"
              class="bg-gray-50 rounded-lg p-3"
            >
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-800">{{ admin.name }}</span>
                <span class="text-sm font-medium text-gray-800">{{ formatCurrency(admin.revenue) }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-purple-500 to-blue-500 h-2"
                  :style="{
                    width: `${(admin.revenue / maxAdminRevenue) * 100}%`
                  }"
                ></div>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-gray-500">{{ admin.shiftsCount }} {{ declination(admin.shiftsCount, ['смена', 'смены', 'смен']) }}</span>
                <span class="text-xs text-gray-500">{{ admin.ordersCount }} {{ declination(admin.ordersCount, ['заказ', 'заказа', 'заказов']) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="text-sm font-medium text-gray-500 mb-3">По среднему чеку</h4>
          <div class="space-y-3">
            <div
              v-for="admin in [...adminPerformance].sort((a, b) => b.averageCheck - a.averageCheck)"
              :key="`avg-${admin.id}`"
              class="bg-gray-50 rounded-lg p-3"
            >
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-800">{{ admin.name }}</span>
                <span class="text-sm font-medium text-gray-800">{{ formatCurrency(admin.averageCheck) }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-green-500 to-teal-500 h-2"
                  :style="{
                    width: `${(admin.averageCheck / maxAdminAvgCheck) * 100}%`
                  }"
                ></div>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-gray-500">{{ admin.shiftsCount }} {{ declination(admin.shiftsCount, ['смена', 'смены', 'смен']) }}</span>
                <span class="text-xs text-gray-500">{{ admin.ordersCount }} {{ declination(admin.ordersCount, ['заказ', 'заказа', 'заказов']) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 z-50">
      <div
        class="rounded-lg p-4 shadow-lg max-w-sm"
        :class="{
          'bg-green-100 border border-green-400 text-green-800': message.type === 'success',
          'bg-red-100 border border-red-400 text-red-800': message.type === 'error'
        }"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import { formatCurrency, formatDateTime, toDateInputValue } from '@/utils/formatters'
import { useReportsStore } from '@/stores/reports'
import Chart from 'chart.js/auto'
import {
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

// State
const isLoading = ref(false)
const message = ref(null)
const reportsStore = useReportsStore()
const admins = ref([])
const shiftsChart = ref(null)
let chartInstance = null

// Filters
const filters = ref({
  dateRange: 'week',
  startDate: '',
  endDate: '',
  adminId: ''
})

// Data
const shiftsData = ref({
  shifts: [],
  totalShifts: 0,
  totalRevenue: 0,
  averageRevenuePerShift: 0
})

// Admin performance
const adminPerformance = ref([])

// Computed
const maxAdminRevenue = computed(() => {
  if (!adminPerformance.value.length) return 1
  return Math.max(...adminPerformance.value.map(a => a.revenue), 1)
})

const maxAdminAvgCheck = computed(() => {
  if (!adminPerformance.value.length) return 1
  return Math.max(...adminPerformance.value.map(a => a.averageCheck), 1)
})

// Set default dates based on selected range
const onDateRangeChange = () => {
  const today = new Date()
  
  switch (filters.value.dateRange) {
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filters.value.startDate = toDateInputValue(weekAgo)
      filters.value.endDate = toDateInputValue(today)
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filters.value.startDate = toDateInputValue(monthAgo)
      filters.value.endDate = toDateInputValue(today)
      break
    case 'quarter':
      const quarterAgo = new Date(today)
      quarterAgo.setMonth(quarterAgo.getMonth() - 3)
      filters.value.startDate = toDateInputValue(quarterAgo)
      filters.value.endDate = toDateInputValue(today)
      break
  }
}

// Calculate shift duration
const getShiftDuration = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const diffMs = end - start
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}ч ${minutes}м`
}

// Declination for Russian words
const declination = (count, words) => {
  const cases = [2, 0, 1, 1, 1, 2]
  const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]
  return words[index]
}

// Fetch admins
const fetchAdmins = async () => {
  try {
    const response = await api.get('/users')
    admins.value = response.data.data.filter(user => user.role === 'admin') || []
  } catch (error) {
    console.error('Error fetching admins:', error)
  }
}

// Process admin performance
const processAdminPerformance = (shifts) => {
  const adminMap = new Map()
  
  // Process each shift
  for (const shift of shifts) {
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
    admin.revenue += Number(shift.total_revenue) || 0
    admin.ordersCount += Number(shift.orders_count) || 0
    admin.shiftsCount++
  }
  
  // Calculate average check for each admin
  for (const admin of adminMap.values()) {
    admin.averageCheck = admin.ordersCount ? admin.revenue / admin.ordersCount : 0
  }
  
  // Convert to array and sort by revenue
  return Array.from(adminMap.values())
    .sort((a, b) => b.revenue - a.revenue)
}

// Fetch data
const fetchData = async () => {
  isLoading.value = true
  
  try {
    const params = {
      start_date: filters.value.startDate,
      end_date: filters.value.endDate
    }
    
    if (filters.value.adminId) {
      params.admin_id = filters.value.adminId
    }
    
    const data = await reportsStore.fetchShiftsReport(params)
    shiftsData.value = data
    
    // Process admin performance
    adminPerformance.value = processAdminPerformance(data.shifts)
    
    // Update chart
    updateShiftsChart()
  } catch (error) {
    showMessage('Ошибка при загрузке данных', 'error')
    console.error('Error fetching shifts data:', error)
  } finally {
    isLoading.value = false
  }
}

// Show message
const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

// Create and update shifts chart
const updateShiftsChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const chartElement = shiftsChart.value
  if (!chartElement || !shiftsData.value.shifts || shiftsData.value.shifts.length === 0) {
    return
  }
  
  // Get last 10 shifts for the chart (or all if less than 10)
  const shiftsForChart = [...shiftsData.value.shifts]
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(-10)
  
  const labels = shiftsForChart.map(shift => {
    const date = new Date(shift.start_time)
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + 
           ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  })
  
  const revenues = shiftsForChart.map(shift => Number(shift.total_revenue) || 0)
  const ordersCount = shiftsForChart.map(shift => Number(shift.orders_count) || 0)
  
  chartInstance = new Chart(chartElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Выручка',
          data: revenues,
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Заказы',
          data: ordersCount,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.datasetIndex === 0) {
                label += formatCurrency(context.raw).replace(' сум', '');
              } else {
                label += context.raw;
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Выручка (сум)'
          },
          ticks: {
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + 'K';
              }
              return value;
            }
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: {
            display: true,
            text: 'Количество заказов'
          },
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  })
}

// Cleanup chart on component unmount
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Initialize
onMounted(() => {
  onDateRangeChange()
  fetchAdmins()
  fetchData()
})
</script> 