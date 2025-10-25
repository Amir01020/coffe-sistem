<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Mobile menu button -->
      <div class="lg:hidden fixed top-4 left-4 z-50">
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          <Bars3Icon v-if="!mobileMenuOpen" class="h-6 w-6" />
          <XMarkIcon v-else class="h-6 w-6" />
        </button>
      </div>
  
      <!-- Sidebar -->
      <div
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0"
        :class="{ 'translate-x-0': mobileMenuOpen, '-translate-x-full': !mobileMenuOpen }"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200">
            <h1 class="text-xl font-bold text-gray-900">Панель админа</h1>
            <p class="text-sm text-gray-600 mt-1">{{ authStore.user?.name }}</p>
          </div>
  
          <!-- Navigation -->
          <nav class="flex-1 p-4 space-y-2">
            <RouterLink
              to="/admin"
              exact-active-class="bg-blue-50 text-blue-700 border-blue-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <HomeIcon class="h-5 w-5 mr-3" />
              Главная
            </RouterLink>
            
            <RouterLink
              to="/admin/shift"
              active-class="bg-blue-50 text-blue-700 border-blue-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <ClockIcon class="h-5 w-5 mr-3" />
              Смена
            </RouterLink>
            
            <RouterLink
              to="/admin/tables"
              active-class="bg-blue-50 text-blue-700 border-blue-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <TableCellsIcon class="h-5 w-5 mr-3" />
              Столики
            </RouterLink>
            
            <RouterLink
              to="/admin/vip"
              active-class="bg-blue-50 text-blue-700 border-blue-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <StarIcon class="h-5 w-5 mr-3" />
              VIP зал
            </RouterLink>
            
            <RouterLink
              to="/admin/clients"
              active-class="bg-blue-50 text-blue-700 border-blue-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <UsersIcon class="h-5 w-5 mr-3" />
              Клиенты
            </RouterLink>
          </nav>
  
          <!-- Shift Status -->
          <div class="p-4 border-t border-gray-200">
            <div v-if="currentShift" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span class="text-sm font-medium text-green-800">Смена активна</span>
              </div>
              <p class="text-xs text-green-600 mt-1">
                с {{ formatTime(currentShift.start_time) }}
              </p>
            </div>
            <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div class="flex items-center">
                <div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span class="text-sm font-medium text-gray-600">Смена не начата</span>
              </div>
            </div>
          </div>
  
          <!-- User menu -->
          <div class="p-4 border-t border-gray-200">
            <button
              @click="handleLogout"
              class="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5 mr-3" />
              Выйти
            </button>
          </div>
        </div>
      </div>
  
      <!-- Main content -->
      <div class="lg:ml-64">
        <main class="p-4 lg:p-8">
          <RouterView />
        </main>
      </div>
  
      <!-- Mobile overlay -->
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="mobileMenuOpen = false"
      ></div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { RouterView, RouterLink, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useShiftStore } from '@/stores/shift'
  import { storeToRefs } from 'pinia'
  import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    ClockIcon,
    TableCellsIcon,
    StarIcon,
    UsersIcon,
    ArrowRightOnRectangleIcon
  } from '@heroicons/vue/24/outline'
  
  const router = useRouter()
  const authStore = useAuthStore()
  const shiftStore = useShiftStore()
  const { currentShift } = storeToRefs(shiftStore)
  
  const mobileMenuOpen = ref(false)
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const handleLogout = () => {
    authStore.logout()
    router.push('/login')
  }
  
  onMounted(() => {
    shiftStore.fetchCurrentShift()
  })
  </script>