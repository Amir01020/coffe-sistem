// Роли пользователей
export const USER_ROLES = {
  DIRECTOR: 'director',
  ADMIN: 'admin'
}

// Статусы столиков
export const TABLE_STATUS = {
  FREE: 'free',
  OCCUPIED: 'occupied'
}

// Типы сессий
export const SESSION_TYPES = {
  TABLE: 'table',
  VIP: 'vip'
}

// Интервалы обновления данных (в миллисекундах)
export const REFRESH_INTERVALS = {
  DASHBOARD: 30000,      // 30 секунд
  VIP_NOTIFICATIONS: 30000, // 30 секунд
  TABLES: 15000,         // 15 секунд
  VIP_TIMERS: 10000      // 10 секунд
}

// Время для удаления заказов (в минутах)
export const ORDER_DELETE_TIME_LIMIT = 5

// VIP уведомления (время до истечения в минутах)
export const VIP_WARNING_TIME = 30

// Цены по умолчанию для VIP (в сумах)
export const VIP_DEFAULT_PRICES = {
  1: 20000,  // 1 час
  2: 35000,  // 2 часа
  3: 50000,  // 3 часа
  4: 65000,  // 4 часа
  5: 80000   // 5 часов
}

// Валидация
export const VALIDATION_RULES = {
  PHONE_PATTERN: /^\+998\d{9}$/,
  MIN_PASSWORD_LENGTH: 6,
  MIN_ORDER_AMOUNT: 1000,
  MAX_ORDER_AMOUNT: 1000000
}

// Форматы дат
export const DATE_FORMATS = {
  API_DATE: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_DATETIME: 'DD.MM.YYYY HH:mm'
}

// Сообщения
export const MESSAGES = {
  SHIFT_NOT_STARTED: 'Для работы необходимо начать смену',
  SHIFT_STARTED: 'Смена успешно начата',
  SHIFT_ENDED: 'Смена успешно завершена',
  TABLE_OCCUPIED: 'Столик успешно занят',
  TABLE_RELEASED: 'Столик освобожден',
  VIP_SESSION_CREATED: 'VIP сессия создана',
  VIP_SESSION_EXTENDED: 'VIP сессия продлена',
  VIP_SESSION_CLOSED: 'VIP сессия завершена',
  ORDER_CREATED: 'Заказ добавлен',
  ORDER_DELETED: 'Заказ удален',
  CLIENT_CREATED: 'Клиент добавлен',
  ADMIN_CREATED: 'Администратор создан',
  ADMIN_DELETED: 'Администратор удален'
}