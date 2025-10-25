// ===== routes/reports.js =====
const express = require('express');
const router = express.Router();

const { getRevenueReport, getShiftsReport, getDailyReport, getClientsReport } = require('../controllers/reportController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Все отчеты доступны только директору
router.use(authMiddleware, roleMiddleware(['director']));

// @route   GET /api/reports/revenue
// @desc    Отчет по выручке
// @access  Director only
router.get('/revenue', getRevenueReport);

// @route   GET /api/reports/shifts
// @desc    Отчет по сменам
// @access  Director only
router.get('/shifts', getShiftsReport);

// @route   GET /api/reports/daily
// @desc    Дневной отчет
// @access  Director only
router.get('/daily', getDailyReport);

// @route   GET /api/reports/clients
// @desc    Отчет по клиентам
// @access  Director only
router.get('/clients', getClientsReport);

module.exports = router;