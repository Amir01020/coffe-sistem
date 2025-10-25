// ===== routes/users.js =====
const express = require('express');
const router = express.Router();

const { getUsers, createUser, deleteUser, getUser } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { validateCreateUser } = require('../utils/validation');

// Все маршруты доступны только директору
router.use(authMiddleware, roleMiddleware(['director']));

// @route   GET /api/users
// @desc    Получить всех админов
// @access  Director only
router.get('/', getUsers);

// @route   GET /api/users/:id
// @desc    Получить админа по ID
// @access  Director only
router.get('/:id', getUser);

// @route   POST /api/users
// @desc    Создать нового админа
// @access  Director only
router.post('/', validateCreateUser, createUser);

// @route   DELETE /api/users/:id
// @desc    Удалить админа
// @access  Director only
router.delete('/:id', deleteUser);

module.exports = router;