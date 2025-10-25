<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        <div class="card">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Система управления кафе</h1>
            <p class="text-gray-600">Войдите в свою учетную запись</p>
          </div>
          
          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="label">Логин</label>
              <input
                v-model="form.login"
                type="text"
                class="input-field"
                placeholder="Введите ваш логин"
                required
              />
            </div>
            
            <div class="mb-6">
              <label class="label">Пароль</label>
              <input
                v-model="form.password"
                type="password"
                class="input-field"
                placeholder="Введите пароль"
                required
              />
            </div>
            
            <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {{ error }}
            </div>
            
            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="authStore.isLoading"
            >
              <span v-if="authStore.isLoading">Вход...</span>
              <span v-else>Войти</span>
            </button>
          </form>
          
          <div class="mt-8 text-center text-sm text-gray-500">
            <p>Тестовые данные:</p>
            <p><strong>Директор:</strong> director / director123</p>
            <p><strong>Админ:</strong> admin1 / admin123</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const form = ref({
    login: '',
    password: ''
  })
  
  const error = ref('')
  
  const handleLogin = async () => {
    error.value = ''
    
    const result = await authStore.login(form.value)
    
    if (result.success) {
      const redirectPath = result.user.role === 'admin' ? '/admin' : '/director'
      router.push(redirectPath)
    } else {
      error.value = result.error
    }
  }
  </script>