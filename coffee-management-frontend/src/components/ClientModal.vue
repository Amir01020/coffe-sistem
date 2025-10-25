<template>
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="handleBackdropClick"
    >
      <div
        class="bg-white rounded-lg p-6 max-w-md w-full"
        @click.stop
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          {{ isEdit ? 'Редактировать клиента' : 'Добавить клиента' }}
        </h3>
        
        <form @submit.prevent="handleSubmit">
          <!-- Name -->
          <div class="mb-4">
            <label class="label">Имя *</label>
            <input
              v-model="form.name"
              type="text"
              class="input-field"
              :class="{ 'border-red-300': errors.name }"
              placeholder="Введите имя клиента"
              required
            />
            <p v-if="errors.name" class="text-red-600 text-sm mt-1">{{ errors.name }}</p>
          </div>
  
          <!-- Phone -->
          <div class="mb-6">
            <label class="label">Телефон *</label>
            <input
              v-model="form.phone"
              type="tel"
              class="input-field"
              :class="{ 'border-red-300': errors.phone }"
              placeholder="+998901234567"
              required
            />
            <p v-if="errors.phone" class="text-red-600 text-sm mt-1">{{ errors.phone }}</p>
            <p class="text-gray-500 text-xs mt-1">Формат: +998XXXXXXXXX</p>
          </div>
  
          <!-- Error Message -->
          <div v-if="submitError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {{ submitError }}
          </div>
  
          <!-- Buttons -->
          <div class="flex space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="btn-secondary flex-1"
              :disabled="isLoading"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isLoading || !isFormValid"
            >
              <span v-if="isLoading">Сохранение...</span>
              <span v-else>{{ isEdit ? 'Сохранить' : 'Добавить' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  import { useClientsStore } from '@/stores/clients'
  import { VALIDATION_RULES } from '@/utils/constants'
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    },
    client: {
      type: Object,
      default: null
    }
  })
  
  const emit = defineEmits(['close', 'success'])
  
  const clientsStore = useClientsStore()
  
  const form = ref({
    name: '',
    phone: ''
  })
  
  const errors = ref({})
  const submitError = ref('')
  const isLoading = ref(false)
  
  const isEdit = computed(() => !!props.client)
  
  const isFormValid = computed(() => {
    return form.value.name.trim() && 
           form.value.phone.trim() && 
           !errors.value.name && 
           !errors.value.phone
  })
  
  // Валидация
  const validateName = () => {
    if (!form.value.name.trim()) {
      errors.value.name = 'Имя обязательно'
    } else if (form.value.name.trim().length < 2) {
      errors.value.name = 'Имя должно содержать минимум 2 символа'
    } else {
      delete errors.value.name
    }
  }
  
  const validatePhone = () => {
    const phone = form.value.phone.trim()
    if (!phone) {
      errors.value.phone = 'Телефон обязателен'
    } else if (!VALIDATION_RULES.PHONE_PATTERN.test(phone)) {
      errors.value.phone = 'Неверный формат телефона'
    } else {
      delete errors.value.phone
    }
  }
  
  // Watchers для валидации
  watch(() => form.value.name, validateName)
  watch(() => form.value.phone, validatePhone)
  
  // Заполняем форму при редактировании
  watch(() => props.client, (client) => {
    if (client) {
      form.value = {
        name: client.name || '',
        phone: client.phone || ''
      }
    }
  }, { immediate: true })
  
  // Очищаем форму при открытии для создания
  watch(() => props.isOpen, (isOpen) => {
    if (isOpen && !props.client) {
      form.value = {
        name: '',
        phone: ''
      }
      errors.value = {}
      submitError.value = ''
    }
  })
  
  const handleSubmit = async () => {
    // Валидируем все поля
    validateName()
    validatePhone()
    
    if (!isFormValid.value) return
    
    isLoading.value = true
    submitError.value = ''
    
    try {
      const result = await clientsStore.createClient(form.value)
      
      if (result.success) {
        emit('success', result.client)
        closeModal()
      } else {
        submitError.value = result.error
      }
    } catch (error) {
      submitError.value = 'Произошла ошибка при сохранении'
    } finally {
      isLoading.value = false
    }
  }
  
  const closeModal = () => {
    form.value = { name: '', phone: '' }
    errors.value = {}
    submitError.value = ''
    emit('close')
  }
  
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }
  </script>