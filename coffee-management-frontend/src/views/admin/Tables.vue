<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useShiftStore } from '@/stores/shift'
import { useTablesStore } from '@/stores/tables'
import { useClientsStore } from '@/stores/clients'
import { formatCurrency, formatTime, getDuration } from '@/utils/formatters'
import { MESSAGES, REFRESH_INTERVALS } from '@/utils/constants'
import ClientModal from '@/components/ClientModal.vue'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const shiftStore = useShiftStore()
const tablesStore = useTablesStore()
const clientsStore = useClientsStore()

const showAddTableModal = ref(false)
const showOccupyModal = ref(false)
const showReleaseModal = ref(false)
const showAddClientModal = ref(false)
const selectedTable = ref(null)
const message = ref(null)
const isLoading = ref(false)
const isRefreshing = ref(false)

const newTable = ref({
  table_number: ''
})

const occupyForm = ref({
  client_id: ''
})

let refreshInterval = null

const tables = computed(() => tablesStore.tablesWithStatus)
const clients = computed(() => clientsStore.clients)
const occupiedTables = computed(() => tables.value.filter(t => t.status === 'occupied'))
const freeTables = computed(() => tables.value.filter(t => t.status === 'free'))

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

const selectTableForOccupancy = (table) => {
  selectedTable.value = table
  showOccupyModal.value = true
}

const selectTableForRelease = (table) => {
  selectedTable.value = table
  showReleaseModal.value = true
}

const closeOccupyModal = () => {
  showOccupyModal.value = false
  selectedTable.value = null
  occupyForm.value.client_id = ''
}

const closeReleaseModal = () => {
  showReleaseModal.value = false
  selectedTable.value = null
}

const addTable = async () => {
  if (!newTable.value.table_number) return
  
  const result = await tablesStore.createTable(newTable.value)
  
  if (result.success) {
    showMessage('Столик успешно добавлен', 'success')
    showAddTableModal.value = false
    newTable.value.table_number = ''
  } else {
    showMessage(result.error, 'error')
  }
}

const occupyTable = async () => {
  if (!occupyForm.value.client_id) return
  
  isLoading.value = true
  const result = await tablesStore.occupyTable(selectedTable.value.id, occupyForm.value.client_id)
  
  if (result.success) {
    showMessage(MESSAGES.TABLE_OCCUPIED, 'success')
    closeOccupyModal()
  } else {
    showMessage(result.error, 'error')
  }
  isLoading.value = false
}

const releaseTable = async () => {
  if (!selectedTable.value?.session) return
  
  isLoading.value = true
  const result = await tablesStore.releaseTable(selectedTable.value.session.id)
  
  if (result.success) {
    showMessage(MESSAGES.TABLE_RELEASED, 'success')
    closeReleaseModal()
  } else {
    showMessage(result.error, 'error')
  }
  isLoading.value = false
}

const viewOrders = (sessionId, sessionType) => {
  router.push(`/admin/orders/${sessionId}/${sessionType}`)
}

const handleClientAdded = (client) => {
  showAddClientModal.value = false
  occupyForm.value.client_id = client.id
}

const refreshData = async () => {
  isRefreshing.value = true
  await tablesStore.refreshData()
  isRefreshing.value = false
}

onMounted(async () => {
  await Promise.all([
    tablesStore.refreshData(),
    clientsStore.fetchClients()
  ])
  
  refreshInterval = setInterval(refreshData, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Заголовок и действия -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Управление столиками</h1>
          <p class="mt-1 text-sm text-gray-500">Управляйте столиками и контролируйте занятость</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="refreshData"
            :disabled="isRefreshing"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon :class="`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`" />
            {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
          </button>
          <button
            @click="showAddTableModal = true"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Добавить столик
          </button>
        </div>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <TableCellsIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Всего столиков</p>
              <p class="text-2xl font-bold text-gray-900">{{ tables.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <CheckIcon class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Свободно</p>
              <p class="text-2xl font-bold text-gray-900">{{ freeTables.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 rounded-lg">
              <UserGroupIcon class="w-6 h-6 text-red-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Занято</p>
              <p class="text-2xl font-bold text-gray-900">{{ occupiedTables.length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <div 
      v-if="message" 
      :class="`mb-6 p-4 rounded-lg shadow-sm ${
        message.type === 'success' 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`"
    >
      <div class="flex items-center">
        <CheckIcon v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
        <ExclamationTriangleIcon v-else class="w-5 h-5 mr-2" />
        {{ message.text }}
      </div>
    </div>

    <!-- Список столиков -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="table in tables"
        :key="table.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Заголовок карточки -->
        <div class="p-6 pb-4">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <div class="p-2 bg-gray-100 rounded-lg mr-3">
                <TableCellsIcon class="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Столик {{ table.table_number }}</h3>
                <span
                  :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    table.status === 'free' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`"
                >
                  <span 
                    :class="`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      table.status === 'free' ? 'bg-green-400' : 'bg-red-400'
                    }`"
                  ></span>
                  {{ table.status === 'free' ? 'Свободен' : 'Занят' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Информация о занятом столике -->
          <div v-if="table.status === 'occupied' && table.session" class="space-y-3">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-1 gap-3 text-sm">
                <div class="flex items-center text-gray-600">
                  <UserGroupIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Клиент:</span>
                  <span class="ml-1 text-gray-900">{{ table.session.client?.name || 'Не указан' }}</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                  <ClockIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Начало:</span>
                  <span class="ml-1 text-gray-900">{{ formatTime(table.session.start_time) }}</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                  <ClockIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Длительность:</span>
                  <span class="ml-1 text-gray-900">{{ getDuration(table.session.start_time) }}</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                  <CurrencyDollarIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Сумма:</span>
                  <span class="ml-1 text-gray-900 font-semibold">{{ formatCurrency(table.session.current_total || table.session.total_amount) }}</span>
                </div>
                
                <div class="flex items-center text-gray-600">
                  <span class="font-medium">Заказов:</span>
                  <span class="ml-1 text-gray-900">{{ table.session.orders_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Действия -->
        <div class="px-6 pb-6">
          <div v-if="table.status === 'occupied' && table.session" class="flex gap-2">
            <button
              @click="viewOrders(table.session.id, 'table')"
              class="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <EyeIcon class="w-4 h-4 mr-1" />
              Заказы
            </button>
            <button
              @click="selectTableForRelease(table)"
              class="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <XMarkIcon class="w-4 h-4 mr-1" />
              Освободить
            </button>
          </div>

          <div v-else>
            <button
              @click="selectTableForOccupancy(table)"
              class="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <CheckIcon class="w-4 h-4 mr-2" />
              Занять столик
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-if="tables.length === 0" class="text-center py-12">
      <div class="bg-white rounded-xl p-12 shadow-sm border border-gray-200 max-w-md mx-auto">
        <div class="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
          <TableCellsIcon class="w-10 h-10 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Нет столиков</h3>
        <p class="text-gray-500 mb-6">Создайте столик, чтобы начать работу с клиентами</p>
        <button
          @click="showAddTableModal = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Добавить первый столик
        </button>
      </div>
    </div>

    <!-- Модальные окна остаются без изменений, но с улучшенными стилями -->
    
    <!-- Модальное окно добавления столика -->
    <div v-if="showAddTableModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Добавить новый столик</h2>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2" for="table_number">
              Номер столика
            </label>
            <input
              v-model="newTable.table_number"
              id="table_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите номер столика"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showAddTableModal = false"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Отмена
            </button>
            <button
              @click="addTable"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="!newTable.table_number"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Остальные модальные окна с аналогичными улучшениями стилей... -->
    <!-- Модальное окно занятия столика -->
    <div v-if="showOccupyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Занять столик {{ selectedTable?.table_number }}</h2>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2" for="client_id">
              Клиент
            </label>
            <div class="flex">
              <select
                v-model="occupyForm.client_id"
                id="client_id"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите клиента</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }} ({{ client.phone || 'без телефона' }})
                </option>
              </select>
              <button
                @click="showAddClientModal = true"
                class="bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="closeOccupyModal"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Отмена
            </button>
            <button
              @click="occupyTable"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="!occupyForm.client_id || isLoading"
            >
              {{ isLoading ? 'Загрузка...' : 'Занять' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно освобождения столика -->
    <div v-if="showReleaseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Освободить столик {{ selectedTable?.table_number }}</h2>
          <div class="mb-6">
            <p class="text-gray-700 mb-4">
              Вы уверены, что хотите освободить столик? Клиент будет отмечен как ушедший, а сессия будет закрыта.
            </p>
            <div v-if="selectedTable?.session" class="bg-gray-50 rounded-lg p-4">
              <div class="space-y-2 text-sm">
                <p><span class="font-medium text-gray-700">Клиент:</span> {{ selectedTable.session.client?.name || 'Не указан' }}</p>
                <p><span class="font-medium text-gray-700">Начало:</span> {{ formatTime(selectedTable.session.start_time) }}</p>
                <p><span class="font-medium text-gray-700">Длительность:</span> {{ getDuration(selectedTable.session.start_time) }}</p>
                <p><span class="font-medium text-gray-700">Сумма:</span> <span class="font-semibold">{{ formatCurrency(selectedTable.session.current_total || selectedTable.session.total_amount) }}</span></p>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="closeReleaseModal"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Отмена
            </button>
            <button
              @click="releaseTable"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Загрузка...' : 'Освободить' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления клиента -->
    <ClientModal 
      v-if="showAddClientModal" 
      @close="showAddClientModal = false"
      @client-added="handleClientAdded"
    />
  </div>
</template>