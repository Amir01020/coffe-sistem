// ===== routes/tables.js =====
const express = require('express');
const router = express.Router();

const { getTables, createTable } = require('../controllers/tableController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');
const { validateCreateTable } = require('../utils/validation');

// @route   GET /api/tables
// @desc    Получить все столики
// @access  Private (Admin with active shift)
router.get('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getTables);

// @route   POST /api/tables
// @desc    Создать новый столик
// @access  Private (Admin with active shift)
router.post('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, validateCreateTable, createTable);

module.exports = router;