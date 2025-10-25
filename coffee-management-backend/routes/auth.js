const express = require('express');
const router = express.Router();

// Импорт контроллеров и middleware
const { login, logout, getMe, verifyToken } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validateLogin } = require('../utils/validation');

// @route   POST /api/auth/login
// @desc    Вход в систему
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/logout  
// @desc    Выход из системы
// @access  Private
router.post('/logout', authMiddleware, logout);

// @route   GET /api/auth/me
// @desc    Получить данные текущего пользователя
// @access  Private
router.get('/me', authMiddleware, getMe);

// @route   GET /api/auth/verify
// @desc    Проверить действительность токена
// @access  Private
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;