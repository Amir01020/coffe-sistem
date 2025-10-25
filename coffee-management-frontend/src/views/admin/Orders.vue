<template>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center space-x-4">
        <button
          @click="goBack"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon class="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Заказы {{ sessionType === 'vip' ? 'VIP зала' : `столика ${sessionData?.table_number}` }}
          </h1>
          <p v-if="sessionData" class="text-gray-600 mt-1">
            Клиент: {{ sessionData.client_name }} • 
            Начало: {{ formatTime(sessionData.start_time) }}
          </p>
        </div>
      </div>
  
      <!-- Session Info -->
      <div v-if="sessionData" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Session Details -->
        <div class="card">
          <h3 class="font-medium text-gray-900 mb-3">Информация о сессии</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Клиент:</span>
              <span class="font-medium">{{ sessionData.client_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Телефон:</span>
              <span class="font-medium">{{ formatPhone(sessionData.client_phone) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Начало:</span>
              <span class="font-medium">{{ formatDateTime(sessionData.start_time) }}</span>
            </div>
            <div v-if="sessionType === 'vip'" class="flex justify-between">
              <span class="text-gray-600">Окончание:</span>
              <span class="font-medium">{{ formatDateTime(sessionData.end_time) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Длительность:</span>
              <span class="font-medium">{{ getDuration(sessionData.start_time, sessionData.end_time) }}</span>
            </div>
          </div>
        </div>
  
        <!-- VIP Payment Info -->
        <div v-if="sessionType === 'vip'" class="card">
          <h3 class="font-medium text-gray-900 mb-3">Оплата за время</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Длительность:</span>
              <span class="font-medium">{{ sessionData.duration_hours }}ч</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Оплачено:</span>
              <span class="font-medium text-green-600">{{ formatCurrency(sessionData.paid_amount) }}</span>
            </div>
            <div v-if="sessionData.end_time" class="pt-2 border-t">
              <VipTimer :end-time="sessionData.end_time" />
            </div>
          </div>
        </div>
  
        <!-- Orders Summary -->
        <div class="card">
          <h3 class="font-medium text-gray-900 mb-3">Итого по заказам</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Количество заказов:</span>
              <span class="font-medium">{{ orders.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Сумма заказов:</span>
              <span class="font-medium text-blue-600">{{ formatCurrency(ordersTotal) }}</span>
            </div>
            <div v-if="sessionType === 'vip'" class="flex justify-between pt-2 border-t">
              <span class="text-gray-900 font-medium">Общая сумма:</span>
              <span class="font-bold text-green-600">{{ formatCurrency((sessionData.paid_amount || 0) + ordersTotal) }}</span>
            </div>
            <div v-else class="flex justify-between pt-2 border-t">
              <span class="text-gray-900 font-medium">К оплате:</span>
              <span class="font-bold text-green-600">{{ formatCurrency(ordersTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add Order Form -->
      <OrderForm
        :session-id="sessionId"
        :session-type="sessionType"
        @order-added="handleOrderAdded"
      />
  
      <!-- Orders List -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Список заказов</h3>
          <div v-if="deletableOrders.length > 0" class="text-sm text-amber-600">
            <ClockIcon class="h-4 w-4 inline mr-1" />
            {{ deletableOrders.length }} {{ declination(deletableOrders.length, ['заказ можно', 'заказа можно', 'заказов можно']) }} удалить
          </div>
        </div>
  
        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-gray-500 mt-2">Загрузка заказов...</p>
        </div>
  
        <!-- Empty State -->
        <div v-else-if="orders.length === 0" class="text-center py-8">
          <ShoppingBagIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Заказов пока нет</p>
          <p class="text-gray-400 text-sm mt-1">Добавьте первый заказ используя форму выше</p>
        </div>
  
        <!-- Orders Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Блюдо/Напиток
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Время заказа
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="order in orders"
                :key="order.id"
                class="hover:bg-gray-50"
                :class="{ 'bg-red-50': !canDeleteOrder(order) && order.can_delete }"
              >
                <!-- Item Name -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ order.item_name }}</div>
                </td>
  
                <!-- Price -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatCurrency(order.price) }}</div>
                </td>
  
                <!-- Created At -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatTime(order.created_at) }}</div>
                  <div v-if="canDeleteOrder(order)" class="text-xs text-amber-600">
                    Удалить в течение: {{ getTimeToDelete(order) }}
                  </div>
                </td>
  
                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    v-if="canDeleteOrder(order)"
                    @click="confirmDeleteOrder(order)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
  
          <!-- Table Footer -->
          <div class="bg-gray-50 px-6 py-3">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-600">Всего заказов: {{ orders.length }}</span>
              <span class="font-medium text-gray-900">Общая сумма: {{ formatCurrency(ordersTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Удалить заказ?</h3>
          
          <div v-if="orderToDelete" class="mb-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800">
                <strong>{{ orderToDelete.item_name }}</strong><br>
                Цена: {{ formatCurrency(orderToDelete.price) }}<br>
                Время: {{ formatTime(orderToDelete.created_at) }}
              </p>
            </div>
            
            <p class="text-gray-600 text-sm mt-3">
              Это действие нельзя отменить. Заказ будет удален из системы.
            </p>
          </div>
  
          <div class="flex space-x-3">
            <button
              @click="cancelDelete"
              class="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              @click="deleteOrder"
              class="btn-danger flex-1"
              :disabled="isDeletingOrder"
            >
              <span v-if="isDeletingOrder">Удаление...</span>
              <span v-else>Удалить</span>
            </button>
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'
import { useTablesStore } from '@/stores/tables'
import { useVipSessionsStore } from '@/stores/vipSessions'
import { formatCurrency, formatPhone, formatTime, formatDateTime, getDuration } from '@/utils/formatters'
import { MESSAGES } from '@/utils/constants'
import OrderForm from '@/components/OrderForm.vue'
import VipTimer from '@/components/VipTimer.vue'
import {
  ArrowLeftIcon,
  ClockIcon,
  ShoppingBagIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  sessionId: {
    type: [String, Number],
    required: true
  },
  sessionType: {
    type: String,
    required: true,
    validator: (value) => ['table', 'vip'].includes(value)
  }
})

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const tablesStore = useTablesStore()
const vipSessionsStore = useVipSessionsStore()

const sessionData = ref(null)
const showDeleteModal = ref(false)
const orderToDelete = ref(null)
const isDeletingOrder = ref(false)
const message = ref(null)

const orders = computed(() => ordersStore.sessionOrders)
const ordersTotal = computed(() => ordersStore.sessionOrdersTotal)
const isLoading = computed(() => ordersStore.isLoading)
const deletableOrders = computed(() => ordersStore.deletableOrders)

const canDeleteOrder = (order) => ordersStore.canDeleteOrder(order)
const getTimeToDelete = (order) => ordersStore.getTimeToDelete(order)

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

const declination = (count, words) => {
  const cases = [2, 0, 1, 1, 1, 2]
  const index = (count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]
  return words[index]
}

const goBack = () => {
  const backPath = props.sessionType === 'vip' ? '/admin/vip' : '/admin/tables'
  router.push(backPath)
}

const handleOrderAdded = async (order) => {
  showMessage(MESSAGES.ORDER_CREATED, 'success')
  
  // Обновляем сумму в сессии
  if (props.sessionType === 'vip') {
    vipSessionsStore.updateSessionAmount(props.sessionId, ordersTotal.value)
  } else {
    // ИСПРАВЛЕНИЕ: Обновляем с количеством заказов
    tablesStore.updateSessionAmount(props.sessionId, ordersTotal.value, orders.value.length)
    
    // Принудительно обновляем сессию из API
    await tablesStore.refreshSession(props.sessionId)
  }
}

const confirmDeleteOrder = (order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  orderToDelete.value = null
}

const deleteOrder = async () => {
  if (!orderToDelete.value) return
  
  isDeletingOrder.value = true
  const result = await ordersStore.deleteOrder(orderToDelete.value.id)
  
  if (result.success) {
    showMessage(MESSAGES.ORDER_DELETED, 'success')
    
    // Обновляем сумму в сессии
    if (props.sessionType === 'vip') {
      vipSessionsStore.updateSessionAmount(props.sessionId, ordersTotal.value)
    } else {
      // ИСПРАВЛЕНИЕ: Обновляем с количеством заказов
      tablesStore.updateSessionAmount(props.sessionId, ordersTotal.value, orders.value.length)
      
      // Принудительно обновляем сессию из API
      await tablesStore.refreshSession(props.sessionId)
    }
  } else {
    showMessage(result.error, 'error')
  }
  
  isDeletingOrder.value = false
  showDeleteModal.value = false
  orderToDelete.value = null
}

const fetchSessionData = async () => {
  try {
    if (props.sessionType === 'vip') {
      sessionData.value = await vipSessionsStore.getSession(props.sessionId)
    } else {
      sessionData.value = await tablesStore.getSession(props.sessionId)
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных сессии:', error)
    showMessage('Ошибка при загрузке данных сессии', 'error')
  }
}

onMounted(async () => {
  await Promise.all([
    ordersStore.fetchSessionOrders(props.sessionId, props.sessionType),
    fetchSessionData()
  ])
})

onUnmounted(() => {
  // Очищаем заказы при уходе со страницы
  ordersStore.clearSessionOrders()
})
</script>