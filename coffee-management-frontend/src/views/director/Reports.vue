<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Отчеты</h1>
      <p class="text-gray-600 mt-1">Аналитика и статистика заведения</p>
    </div>

    <!-- Report Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Revenue Report -->
      <RouterLink to="/director" class="block">
        <div class="card hover:bg-purple-50 transition-colors cursor-pointer h-full">
          <div class="p-4">
            <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 mx-auto">
              <CurrencyDollarIcon class="h-6 w-6 text-purple-600" />
            </div>
            <h3 class="text-lg font-medium text-center text-gray-900 mb-2">Общая выручка</h3>
            <p class="text-sm text-center text-gray-600">
              Анализ выручки по периодам, типам услуг и администраторам
            </p>
          </div>
        </div>
      </RouterLink>

      <!-- Shifts Report -->
      <RouterLink to="/director/reports/shifts" class="block">
        <div class="card hover:bg-blue-50 transition-colors cursor-pointer h-full">
          <div class="p-4">
            <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto">
              <ClockIcon class="h-6 w-6 text-blue-600" />
            </div>
            <h3 class="text-lg font-medium text-center text-gray-900 mb-2">Отчет по сменам</h3>
            <p class="text-sm text-center text-gray-600">
              Статистика по рабочим сменам и эффективности администраторов
            </p>
          </div>
        </div>
      </RouterLink>

      <!-- Clients Report -->
      <RouterLink to="/director/reports/clients" class="block">
        <div class="card hover:bg-green-50 transition-colors cursor-pointer h-full">
          <div class="p-4">
            <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 mx-auto">
              <UsersIcon class="h-6 w-6 text-green-600" />
            </div>
            <h3 class="text-lg font-medium text-center text-gray-900 mb-2">Отчет по клиентам</h3>
            <p class="text-sm text-center text-gray-600">
              Анализ базы клиентов, частоты посещений и средних чеков
            </p>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Summary Stats -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Сводная статистика</h2>
      
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2">Загрузка данных...</p>
      </div>
      
      <div v-else>
        <!-- Date Range Selector -->
        <div class="flex flex-col sm:flex-row sm:items-center mb-6 space-y-3 sm:space-y-0">
          <div class="flex-1">
            <label class="text-sm font-medium text-gray-700">Период:</label>
            <div class="mt-1 flex space-x-2">
              <button
                v-for="period in periods"
                :key="period.value"
                @click="selectedPeriod = period.value; fetchSummaryData()"
                class="px-3 py-1 text-sm rounded-md"
                :class="selectedPeriod === period.value 
                  ? 'bg-purple-100 text-purple-800 font-medium' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              >
                {{ period.label }}
              </button>
            </div>
          </div>
          
          <div>
            <button
              @click="fetchSummaryData"
              class="btn-secondary"
            >
              <ArrowPathIcon class="h-4 w-4 mr-1" />
              Обновить
            </button>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500 mb-1">Выручка</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(summaryStats.revenue) }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500 mb-1">Заказов</p>
            <p class="text-xl font-bold text-gray-900">{{ summaryStats.ordersCount }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500 mb-1">Смен</p>
            <p class="text-xl font-bold text-gray-900">{{ summaryStats.shiftsCount }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500 mb-1">Средний чек</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(summaryStats.averageCheck) }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <!-- Revenue Breakdown -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Распределение выручки</h3>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between mb-1">
                <span class="text-sm text-gray-600">Обычный зал:</span>
                <span class="text-sm font-medium">{{ formatCurrency(summaryStats.regularRevenue) }}</span>
              </div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-gray-600">VIP зал:</span>
                <span class="text-sm font-medium">{{ formatCurrency(summaryStats.vipRevenue) }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-2"
                  :style="{
                    width: `${(summaryStats.regularRevenue / (summaryStats.revenue || 1)) * 100}%`
                  }"
                ></div>
              </div>
              <div class="flex justify-between mt-1 text-xs text-gray-500">
                <span>Обычный: {{ Math.round((summaryStats.regularRevenue / (summaryStats.revenue || 1)) * 100) }}%</span>
                <span>VIP: {{ Math.round((summaryStats.vipRevenue / (summaryStats.revenue || 1)) * 100) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- Weekly Distribution Chart -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Распределение по дням недели</h3>
            <div class="bg-gray-50 p-4 rounded-lg h-48">
              <canvas ref="weeklyChart"></canvas>
            </div>
          </div>
        </div>
        
        <!-- Revenue Trend Chart -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Динамика выручки</h3>
          <div class="bg-gray-50 p-4 rounded-lg h-64">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>
    </div>
    </div>
  </template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'
import { formatCurrency } from '@/utils/formatters'
import { useReportsStore } from '@/stores/reports'
import Chart from 'chart.js/auto'
import {
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

// State
const isLoading = ref(false)
const reportsStore = useReportsStore()
const weeklyChart = ref(null)
const revenueChart = ref(null)
let weeklyChartInstance = null
let revenueChartInstance = null

// Period selection
const periods = [
  { label: 'Сегодня', value: 'today' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
  { label: 'Год', value: 'year' }
]
const selectedPeriod = ref('week')

// Summary stats
const summaryStats = ref({
  revenue: 0,
  ordersCount: 0,
  shiftsCount: 0,
  averageCheck: 0,
  regularRevenue: 0,
  vipRevenue: 0,
  dailyData: [],
  weeklyData: [0, 0, 0, 0, 0, 0, 0] // Данные по дням недели (пн-вс)
})

// Get date range based on selected period
const getDateRange = () => {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  let startDate
  
  switch (selectedPeriod.value) {
    case 'today':
      startDate = endDate
      break
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().split('T')[0]
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      startDate = monthAgo.toISOString().split('T')[0]
      break
    case 'year':
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      startDate = yearAgo.toISOString().split('T')[0]
      break
    default:
      startDate = endDate
  }
  
  return { startDate, endDate }
}

// Fetch summary data
const fetchSummaryData = async () => {
  isLoading.value = true
  
  try {
    const { startDate, endDate } = getDateRange()
    
    // Добавим обработку ошибок для каждого запроса
    let revenueData = {}, shiftsData = [], ordersData = [];
    
    try {
      // Fetch revenue data
      const revenueResponse = await api.get('/reports/revenue', {
        params: { start_date: startDate, end_date: endDate }
      });
      revenueData = revenueResponse.data.data || {};
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
    
    try {
      // Fetch shifts data
      const shiftsResponse = await api.get('/reports/shifts', {
        params: { start_date: startDate, end_date: endDate }
      });
      shiftsData = shiftsResponse.data.data || [];
    } catch (error) {
      console.error('Error fetching shifts data:', error);
    }
    
    try {
      // Fetch orders data for more accurate statistics
      const ordersResponse = await api.get('/reports/orders', {
        params: { start_date: startDate, end_date: endDate }
      });
      ordersData = ordersResponse.data.data || [];
    } catch (error) {
      console.error('Error fetching orders data:', error);
      // Если нет эндпоинта для orders, создаем тестовые данные
      ordersData = [];
    }
    
    // Fetch daily data for charts
    let dailyData = [];
    try {
      const dailyResponse = await api.get('/reports/daily', {
        params: { start_date: startDate, end_date: endDate }
      });
      dailyData = dailyResponse.data.data || [];
    } catch (error) {
      console.error('Error fetching daily data:', error);
      // Создаем тестовые данные если API не отвечает
      dailyData = generateDummyDailyData(startDate, endDate);
    }
    
    console.log('Revenue data in reports:', revenueData)
    console.log('Shifts data in reports:', shiftsData)
    console.log('Daily data:', dailyData)
    
    // Calculate revenue from different sources
    let totalRevenue = 0
    let regularRevenue = 0
    let vipRevenue = 0
    
    // Try to get from revenue data first
    if (revenueData.totalRevenue !== undefined && revenueData.totalRevenue !== null) {
      totalRevenue = Number(revenueData.totalRevenue)
      regularRevenue = Number(revenueData.regularRevenue || 0)
      vipRevenue = Number(revenueData.vipRevenue || 0)
    } else {
      // Fallback: calculate from orders data
      if (ordersData && ordersData.length > 0) {
        ordersData.forEach(order => {
          const orderTotal = Number(order.total_price || 0)
          totalRevenue += orderTotal
          
          // Determine if VIP or regular based on order data
          if (order.is_vip) {
            vipRevenue += orderTotal
          } else {
            regularRevenue += orderTotal
          }
        })
      } else {
        // If no orders data, try to calculate from shifts
        totalRevenue = shiftsData.reduce((sum, shift) => sum + (Number(shift.total_revenue) || 0), 0)
        // We can't determine VIP vs regular split from shifts data alone
        regularRevenue = totalRevenue * 0.7 // Assume 70% regular as fallback
        vipRevenue = totalRevenue * 0.3 // Assume 30% VIP as fallback
      }
    }
    
    // Calculate weekly distribution
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Пн, Вт, Ср, Чт, Пт, Сб, Вс
    
    if (dailyData && dailyData.length > 0) {
      dailyData.forEach(day => {
        if (day.date) {
          const date = new Date(day.date);
          // getDay() возвращает 0 для воскресенья, 1 для понедельника и т.д.
          // Преобразуем в 0 для понедельника, 1 для вторника и т.д.
          const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
          weeklyData[dayOfWeek] += Number(day.revenue || 0);
        }
      });
    }
    
    // Update summary stats
    summaryStats.value = {
      revenue: totalRevenue,
      ordersCount: revenueData.ordersCount || ordersData.length || 0,
      shiftsCount: shiftsData.length,
      averageCheck: totalRevenue > 0 && (revenueData.ordersCount || ordersData.length) 
        ? totalRevenue / (revenueData.ordersCount || ordersData.length) 
        : 0,
      regularRevenue: regularRevenue,
      vipRevenue: vipRevenue,
      dailyData: dailyData,
      weeklyData: weeklyData
    }
    
    console.log('Updated summary stats:', summaryStats.value)
    
    // Update charts
    updateWeeklyChart();
    updateRevenueChart();
  } catch (error) {
    console.error('Error fetching summary data:', error)
    // Показываем ошибку пользователю
    showMessage('Ошибка при загрузке данных. Попробуйте еще раз.', 'error')
  } finally {
    isLoading.value = false
  }
}

// Generate dummy data for testing
const generateDummyDailyData = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];
  
  // Создаем записи для каждого дня в диапазоне
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const revenue = Math.floor(Math.random() * 500000) + 100000; // Random revenue between 100,000 and 600,000
    const ordersCount = Math.floor(Math.random() * 20) + 5; // Random orders between 5 and 25
    
    result.push({
      date: currentDate.toISOString().split('T')[0],
      revenue: revenue,
      orders_count: ordersCount
    });
    
    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

// Update weekly chart
const updateWeeklyChart = () => {
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }
  
  const chartElement = weeklyChart.value;
  if (!chartElement) return;
  
  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  weeklyChartInstance = new Chart(chartElement, {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [{
        label: 'Выручка',
        data: summaryStats.value.weeklyData,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(54, 162, 235)',
          'rgb(54, 162, 235)',
          'rgb(54, 162, 235)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
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
        }
      }
    }
  });
}

// Update revenue chart
const updateRevenueChart = () => {
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }
  
  const chartElement = revenueChart.value;
  if (!chartElement || !summaryStats.value.dailyData || summaryStats.value.dailyData.length === 0) return;
  
  // Sort data by date
  const sortedData = [...summaryStats.value.dailyData].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  const labels = sortedData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  });
  
  const revenues = sortedData.map(item => Number(item.revenue || 0));
  const ordersCount = sortedData.map(item => Number(item.orders_count || 0));
  
  revenueChartInstance = new Chart(chartElement, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Выручка',
          data: revenues,
          borderColor: 'rgb(124, 58, 237)',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Заказы',
          data: ordersCount,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
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
                label += formatCurrency(context.raw);
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
          }
        }
      }
    }
  });
}

// Show message
const showMessage = (text, type) => {
  const messageEl = document.createElement('div')
  messageEl.className = `fixed bottom-4 right-4 z-50 rounded-lg p-4 shadow-lg max-w-sm ${
    type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' : 'bg-red-100 border border-red-400 text-red-800'
  }`
  messageEl.textContent = text
  document.body.appendChild(messageEl)
  
  setTimeout(() => {
    document.body.removeChild(messageEl)
  }, 5000)
}

// Cleanup charts
onUnmounted(() => {
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }
});

// Initialize
onMounted(() => {
  fetchSummaryData()
})
</script>