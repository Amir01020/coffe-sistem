<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Просто показываем контент -->
    <RouterView />
    
    <!-- Global Notifications -->
    <div v-if="notifications.length > 0" class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-lg max-w-sm"
      >
        <div class="flex items-center">
          <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
          <span class="text-sm font-medium">{{ notification.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, watch } from 'vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

let intervalId = null

// Простая инициализация при загрузке
onMounted(() => {
  // Инициализируем пользователя из localStorage если есть валидный токен
  authStore.initializeFromStorage()
  console.log('App initialized, user:', authStore.user)
})

// Настройка уведомлений для админа
watch(() => authStore.user?.role, (role) => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  
  if (role === 'admin') {
    // Запускаем проверку VIP сессий каждые 30 секунд
    intervalId = setInterval(() => {
      notificationStore.checkExpiringVipSessions()
    }, 30000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>