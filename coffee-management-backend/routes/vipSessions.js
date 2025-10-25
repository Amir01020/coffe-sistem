// ===== routes/vipSessions.js =====
const express = require('express');
const router = express.Router();

const { createVipSession, getActiveVipSessions, extendVipSession, closeVipSession, getExpiringVipSessions, getVipSession } = require('../controllers/vipSessionController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');
const { validateCreateVipSession } = require('../utils/validation');

// @route   GET /api/vip-sessions/active
// @desc    Получить активные VIP сессии
// @access  Private (Admin with active shift)
router.get('/active', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getActiveVipSessions);

// @route   GET /api/vip-sessions/expiring
// @desc    Получить истекающие VIP сессии
// @access  Private (Admin with active shift)
router.get('/expiring', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getExpiringVipSessions);

// @route   POST /api/vip-sessions
// @desc    Создать VIP сессию
// @access  Private (Admin with active shift)
router.post('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, validateCreateVipSession, createVipSession);

// @route   GET /api/vip-sessions/:id
// @desc    Получить VIP сессию
// @access  Private (Admin with active shift)
router.get('/:id', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getVipSession);

// @route   PUT /api/vip-sessions/:id/extend
// @desc    Продлить VIP сессию
// @access  Private (Admin with active shift)
router.put('/:id/extend', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, extendVipSession);

// @route   PUT /api/vip-sessions/:id/close
// @desc    Закрыть VIP сессию
// @access  Private (Admin with active shift)
router.put('/:id/close', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, closeVipSession);

module.exports = router;