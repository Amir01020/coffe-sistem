// Форматирование валюты в сумах
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 сум'
  
  // Преобразуем в число, если передана строка
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Проверяем, что после преобразования получилось число
  if (isNaN(numAmount)) return '0 сум'
  
  return new Intl.NumberFormat('ru-RU').format(numAmount) + ' сум'
}

// Форматирование времени
export const formatTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование даты и времени
export const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование даты
export const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Получить продолжительность между двумя датами
export const getDuration = (startTime, endTime = null) => {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const diffMs = end - start
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}ч ${minutes}м`
}

// Получить оставшееся время до окончания
export const getRemainingTime = (endTime) => {
  const end = new Date(endTime)
  const now = new Date()
  const diffMs = end - now
  
  if (diffMs <= 0) return 'Время истекло'
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`
  } else {
    return `${minutes}м`
  }
}

// Форматирование номера телефона
export const formatPhone = (phone) => {
  if (!phone) return ''
  
  // Если номер начинается с +998, форматируем как узбекский
  if (phone.startsWith('+998')) {
    const digits = phone.slice(4)
    if (digits.length === 9) {
      return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`
    }
  }
  
  return phone
}

// Преобразовать дату в формат для input[type="date"]
export const toDateInputValue = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Преобразовать дату в формат для input[type="datetime-local"]
export const toDateTimeInputValue = (date) => {
  if (!date) return ''
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}