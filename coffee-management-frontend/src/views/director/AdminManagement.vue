<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Администраторы</h1>
        <p class="text-gray-600 mt-1">Управление персоналом заведения</p>
      </div>
      <button
        @click="showAddModal = true"
        class="btn-primary mt-4 sm:mt-0"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        Добавить администратора
      </button>
    </div>

    <!-- Admins List -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900">
          Список администраторов ({{ admins.length }})
        </h2>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-500 mt-2">Загрузка...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="admins.length === 0" class="text-center py-8">
        <UsersIcon class="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p class="text-gray-500">Нет администраторов</p>
      </div>

      <!-- Admins Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Администратор
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Логин
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контакт
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="admin in admins"
              :key="admin.id"
              class="hover:bg-gray-50"
            >
              <!-- Admin Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ admin.name }}</div>
              </td>

              <!-- Login -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ admin.login }}</div>
              </td>

              <!-- Contact -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatPhone(admin.phone) }}</div>
              </td>

              <!-- Registration Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(admin.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="confirmDelete(admin)"
                  class="text-red-600 hover:text-red-900"
                >
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Admin Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Добавить администратора</h3>
          <button
            @click="showAddModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <form @submit.prevent="handleAddAdmin" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Имя</label>
            <input
              v-model="newAdmin.name"
              type="text"
              id="name"
              class="input-field mt-1"
              required
            />
          </div>

          <div>
            <label for="login" class="block text-sm font-medium text-gray-700">Логин</label>
            <input
              v-model="newAdmin.login"
              type="text"
              id="login"
              class="input-field mt-1"
              required
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              v-model="newAdmin.password"
              type="password"
              id="password"
              class="input-field mt-1"
              required
            />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Телефон</label>
            <input
              v-model="newAdmin.phone"
              type="tel"
              id="phone"
              class="input-field mt-1"
              placeholder="+998XXXXXXXXX"
              required
            />
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn-secondary"
              @click="showAddModal = false"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Добавление...</span>
              <span v-else>Добавить</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Подтверждение удаления</h3>
          <button
            @click="showDeleteModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <p class="text-gray-600 mb-6">
          Вы уверены, что хотите удалить администратора <strong>{{ adminToDelete?.name }}</strong>? 
          Это действие нельзя отменить.
        </p>

        <div class="flex justify-end space-x-3">
          <button
            class="btn-secondary"
            @click="showDeleteModal = false"
          >
            Отмена
          </button>
          <button
            class="btn-danger"
            @click="handleDeleteAdmin"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Удаление...</span>
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
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { formatPhone, formatDate } from '@/utils/formatters'
import {
  PlusIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// State
const admins = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const adminToDelete = ref(null)
const message = ref(null)

// New admin form
const newAdmin = ref({
  name: '',
  login: '',
  password: '',
  phone: ''
})

// Fetch admins (users with role 'admin')
const fetchAdmins = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/users')
    admins.value = response.data.data
  } catch (error) {
    showMessage('Ошибка при загрузке администраторов', 'error')
    console.error('Error fetching admins:', error)
  } finally {
    isLoading.value = false
  }
}

// Add new admin
const handleAddAdmin = async () => {
  isSubmitting.value = true
  try {
    await api.post('/users', {
      ...newAdmin.value,
      role: 'admin'
    })
    
    await fetchAdmins()
    showAddModal.value = false
    showMessage('Администратор успешно добавлен', 'success')
    
    // Reset form
    newAdmin.value = {
      name: '',
      login: '',
      password: '',
      phone: ''
    }
  } catch (error) {
    showMessage(error.response?.data?.error || 'Ошибка при добавлении администратора', 'error')
    console.error('Error adding admin:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Confirm delete
const confirmDelete = (admin) => {
  adminToDelete.value = admin
  showDeleteModal.value = true
}

// Delete admin
const handleDeleteAdmin = async () => {
  if (!adminToDelete.value) return
  
  isSubmitting.value = true
  try {
    await api.delete(`/users/${adminToDelete.value.id}`)
    
    await fetchAdmins()
    showDeleteModal.value = false
    showMessage('Администратор успешно удален', 'success')
    adminToDelete.value = null
  } catch (error) {
    showMessage(error.response?.data?.error || 'Ошибка при удалении администратора', 'error')
    console.error('Error deleting admin:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Show message
const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

// Initialize
onMounted(() => {
  fetchAdmins()
})
</script>