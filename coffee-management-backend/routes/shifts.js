// ===== routes/shifts.js =====
const express = require('express');
const router = express.Router();

const { startShift, endShift, getCurrentShift, getShifts } = require('../controllers/shiftController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');

// @route   POST /api/shifts/start
// @desc    Начать смену
// @access  Admin only
router.post('/start', authMiddleware, roleMiddleware(['admin']), startShift);

// @route   POST /api/shifts/end
// @desc    Закончить смену
// @access  Admin only
router.post('/end', authMiddleware, roleMiddleware(['admin']), endShift);

// @route   GET /api/shifts/current
// @desc    Получить текущую смену
// @access  Admin only
router.get('/current', authMiddleware, roleMiddleware(['admin']), getCurrentShift);

// @route   GET /api/shifts
// @desc    Получить все смены (с фильтрацией)
// @access  Director only
router.get('/', authMiddleware, roleMiddleware(['director']), getShifts);

module.exports = router;