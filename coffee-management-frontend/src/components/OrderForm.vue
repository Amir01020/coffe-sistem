<template>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Добавить заказ</h3>
      
      <form @submit.prevent="handleSubmit">
        <!-- Item Name -->
        <div class="mb-4">
          <label class="label">Название блюда/напитка *</label>
          <input
            v-model="form.item_name"
            type="text"
            class="input-field"
            :class="{ 'border-red-300': errors.item_name }"
            placeholder="Введите название"
            required
          />
          <p v-if="errors.item_name" class="text-red-600 text-sm mt-1">{{ errors.item_name }}</p>
        </div>
  
        <!-- Price -->
        <div class="mb-4">
          <label class="label">Цена (сум) *</label>
          <input
            v-model.number="form.price"
            type="number"
            class="input-field"
            :class="{ 'border-red-300': errors.price }"
            placeholder="Введите цену"
            min="1000"
            step="1000"
            required
          />
          <p v-if="errors.price" class="text-red-600 text-sm mt-1">{{ errors.price }}</p>
          <p class="text-gray-500 text-xs mt-1">Минимум 1 000 сум</p>
        </div>
  
        <!-- Error Message -->
        <div v-if="submitError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {{ submitError }}
        </div>
  
        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {{ successMessage }}
        </div>
  
        <!-- Submit Button -->
        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading">Добавление...</span>
          <span v-else>Добавить заказ</span>
        </button>
      </form>
  
      <!-- Quick Actions -->
      <div v-if="quickItems.length > 0" class="mt-6">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Быстрое добавление:</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="item in quickItems"
            :key="item.name"
            @click="selectQuickItem(item)"
            class="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            :disabled="isLoading"
          >
            <div class="font-medium text-gray-900">{{ item.name }}</div>
            <div class="text-sm text-gray-600">{{ formatCurrency(item.price) }}</div>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  import { useOrdersStore } from '@/stores/orders'
  import { formatCurrency } from '@/utils/formatters'
  import { VALIDATION_RULES } from '@/utils/constants'
  
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
  
  const emit = defineEmits(['orderAdded'])
  
  const ordersStore = useOrdersStore()
  
  const form = ref({
    item_name: '',
    price: null
  })
  
  const errors = ref({})
  const submitError = ref('')
  const successMessage = ref('')
  const isLoading = ref(false)
  
  // Быстрые предустановленные блюда
  const quickItems = ref([
    { name: 'Чай', price: 5000 },
    { name: 'Кофе', price: 8000 },
    { name: 'Сок', price: 7000 },
    { name: 'Вода', price: 3000 },
    { name: 'Плов', price: 25000 },
    { name: 'Шашлык', price: 35000 },
    { name: 'Лагман', price: 20000 },
    { name: 'Манты', price: 18000 }
  ])
  
  const isFormValid = computed(() => {
    return form.value.item_name.trim() && 
           form.value.price && 
           form.value.price >= VALIDATION_RULES.MIN_ORDER_AMOUNT &&
           !errors.value.item_name && 
           !errors.value.price
  })
  
  // Валидация
  const validateItemName = () => {
    if (!form.value.item_name.trim()) {
      errors.value.item_name = 'Название обязательно'
    } else if (form.value.item_name.trim().length < 2) {
      errors.value.item_name = 'Название должно содержать минимум 2 символа'
    } else {
      delete errors.value.item_name
    }
  }
  
  const validatePrice = () => {
    if (!form.value.price) {
      errors.value.price = 'Цена обязательна'
    } else if (form.value.price < VALIDATION_RULES.MIN_ORDER_AMOUNT) {
      errors.value.price = `Минимальная цена ${VALIDATION_RULES.MIN_ORDER_AMOUNT} сум`
    } else if (form.value.price > VALIDATION_RULES.MAX_ORDER_AMOUNT) {
      errors.value.price = `Максимальная цена ${VALIDATION_RULES.MAX_ORDER_AMOUNT} сум`
    } else {
      delete errors.value.price
    }
  }
  
  // Watchers для валидации
  watch(() => form.value.item_name, validateItemName)
  watch(() => form.value.price, validatePrice)
  
  const selectQuickItem = (item) => {
    form.value.item_name = item.name
    form.value.price = item.price
  }
  
  const handleSubmit = async () => {
    // Валидируем все поля
    validateItemName()
    validatePrice()
    
    if (!isFormValid.value) return
    
    isLoading.value = true
    submitError.value = ''
    successMessage.value = ''
    
    try {
      const orderData = {
        item_name: form.value.item_name.trim(),
        price: form.value.price
      }
      
      // Добавляем ID сессии в зависимости от типа
      if (props.sessionType === 'vip') {
        orderData.vip_session_id = props.sessionId
      } else {
        orderData.session_id = props.sessionId
      }
      
      const result = await ordersStore.createOrder(orderData)
      
      if (result.success) {
        successMessage.value = 'Заказ успешно добавлен'
        
        // Очищаем форму
        form.value = {
          item_name: '',
          price: null
        }
        
        // Эмитим событие для обновления списка заказов
        emit('orderAdded', result.order)
        
        // Убираем сообщение об успехе через 3 секунды
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      } else {
        submitError.value = result.error
      }
    } catch (error) {
      submitError.value = 'Произошла ошибка при добавлении заказа'
    } finally {
      isLoading.value = false
    }
  }
  </script>