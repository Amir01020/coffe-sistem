<template>
    <div class="flex items-center space-x-2">
      <!-- Timer Icon -->
      <div
        class="w-3 h-3 rounded-full"
        :class="{
          'bg-red-500 animate-pulse': isExpired,
          'bg-amber-500 animate-pulse': isExpiring && !isExpired,
          'bg-green-500': !isExpiring && !isExpired
        }"
      ></div>
      
      <!-- Time Display -->
      <span
        class="font-mono text-sm font-medium"
        :class="{
          'text-red-600': isExpired,
          'text-amber-600': isExpiring && !isExpired,
          'text-green-600': !isExpiring && !isExpired
        }"
      >
        {{ displayTime }}
      </span>
      
      <!-- Status Label -->
      <span
        v-if="isExpired"
        class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full"
      >
        Истекло
      </span>
      <span
        v-else-if="isExpiring"
        class="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full"
      >
        Скоро истечет
      </span>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { getRemainingTime } from '@/utils/formatters'
  
  const props = defineProps({
    endTime: {
      type: String,
      required: true
    },
    warningMinutes: {
      type: Number,
      default: 30
    }
  })
  
  const currentTime = ref(new Date())
  let intervalId = null
  
  const timeRemaining = computed(() => {
    const end = new Date(props.endTime)
    const now = currentTime.value
    return end - now
  })
  
  const isExpired = computed(() => {
    return timeRemaining.value <= 0
  })
  
  const isExpiring = computed(() => {
    const warningMs = props.warningMinutes * 60 * 1000
    return timeRemaining.value > 0 && timeRemaining.value <= warningMs
  })
  
  const displayTime = computed(() => {
    if (isExpired.value) {
      return 'Время истекло'
    }
    
    return getRemainingTime(props.endTime)
  })
  
  const updateCurrentTime = () => {
    currentTime.value = new Date()
  }
  
  onMounted(() => {
    // Обновляем время каждую секунду
    intervalId = setInterval(updateCurrentTime, 1000)
  })
  
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
  </script>