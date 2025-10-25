const { body, validationResult } = require('express-validator');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации данных',
      details: errors.array()
    });
  }
  next();
};

// Валидация для входа
const validateLogin = [
  body('login')
    .notEmpty()
    .withMessage('Логин обязателен')
    .isLength({ min: 3 })
    .withMessage('Логин должен содержать минимум 3 символа'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  handleValidationErrors
];

// Валидация для создания пользователя
const validateCreateUser = [
  body('login')
    .notEmpty()
    .withMessage('Логин обязателен')
    .isLength({ min: 3, max: 50 })
    .withMessage('Логин должен содержать от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Логин может содержать только буквы, цифры и подчеркивания'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('name')
    .notEmpty()
    .withMessage('Имя обязательно')
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов'),
  body('phone')
    .notEmpty()
    .withMessage('Телефон обязателен')
    .matches(/^\+998\d{9}$/)
    .withMessage('Телефон должен быть в формате +998XXXXXXXXX'),
  handleValidationErrors
];

// Валидация для создания клиента
const validateCreateClient = [
  body('name')
    .notEmpty()
    .withMessage('Имя клиента обязательно')
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов'),
  body('phone')
    .notEmpty()
    .withMessage('Телефон обязателен')
    .matches(/^\+998\d{9}$/)
    .withMessage('Телефон должен быть в формате +998XXXXXXXXX'),
  handleValidationErrors
];

// Валидация для создания столика
const validateCreateTable = [
  body('table_number')
    .notEmpty()
    .withMessage('Номер столика обязателен')
    .isInt({ min: 1 })
    .withMessage('Номер столика должен быть положительным числом'),
  handleValidationErrors
];

// Валидация для создания заказа
const validateCreateOrder = [
  body('item_name')
    .notEmpty()
    .withMessage('Название товара обязательно')
    .isLength({ min: 1, max: 200 })
    .withMessage('Название должно содержать от 1 до 200 символов'),
  body('price')
    .notEmpty()
    .withMessage('Цена обязательна')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  handleValidationErrors
];

// Валидация для создания VIP сессии
const validateCreateVipSession = [
  body('client_id')
    .notEmpty()
    .withMessage('ID клиента обязателен')
    .isInt({ min: 1 })
    .withMessage('ID клиента должен быть положительным числом'),
  body('duration_hours')
    .notEmpty()
    .withMessage('Длительность обязательна')
    .isInt({ min: 1, max: 24 })
    .withMessage('Длительность должна быть от 1 до 24 часов'),
  body('paid_amount')
    .notEmpty()
    .withMessage('Сумма оплаты обязательна')
    .isFloat({ min: 0 })
    .withMessage('Сумма должна быть положительным числом'),
  handleValidationErrors
];

// Валидация для создания сессии столика
const validateCreateTableSession = [
  body('table_id')
    .notEmpty()
    .withMessage('ID столика обязателен')
    .isInt({ min: 1 })
    .withMessage('ID столика должен быть положительным числом'),
  body('client_id')
    .notEmpty()
    .withMessage('ID клиента обязателен')
    .isInt({ min: 1 })
    .withMessage('ID клиента должен быть положительным числом'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateCreateUser,
  validateCreateClient,
  validateCreateTable,
  validateCreateOrder,
  validateCreateVipSession,
  validateCreateTableSession,
  handleValidationErrors
};