import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
  
  // Если критическая ошибка - показываем fallback UI
  if (err.message?.includes('ChunkLoadError') || err.message?.includes('Loading chunk')) {
    // Ошибка загрузки чанков - перезагружаем страницу
    window.location.reload()
  }
}

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

app.use(createPinia())
app.use(router)

app.mount('#app')