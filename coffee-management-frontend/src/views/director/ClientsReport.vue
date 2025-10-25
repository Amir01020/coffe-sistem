<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Отчет по клиентам</h1>
      <p class="text-gray-600 mt-1">Анализ базы клиентов, частоты посещений и средних чеков</p>
    </div>

    <!-- Filter Controls -->
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
            <option value="quarter">Квартал</option>
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
          <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-1">Сортировка</label>
          <select
            v-model="filters.sortBy"
            id="sortBy"
            class="input-field"
          >
            <option value="visits">По количеству визитов</option>
            <option value="spent">По сумме расходов</option>
            <option value="recent">По последнему визиту</option>
          </select>
        </div>

        <div class="self-end sm:self-center mt-6 sm:mt-0">
          <button
            class="btn-primary"
            @click="fetchClientsData"
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
      <!-- Total Clients -->
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <UsersIcon class="h-6 w-6 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Всего клиентов</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalClients }}</p>
          </div>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <CurrencyDollarIcon class="h-6 w-6 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Общая выручка</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.totalSpent) }}</p>
          </div>
        </div>
      </div>

      <!-- Average Per Client -->
      <div class="card">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <UserIcon class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">Средний чек на клиента</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.averagePerClient) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Visits Chart -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Динамика посещений</h3>
      <div class="h-64">
        <canvas ref="visitsChart"></canvas>
      </div>
    </div>

    <!-- Clients Table -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Список клиентов</h3>
      
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2">Загрузка данных...</p>
      </div>
      
      <div v-else-if="clients.length === 0" class="text-center py-8">
        <UsersIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p class="text-gray-500">Нет данных о клиентах за выбранный период</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Клиент
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контакт
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Визитов
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Потрачено
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Средний чек
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Последний визит
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="client in clients"
              :key="client.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ client.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatPhone(client.phone) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ client.total_visits }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatCurrency(client.total_spent) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ formatCurrency(client.total_visits ? client.total_spent / client.total_visits : 0) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(client.updated_at) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'
import { formatCurrency, formatPhone, formatDate, toDateInputValue } from '@/utils/formatters'
import { useReportsStore } from '@/stores/reports'
import Chart from 'chart.js/auto'
import {
  UsersIcon,
  CurrencyDollarIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

// State
const isLoading = ref(false)
const message = ref(null)
const clients = ref([])
const visitsChart = ref(null)
let chartInstance = null

// Store
const reportsStore = useReportsStore()

// Filters
const filters = ref({
  dateRange: 'month',
  startDate: '',
  endDate: '',
  sortBy: 'visits'
})

// Stats
const stats = ref({
  totalClients: 0,
  totalSpent: 0,
  averagePerClient: 0,
  visitsData: []
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

// Fetch clients data
const fetchClientsData = async () => {
  isLoading.value = true
  
  try {
    await reportsStore.fetchClientsReport({
      start_date: filters.value.startDate,
      end_date: filters.value.endDate
    })
    
    // Get clients data from store
    const clientsData = reportsStore.clientsReport.clients
    
    // Sort clients based on filter
    const sortedClients = [...clientsData].sort((a, b) => {
      switch (filters.value.sortBy) {
        case 'visits':
          return b.total_visits - a.total_visits
        case 'spent':
          return b.total_spent - a.total_spent
        case 'recent':
          return new Date(b.updated_at) - new Date(a.updated_at)
        default:
          return 0
      }
    })
    
    clients.value = sortedClients
    
    // Update stats
    stats.value = {
      totalClients: clientsData.length,
      totalSpent: clientsData.reduce((sum, client) => sum + Number(client.total_spent || 0), 0),
      averagePerClient: clientsData.length 
        ? clientsData.reduce((sum, client) => sum + Number(client.total_spent || 0), 0) / clientsData.length 
        : 0,
      visitsData: generateVisitsData(clientsData)
    }
    
    // Update chart
    updateVisitsChart()
    
    showMessage('Данные успешно загружены', 'success')
  } catch (error) {
    showMessage('Ошибка при загрузке данных', 'error')
    console.error('Error fetching clients data:', error)
  } finally {
    isLoading.value = false
  }
}

// Generate visits data for chart
const generateVisitsData = (clientsData) => {
  // Create a map of dates to visit counts
  const visitsByDate = {}
  
  // Process each client's visits
  clientsData.forEach(client => {
    // For simplicity, we'll use the client's last visit date
    // In a real app, you'd have actual visit dates
    if (client.updated_at) {
      const visitDate = client.updated_at.split('T')[0]
      visitsByDate[visitDate] = (visitsByDate[visitDate] || 0) + 1
    }
  })
  
  // Convert to array of date-count pairs
  const result = Object.entries(visitsByDate).map(([date, count]) => ({
    date,
    count
  }))
  
  // Sort by date
  return result.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Create and update visits chart
const updateVisitsChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const chartElement = visitsChart.value
  if (!chartElement || !stats.value.visitsData || stats.value.visitsData.length === 0) {
    return
  }
  
  const labels = stats.value.visitsData.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  })
  
  const visitCounts = stats.value.visitsData.map(item => item.count)
  
  chartInstance = new Chart(chartElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Количество посещений',
          data: visitCounts,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Посещения по дням'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Количество посещений'
          },
          ticks: {
            precision: 0
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
  }, 3000)
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
  fetchClientsData()
})
</script> 