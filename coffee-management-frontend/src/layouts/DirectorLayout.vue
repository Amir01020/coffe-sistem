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
            <h1 class="text-xl font-bold text-gray-900">Панель директора</h1>
            <p class="text-sm text-gray-600 mt-1">{{ authStore.user?.name }}</p>
          </div>
  
          <!-- Navigation -->
          <nav class="flex-1 p-4 space-y-2">
            <RouterLink
              to="/director"
              exact-active-class="bg-purple-50 text-purple-700 border-purple-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <HomeIcon class="h-5 w-5 mr-3" />
              Главная
            </RouterLink>
            
            <RouterLink
              to="/director/admins"
              active-class="bg-purple-50 text-purple-700 border-purple-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <UsersIcon class="h-5 w-5 mr-3" />
              Администраторы
            </RouterLink>
            
            <RouterLink
              to="/director/reports"
              active-class="bg-purple-50 text-purple-700 border-purple-200"
              class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 border border-transparent"
            >
              <ChartBarIcon class="h-5 w-5 mr-3" />
              Отчеты
            </RouterLink>
          </nav>
  
          <!-- Current Date -->
          <div class="p-4 border-t border-gray-200">
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div class="flex items-center">
                <CalendarIcon class="h-4 w-4 text-purple-600 mr-2" />
                <span class="text-sm font-medium text-purple-800">{{ currentDate }}</span>
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
  import { ref, computed } from 'vue'
  import { RouterView, RouterLink, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UsersIcon,
    ChartBarIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon
  } from '@heroicons/vue/24/outline'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const mobileMenuOpen = ref(false)
  
  const currentDate = computed(() => {
    return new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })
  
  const handleLogout = () => {
    authStore.logout()
    router.push('/login')
  }
  </script>