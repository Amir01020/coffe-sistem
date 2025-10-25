// ===== routes/tableSessions.js =====
const express = require('express');
const router = express.Router();

const { createTableSession, getTableSession, closeTableSession, getActiveSessions } = require('../controllers/tableSessionController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');
const { validateCreateTableSession } = require('../utils/validation');

// @route   GET /api/table-sessions/active
// @desc    Получить активные сессии столиков
// @access  Private (Admin with active shift)
router.get('/active', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getActiveSessions);

// @route   POST /api/table-sessions
// @desc    Создать сессию столика (занять столик)
// @access  Private (Admin with active shift)
router.post('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, validateCreateTableSession, createTableSession);

// @route   GET /api/table-sessions/:id
// @desc    Получить сессию столика
// @access  Private (Admin with active shift)
router.get('/:id', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getTableSession);

// @route   PUT /api/table-sessions/:id/close
// @desc    Закрыть сессию столика
// @access  Private (Admin with active shift)
router.put('/:id/close', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, closeTableSession);

module.exports = router;