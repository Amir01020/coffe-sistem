// ===== routes/clients.js =====
const express = require('express');
const router = express.Router();

const { getClients, getClient, createClient, getClientHistory } = require('../controllers/clientController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');
const { validateCreateClient } = require('../utils/validation');

// @route   GET /api/clients
// @desc    Получить всех клиентов
// @access  Private (Admin with active shift)
router.get('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getClients);

// @route   GET /api/clients/:id
// @desc    Получить клиента по ID
// @access  Private (Admin with active shift)
router.get('/:id', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getClient);

// @route   POST /api/clients
// @desc    Создать нового клиента
// @access  Private (Admin with active shift)
router.post('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, validateCreateClient, createClient);

// @route   GET /api/clients/:id/history
// @desc    Получить историю клиента
// @access  Private (Admin with active shift or Director)
router.get('/:id/history', authMiddleware, roleMiddleware(['admin', 'director']), getClientHistory);

module.exports = router;