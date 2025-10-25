<template>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p class="text-gray-600 mt-1">Управление базой клиентов</p>
        </div>
        <button
          @click="showAddModal = true"
          class="btn-primary mt-4 sm:mt-0"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          Добавить клиента
        </button>
      </div>
  
      <!-- Search -->
      <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div class="flex-1">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                class="input-field pl-10"
                placeholder="Поиск по имени или телефону..."
              />
            </div>
          </div>
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="btn-secondary"
          >
            Очистить
          </button>
        </div>
      </div>
  
      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <UsersIcon class="h-6 w-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-600">Всего клиентов</p>
              <p class="text-2xl font-bold text-gray-900">{{ clients.length }}</p>
            </div>
          </div>
        </div>
  
        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon class="h-6 w-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-600">Общая выручка</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalSpent) }}</p>
            </div>
          </div>
        </div>
  
        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon class="h-6 w-6 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-600">Средний чек</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(averageSpent) }}</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Clients List -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">
            Список клиентов ({{ filteredClients.length }})
          </h2>
        </div>
  
        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-gray-500 mt-2">Загрузка...</p>
        </div>
  
        <!-- Empty State -->
        <div v-else-if="filteredClients.length === 0" class="text-center py-8">
          <UsersIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">
            {{ searchQuery ? 'Клиенты не найдены' : 'Клиентов пока нет' }}
          </p>
        </div>
  
        <!-- Clients Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статистика
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последний визит
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="client in paginatedClients"
                :key="client.id"
                class="hover:bg-gray-50"
              >
                <!-- Client Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ client.name }}</div>
                    <div class="text-sm text-gray-500">{{ formatPhone(client.phone) }}</div>
                  </div>
                </td>
  
                <!-- Stats -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ client.total_visits || 0 }} {{ declination(client.total_visits || 0, ['визит', 'визита', 'визитов']) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    Потрачено: {{ formatCurrency(client.total_spent || 0) }}
                  </div>
                </td>
  
                <!-- Last Visit -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ client.updated_at ? formatDate(client.updated_at) : 'Нет данных' }}
                </td>
  
                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="viewClientHistory(client)"
                    class="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    История
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              @click="currentPage > 1 && (currentPage--)"
              class="btn-secondary"
              :disabled="currentPage === 1"
            >
              Назад
            </button>
            <button
              @click="currentPage < totalPages && (currentPage++)"
              class="btn-secondary ml-3"
              :disabled="currentPage === totalPages"
            >
              Вперед
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Показано
                <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                до
                <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredClients.length) }}</span>
                из
                <span class="font-medium">{{ filteredClients.length }}</span>
                результатов
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  @click="currentPage > 1 && (currentPage--)"
                  class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  :disabled="currentPage === 1"
                >
                  <ChevronLeftIcon class="h-5 w-5" />
                </button>
                
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  :class="{
                    'bg-blue-600 text-white': page === currentPage,
                    'text-gray-900': page !== currentPage
                  }"
                >
                  {{ page }}
                </button>
                
                <button
                  @click="currentPage < totalPages && (currentPage++)"
                  class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  :disabled="currentPage === totalPages"
                >
                  <ChevronRightIcon class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add Client Modal -->
      <ClientModal
        :is-open="showAddModal"
        @close="showAddModal = false"
        @success="handleClientAdded"
      />
  
      <!-- Client History Modal -->
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              История клиента: {{ selectedClient?.name }}
            </h3>
            <button
              @click="closeHistoryModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
  
          <div v-if="clientHistory.length === 0" class="text-center py-8">
            <ClockIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">История посещений пуста</p>
          </div>
  
          <div v-else class="space-y-4">
            <div
              v-for="visit in clientHistory"
              :key="visit.id"
              class="bg-gray-50 rounded-lg p-4"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900">
                  {{ visit.session_type === 'vip' ? 'VIP зал' : `Столик ${visit.table_number}` }}
                </span>
                <span class="text-sm text-gray-500">{{ formatDate(visit.start_time) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Время:</span>
                  <span class="ml-2">{{ formatTime(visit.start_time) }} - {{ formatTime(visit.end_time) }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Сумма:</span>
                  <span class="ml-2 font-medium">{{ formatCurrency(visit.total_amount) }}</span>
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
  import { ref, onMounted, computed } from 'vue'
  import { useClientsStore } from '@/stores/clients'
  import { formatCurrency, formatPhone, formatDate, formatTime } from '@/utils/formatters'
  import { MESSAGES } from '@/utils/constants'
  import ClientModal from '@/components/ClientModal.vue'
  import {
    PlusIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    XMarkIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon
  } from '@heroicons/vue/24/outline'
  
  const clientsStore = useClientsStore()
  
  const showAddModal = ref(false)
  const showHistoryModal = ref(false)
  const selectedClient = ref(null)
  const clientHistory = ref([])
  const message = ref(null)
  const currentPage = ref(1)
  const itemsPerPage = 10
  
  const searchQuery = computed({
    get: () => clientsStore.searchQuery,
    set: (value) => clientsStore.setSearchQuery(value)
  })
  
  const clients = computed(() => clientsStore.clients)
  const filteredClients = computed(() => clientsStore.filteredClients)
  const isLoading = computed(() => clientsStore.isLoading)
  
  const totalSpent = computed(() => {
    return clients.value.reduce((total, client) => total + (client.total_spent || 0), 0)
  })
  
  const averageSpent = computed(() => {
    const clientsWithSpending = clients.value.filter(c => (c.total_spent || 0) > 0)
    if (clientsWithSpending.length === 0) return 0
    return totalSpent.value / clientsWithSpending.length
  })
  
  const totalPages = computed(() => {
    return Math.ceil(filteredClients.value.length / itemsPerPage)
  })
  
  const paginatedClients = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredClients.value.slice(start, end)
  })
  
  const visiblePages = computed(() => {
    const pages = []
    const total = totalPages.value
    const current = currentPage.value
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...', total)
      } else if (current >= total - 3) {
        pages.push(1, '...')
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total)
      }
    }
    
    return pages.filter(page => page !== '...' || pages.indexOf(page) === pages.lastIndexOf(page))
  })
  
  const showMessage = (text, type) => {
    message.value = { text, type }
    setTimeout(() => {
      message.value = null
    }, 3000)
  }
  
  const clearSearch = () => {
    clientsStore.clearSearch()
    currentPage.value = 1
  }
  
  const declination = (count, words) => {
    const cases = [2, 0, 1, 1, 1, 2]
    const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]
    return words[index]
  }
  
  const handleClientAdded = (client) => {
    showAddModal.value = false
    showMessage(MESSAGES.CLIENT_CREATED, 'success')
  }
  
  const viewClientHistory = async (client) => {
    selectedClient.value = client
    showHistoryModal.value = true
    
    try {
      clientHistory.value = await clientsStore.getClientHistory(client.id)
    } catch (error) {
      showMessage('Ошибка при загрузке истории клиента', 'error')
    }
  }
  
  const closeHistoryModal = () => {
    showHistoryModal.value = false
    selectedClient.value = null
    clientHistory.value = []
  }
  
  onMounted(() => {
    clientsStore.fetchClients()
  })
  </script>