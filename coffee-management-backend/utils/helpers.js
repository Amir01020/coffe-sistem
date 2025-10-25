// Функция для стандартного ответа API
const sendResponse = (res, success, data = null, message = '', statusCode = 200) => {
    const response = {
      success,
      ...(data && { data }),
      ...(message && { message })
    };
    
    return res.status(statusCode).json(response);
  };
  
  // Функция для ответа с ошибкой
  const sendError = (res, error, statusCode = 500, code = null) => {
    const response = {
      success: false,
      error,
      ...(code && { code })
    };
    
    return res.status(statusCode).json(response);
  };
  
  // Функция для проверки истечения времени VIP сессий
  const checkVipSessionExpiry = (startTime, durationHours) => {
    const start = new Date(startTime);
    const now = new Date();
    const endTime = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));
    
    return {
      isExpired: now > endTime,
      timeLeft: Math.max(0, endTime - now),
      endTime
    };
  };
  
  // Функция для форматирования времени в минуты
  const msToMinutes = (milliseconds) => {
    return Math.floor(milliseconds / (1000 * 60));
  };
  
  // Функция для форматирования времени в часы и минуты
  const msToHoursAndMinutes = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };
  
  // Функция для проверки возможности удаления заказа (в течение 5 минут)
  const canDeleteOrder = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const timeDiff = now - created;
    const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
    
    return timeDiff <= fiveMinutes;
  };
  
  // Функция для генерации случайного токена
  const generateRandomToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Функция для форматирования номера телефона
  const formatPhoneNumber = (phone) => {
    // Удаляем все символы кроме цифр и +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Если номер начинается с 998, добавляем +
    if (cleaned.startsWith('998') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // Если номер уже в правильном формате
    if (cleaned.startsWith('+998') && cleaned.length === 13) {
      return cleaned;
    }
    
    return phone; // Возвращаем как есть, если не удалось форматировать
  };
  
  // Функция для логирования операций
  const logOperation = (operation, userId, details = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${operation} - User ID: ${userId}`, details);
  };
  
  // Функция для расчета общей суммы заказов
  const calculateTotalAmount = (orders) => {
    return orders.reduce((total, order) => total + parseFloat(order.price), 0);
  };
  
  // Функция для проверки валидности даты
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };
  
  // Функция для форматирования даты в нужный формат
  const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      default:
        return d.toISOString();
    }
  };
  
  module.exports = {
    sendResponse,
    sendError,
    checkVipSessionExpiry,
    msToMinutes,
    msToHoursAndMinutes,
    canDeleteOrder,
    generateRandomToken,
    formatPhoneNumber,
    logOperation,
    calculateTotalAmount,
    isValidDate,
    formatDate
  };