<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">VIP зал</h1>
          <p class="text-gray-600 mt-2">Управление VIP сессиями и премиум обслуживанием</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="refreshData"
            :disabled="isRefreshing"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon :class="`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`" />
            {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
          </button>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            :disabled="!shiftStore.currentShift"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Создать VIP сессию
          </button>
        </div>
      </div>
    </div>

    <!-- Shift Warning -->
    <div v-if="!shiftStore.currentShift" class="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center">
        <div class="p-2 bg-amber-100 rounded-lg">
          <ExclamationTriangleIcon class="h-6 w-6 text-amber-600" />
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-amber-800 font-medium text-lg">Смена не начата</h3>
          <p class="text-amber-700 text-sm mt-1">
            Для работы с VIP залом необходимо начать смену
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
      <!-- Active Sessions -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-xl">
            <StarIcon class="h-7 w-7 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Активные сессии</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeSessions.length }}</p>
            <p class="text-xs text-gray-500 mt-1">VIP клиентов</p>
          </div>
        </div>
      </div>

      <!-- Expiring Sessions -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-amber-100 rounded-xl">
            <ClockIcon class="h-7 w-7 text-amber-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Истекающие сессии</p>
            <p class="text-2xl font-bold text-gray-900">{{ expiringSessions.length }}</p>
            <p class="text-xs text-gray-500 mt-1">требуют внимания</p>
          </div>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-xl">
            <CurrencyDollarIcon class="h-7 w-7 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Общая выручка</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalRevenue) }}</p>
            <p class="text-xs text-gray-500 mt-1">за VIP сессии</p>
          </div>
        </div>
      </div>

      <!-- Average Session -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <StarIcon class="h-7 w-7 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Средняя сессия</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(averageSessionValue) }}</p>
            <p class="text-xs text-gray-500 mt-1">за сессию</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Sessions -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Активные VIP сессии</h2>
        <div class="text-sm text-gray-500">
          Последнее обновление: {{ lastUpdateTime }}
        </div>
      </div>
      
      <div v-if="activeSessions.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
        <div class="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4">
          <StarIcon class="h-10 w-10 text-purple-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Активных VIP сессий нет</h3>
        <p class="text-gray-500 mb-6">Создайте новую VIP сессию для клиента</p>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          :disabled="!shiftStore.currentShift"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Создать VIP сессию
        </button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="session in activeSessions"
          :key="session.id"
          class="bg-white rounded-xl shadow-sm border transition-all hover:shadow-md"
          :class="{
            'border-purple-600 bg-red-50': session.is_expired,
            'border-amber-300 bg-amber-50': session.is_expiring && !session.is_expired,
            'border-gray-200': !session.is_expired && !session.is_expiring
          }"
        >
          <!-- Session Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="p-2 bg-purple-100 rounded-lg mr-3">
                  <StarIcon class="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 text-lg">{{ session.client_name || 'VIP Клиент' }}</h3>
                  <p class="text-sm text-gray-600">{{ session.client_phone || 'Телефон не указан' }}</p>
                </div>
              </div>
              <div class="text-right">
                <VipTimer v-if="session.end_time_calculated" :end-time="session.end_time_calculated" />
                <div v-else-if="session.end_time" class="text-xs text-gray-500">
                  Окончание: {{ formatTime(session.end_time) }}
                </div>
                <div v-else class="text-xs text-gray-500">Время не установлено</div>
              </div>
            </div>

            <!-- Session Details -->
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="flex items-center text-gray-600">
                  <ClockIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Начало:</span>
                </div>
                <div class="text-gray-900 font-medium">{{ formatTime(session.start_time) }}</div>
                
                <div class="flex items-center text-gray-600">
                  <ClockIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Длительность:</span>
                </div>
                <div class="text-gray-900 font-medium">{{ session.duration_hours }}ч</div>
                
                <div class="flex items-center text-gray-600">
                  <CurrencyDollarIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Оплачено:</span>
                </div>
                <div class="text-gray-900 font-medium">{{ formatCurrency(session.paid_amount || 0) }}</div>
                
                <div class="flex items-center text-gray-600">
                  <ShoppingBagIcon class="w-4 h-4 mr-2" />
                  <span class="font-medium">Заказы:</span>
                </div>
                <div class="text-gray-900 font-medium">
                  {{ formatCurrency(getSessionOrdersTotal(session)) }}
                </div>
              </div>
              
              <div class="border-t border-gray-200 mt-3 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-900 font-semibold">Итого:</span>
                  <span class="text-lg font-bold text-green-600">
                    {{ formatCurrency(calculateSessionTotal(session)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="px-6 pb-6">
            <div class="space-y-3">
              <button
                @click="viewOrders(session.id, 'vip')"
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <EyeIcon class="w-4 h-4 mr-2" />
                Заказы ({{ getSessionOrdersCount(session) }})
              </button>
              
              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="selectSessionForExtension(session)"
                  class="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon class="w-4 h-4 mr-1" />
                  Продлить
                </button>
                <button
                  @click="selectSessionForClosure(session)"
                  class="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <XMarkIcon class="w-4 h-4 mr-1" />
                  Завершить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create VIP Session Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto shadow-xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">Создать VIP сессию</h3>
        
        <form @submit.prevent="createSession" class="space-y-6">
          <!-- Client Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Клиент *</label>
            <div class="flex gap-2">
              <select
                v-model="createForm.client_id"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Выберите клиента</option>
                <option
                  v-for="client in clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }} ({{ client.phone || 'без телефона' }})
                </option>
              </select>
              <button
                type="button"
                @click="showAddClientModal = true"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Длительность (часы) *</label>
            <select
              v-model.number="createForm.duration_hours"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              @change="updatePrice"
            >
              <option value="">Выберите длительность</option>
              <option v-for="hour in [1, 2, 3, 4, 5, 6]" :key="hour" :value="hour">
                {{ hour }} {{ hour === 1 ? 'час' : hour <= 4 ? 'часа' : 'часов' }}
              </option>
            </select>
          </div>

          <!-- Price -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Сумма к оплате (сум) *</label>
            <input
              v-model.number="createForm.paid_amount"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Введите сумму"
              min="10000"
              step="1000"
              required
            />
          </div>

          <!-- Error Message -->
          <div v-if="createError" class="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {{ createError }}
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeCreateModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading || !isCreateFormValid"
            >
              <span v-if="isLoading">Создание...</span>
              <span v-else>Создать</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Остальные модальные окна с аналогичными улучшениями стилей... -->
    
    <!-- Extend Session Modal -->
    <div
      v-if="showExtendModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">
          Продлить сессию {{ selectedSession?.client_name }}
        </h3>
        
        <form @submit.prevent="extendSession" class="space-y-6">
          <!-- Additional Hours -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Дополнительные часы *</label>
            <select
              v-model.number="extendForm.additional_hours"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              @change="updateExtendPrice"
            >
              <option value="">Выберите количество часов</option>
              <option v-for="hour in [1, 2, 3, 4]" :key="hour" :value="hour">
                {{ hour }} {{ hour === 1 ? 'час' : hour <= 4 ? 'часа' : 'часов' }}
              </option>
            </select>
          </div>

          <!-- Additional Payment -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Доплата (сум) *</label>
            <input
              v-model.number="extendForm.additional_payment"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Введите сумму доплаты"
              min="10000"
              step="1000"
              required
            />
          </div>

          <!-- Current Session Info -->
          <div v-if="selectedSession" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-sm text-gray-600">
              Текущее окончание: 
              <span class="font-medium text-gray-900">{{ formatDateTime(selectedSession.end_time) }}</span>
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="extendError" class="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {{ extendError }}
          </div>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeExtendModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="isLoading || !isExtendFormValid"
            >
              <span v-if="isLoading">Продление...</span>
              <span v-else>Продлить</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Close Session Modal -->
    <div
      v-if="showCloseModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">
          Завершить сессию {{ selectedSession?.client_name }}?
        </h3>
        
        <div v-if="selectedSession" class="mb-8">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-blue-700 font-medium">Длительность:</span>
                <span class="text-gray-900 font-semibold">{{ getDuration(selectedSession.start_time) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-700 font-medium">Оплачено за время:</span>
                <span class="text-gray-900 font-semibold">{{ formatCurrency(selectedSession.paid_amount || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-700 font-medium">Заказы:</span>
                <span class="text-gray-900 font-semibold">
                  {{ formatCurrency(getSessionOrdersTotal(selectedSession)) }}
                </span>
              </div>
              <div class="border-t border-blue-200 pt-3 flex justify-between">
                <span class="text-blue-900 font-bold">Итого:</span>
                <span class="text-lg font-bold text-blue-900">
                  {{ formatCurrency(calculateSessionTotal(selectedSession)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="closeCloseModal"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="closeSession"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Завершение...</span>
            <span v-else>Завершить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Client Modal -->
    <ClientModal
      :is-open="showAddClientModal"
      @close="showAddClientModal = false"
      @success="handleClientAdded"
    />

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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useShiftStore } from '@/stores/shift'
import { useVipSessionsStore } from '@/stores/vipSessions'
import { useClientsStore } from '@/stores/clients'
import { formatCurrency, formatTime, formatDateTime, getDuration } from '@/utils/formatters'
import { VIP_DEFAULT_PRICES, MESSAGES, REFRESH_INTERVALS } from '@/utils/constants'
import api from '@/services/api'
import ClientModal from '@/components/ClientModal.vue'
import VipTimer from '@/components/VipTimer.vue'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  ShoppingBagIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const shiftStore = useShiftStore()
const vipSessionsStore = useVipSessionsStore()
const clientsStore = useClientsStore()

const showCreateModal = ref(false)
const showExtendModal = ref(false)
const showCloseModal = ref(false)
const showAddClientModal = ref(false)
const selectedSession = ref(null)
const message = ref(null)
const isLoading = ref(false)
const isRefreshing = ref(false)
const lastUpdateTime = ref('')

const createForm = ref({
  client_id: '',
  duration_hours: '',
  paid_amount: ''
})

const extendForm = ref({
  additional_hours: '',
  additional_payment: ''
})

const createError = ref('')
const extendError = ref('')

let refreshInterval = null

const activeSessions = computed(() => vipSessionsStore.activeSessionsWithTimers)
const expiringSessions = computed(() => vipSessionsStore.expiredSessions)
const clients = computed(() => clientsStore.clients)

const totalRevenue = computed(() => {
  return activeSessions.value.reduce((total, session) => {
    return total + calculateSessionTotal(session)
  }, 0)
})

const averageSessionValue = computed(() => {
  if (activeSessions.value.length === 0) return 0
  return totalRevenue.value / activeSessions.value.length
})

// Вспомогательные функции для работы с заказами VIP сессий
const getSessionOrdersCount = (session) => {
  // Используем подсчитанное количество заказов
  const count = session.calculated_orders_count || 
                session.orders_count || 
                0
  
  console.log(`🔢 getSessionOrdersCount для сессии ${session.id}:`, {
    calculated_orders_count: session.calculated_orders_count,
    orders_count: session.orders_count,
    final_count: count
  })
  
  return count
}

const getSessionOrdersTotal = (session) => {
  // Согласно API документации: используем current_orders_total из VIP Sessions API
  const total = session.current_orders_total || 
                session.total_orders_amount || 
                0
  
  console.log(`🔍 getSessionOrdersTotal для сессии ${session.id}:`, {
    current_orders_total: session.current_orders_total,
    total_orders_amount: session.total_orders_amount,
    final_total: total
  })
  
  return parseFloat(total)
}

const calculateSessionTotal = (session) => {
  if (!session) return 0
  
  const paidAmount = parseFloat(session.paid_amount || 0)
  const ordersTotal = parseFloat(getSessionOrdersTotal(session) || 0)
  const total = paidAmount + ordersTotal
  
  // Отладочные логи для проверки расчета
  console.log(`💰 Расчет итоговой суммы для сессии ${session.id}:`, {
    client_name: session.client_name,
    paid_amount_raw: session.paid_amount,
    paid_amount_parsed: paidAmount,
    orders_total_raw: getSessionOrdersTotal(session),
    orders_total_parsed: ordersTotal,
    total_calculated: total,
    // Проверяем типы данных
    paid_amount_type: typeof session.paid_amount,
    orders_total_type: typeof getSessionOrdersTotal(session),
    total_type: typeof total
  })
  
  return total
}

const isCreateFormValid = computed(() => {
  return createForm.value.client_id && 
         createForm.value.duration_hours && 
         createForm.value.paid_amount
})

const isExtendFormValid = computed(() => {
  return extendForm.value.additional_hours && 
         extendForm.value.additional_payment
})

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const updatePrice = () => {
  const hours = createForm.value.duration_hours
  if (hours && VIP_DEFAULT_PRICES[hours]) {
    createForm.value.paid_amount = VIP_DEFAULT_PRICES[hours]
  }
}

const updateExtendPrice = () => {
  const hours = extendForm.value.additional_hours
  if (hours && VIP_DEFAULT_PRICES[hours]) {
    extendForm.value.additional_payment = VIP_DEFAULT_PRICES[hours]
  }
}

const selectSessionForExtension = (session) => {
  selectedSession.value = session
  showExtendModal.value = true
}

const selectSessionForClosure = (session) => {
  selectedSession.value = session
  showCloseModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.value = {
    client_id: '',
    duration_hours: '',
    paid_amount: ''
  }
  createError.value = ''
}

const closeExtendModal = () => {
  showExtendModal.value = false
  selectedSession.value = null
  extendForm.value = {
    additional_hours: '',
    additional_payment: ''
  }
  extendError.value = ''
}

const closeCloseModal = () => {
  showCloseModal.value = false
  selectedSession.value = null
}

const createSession = async () => {
  isLoading.value = true
  createError.value = ''
  
  const result = await vipSessionsStore.createSession(createForm.value)
  
  if (result.success) {
    showMessage('VIP сессия успешно создана!', 'success')
    closeCreateModal()
  } else {
    createError.value = result.error
  }
  isLoading.value = false
}

const extendSession = async () => {
  if (!selectedSession.value) return
  
  isLoading.value = true
  extendError.value = ''
  
  const result = await vipSessionsStore.extendSession(selectedSession.value.id, extendForm.value)
  
  if (result.success) {
    showMessage('VIP сессия успешно продлена!', 'success')
    closeExtendModal()
  } else {
    extendError.value = result.error
  }
  isLoading.value = false
}

const closeSession = async () => {
  if (!selectedSession.value) return
  
  isLoading.value = true
  const result = await vipSessionsStore.closeSession(selectedSession.value.id)
  
  if (result.success) {
    const totalAmount = calculateSessionTotal(selectedSession.value)
    showMessage(`VIP сессия завершена! Итого: ${formatCurrency(totalAmount)}`, 'success')
    closeCloseModal()
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
  createForm.value.client_id = client.id
}

const refreshData = async () => {
  isRefreshing.value = true
  try {
    console.log('🔄 Обновляем данные VIP зала...')
    
    // Получаем VIP сессии
    await vipSessionsStore.refreshData()
    
    // Отладочные логи для VIP сессий
    console.log('📊 VIP Sessions Store Data:')
    console.log('- activeSessions computed:', activeSessions.value)
    console.log('- raw store data:', vipSessionsStore)
    
    // Для каждой активной VIP сессии получаем заказы
    if (activeSessions.value && activeSessions.value.length > 0) {
      console.log('🔍 Детальный анализ VIP сессий:')
      
      for (const session of activeSessions.value) {
        console.log(`VIP Session ${session.id}:`, {
          id: session.id,
          client_name: session.client_name,
          client_phone: session.client_phone,
          paid_amount: session.paid_amount,
          total_orders_amount: session.total_orders_amount,
          duration_hours: session.duration_hours,
          start_time: session.start_time,
          end_time: session.end_time,
          is_active: session.is_active,
          // Показываем все доступные поля
          allFields: Object.keys(session)
        })
        
        // Пытаемся получить заказы для этой VIP сессии через общий endpoint
        try {
          console.log(`📝 Получаем заказы для VIP сессии ${session.id} через /orders/vip-session/${session.id}...`)
          
          // Согласно схеме API: GET /api/orders/vip-session/:vipSessionId
          const ordersResponse = await api.get(`/orders/vip-session/${session.id}`)
          const orders = ordersResponse.data.data || []
          
          console.log(`🛒 Заказы для VIP сессии ${session.id} (прямой запрос):`, orders)
          
          if (orders.length > 0) {
            // Рассчитываем сумму заказов и количество
            const ordersTotal = orders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)
            const ordersCount = orders.length
            
            console.log(`💰 Сессия ${session.id} (прямой запрос) - Заказов: ${ordersCount}, Сумма: ${ordersTotal}`)
            
            // Обновляем данные сессии напрямую
            session.direct_orders = orders
            session.direct_orders_count = ordersCount
            session.direct_orders_total = ordersTotal
          }
          
        } catch (orderError) {
          console.warn(`⚠️ Прямой запрос заказов для VIP сессии ${session.id} не удался:`, orderError.message)
          // Это нормально, будем использовать общий список заказов
        }
      }
    } else {
      console.log('❌ Нет активных VIP сессий')
    }
    
    // Также попробуем получить все заказы за сегодня с фильтром по VIP
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log(`📅 Получаем все VIP заказы за ${today}...`)
      
      // GET /api/orders?date=YYYY-MM-DD
      const allOrdersResponse = await api.get(`/orders?date=${today}`)
      const allOrders = allOrdersResponse.data.data || []
      
      console.log('📦 Все заказы за сегодня:', allOrders)
      
      // Фильтруем VIP заказы по полю session_type или vip_session_id
      const vipOrders = allOrders.filter(order => 
        order.session_type === 'vip' || order.vip_session_id !== null
      )
      
      console.log('🏆 Отфильтрованные VIP заказы за сегодня:', vipOrders)
      
      // Проверяем соответствие ID сессий и заказов
      console.log('🔍 Проверка соответствия ID:')
      console.log('- ID активных VIP сессий:', activeSessions.value.map(s => s.id))
      console.log('- vip_session_id в заказах:', [...new Set(vipOrders.map(o => o.vip_session_id))])
      
      // Проверяем каждый VIP заказ
      vipOrders.forEach(order => {
        const matchingSession = activeSessions.value.find(s => s.id == order.vip_session_id)
        console.log(`📝 Заказ "${order.item_name}" (${order.price} сум):`, {
          vip_session_id: order.vip_session_id,
          session_type: order.session_type,
          has_matching_session: !!matchingSession,
          matching_session_client: matchingSession?.client_name
        })
      })
      
      // Группируем заказы по VIP сессиям
      const ordersByVipSession = {}
      vipOrders.forEach(order => {
        const sessionId = order.vip_session_id
        if (sessionId) {
          if (!ordersByVipSession[sessionId]) {
            ordersByVipSession[sessionId] = []
          }
          ordersByVipSession[sessionId].push(order)
        }
      })
      
      console.log('📊 Заказы сгруппированные по VIP сессиям:', ordersByVipSession)
      
      // Проверяем что заказы попали в правильные группы
      Object.keys(ordersByVipSession).forEach(sessionId => {
        const orders = ordersByVipSession[sessionId]
        const session = activeSessions.value.find(s => s.id == sessionId)
        console.log(`📋 Группа сессии ${sessionId} (${session?.client_name}):`, {
          orders_count: orders.length,
          orders: orders.map(o => ({ item_name: o.item_name, price: o.price })),
          total_amount: orders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
        })
      })
      
      // Обновляем данные активных сессий с правильными данными
      activeSessions.value.forEach(session => {
        const sessionOrders = ordersByVipSession[session.id] || []
        const ordersTotal = sessionOrders.reduce((sum, order) => 
          sum + parseFloat(order.price || 0), 0
        )
        
        console.log(`🔄 Обновляем сессию ${session.id} (${session.client_name}):`)
        console.log('   - До обновления:', {
          orders_count: session.orders_count,
          total_orders_amount: session.total_orders_amount,
          current_orders_count: session.current_orders_count,
          current_orders_total: session.current_orders_total
        })
        
        // Обновляем данные сессии
        session.current_orders = sessionOrders
        session.current_orders_count = sessionOrders.length
        session.current_orders_total = ordersTotal
        
        console.log('   - После обновления:', {
          current_orders_count: session.current_orders_count,
          current_orders_total: session.current_orders_total,
          orders_details: sessionOrders.map(o => ({
            item_name: o.item_name,
            price: o.price,
            vip_session_id: o.vip_session_id
          }))
        })
        
        console.log(`💰 Итого для сессии ${session.id}: ${session.current_orders_count} заказов на сумму ${session.current_orders_total}`)
      })
      
    } catch (allOrdersError) {
      console.error('❌ Ошибка получения всех VIP заказов:', allOrdersError)
    }
    
    lastUpdateTime.value = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    console.log('✅ Данные VIP зала обновлены в', lastUpdateTime.value)
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении данных VIP зала:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    })
  } finally {
    isRefreshing.value = false
  }
}

onMounted(async () => {
  console.log('🚀 Монтируем VIP зал компонент...')
  
  try {
    console.log('📡 Загружаем данные VIP сессий и клиентов...')
    
    await Promise.all([
      vipSessionsStore.refreshData(),
      clientsStore.fetchClients()
    ])
    
    console.log('👥 Загруженные клиенты:', clientsStore.clients)
    console.log('🏢 VIP Sessions Store после загрузки:', vipSessionsStore)
    
    // Проверяем API endpoints
    console.log('🔗 Проверяем доступные API методы VIP store:')
    console.log('- refreshData method exists:', typeof vipSessionsStore.refreshData === 'function')
    console.log('- createSession method exists:', typeof vipSessionsStore.createSession === 'function')
    console.log('- activeSessionsWithTimers:', vipSessionsStore.activeSessionsWithTimers)
    
    lastUpdateTime.value = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    console.log('⏰ Первоначальная загрузка завершена в', lastUpdateTime.value)
    
    // Auto-refresh every 10 seconds for VIP timers
    console.log('🔄 Настраиваем автообновление каждые 10 секунд')
    refreshInterval = setInterval(() => {
      console.log('⏰ Автообновление VIP данных...')
      refreshData()
    }, 10000)
    
  } catch (error) {
    console.error('❌ Ошибка при первоначальной загрузке VIP зала:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    })
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>