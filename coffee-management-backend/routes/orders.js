// ===== routes/orders.js =====
const express = require('express');
const router = express.Router();

const { createOrder, deleteOrder, getOrdersBySession, getOrdersByVipSession, getAllOrders, getOrdersStats } = require('../controllers/orderController');
const { authMiddleware, roleMiddleware, shiftMiddleware } = require('../middleware/auth');
const { validateCreateOrder } = require('../utils/validation');

// @route   GET /api/orders/stats
// @desc    Получить статистику заказов
// @access  Private (Admin with active shift or Director)
router.get('/stats', authMiddleware, roleMiddleware(['admin', 'director']), getOrdersStats);

// @route   GET /api/orders
// @desc    Получить все заказы
// @access  Private (Admin with active shift or Director)
router.get('/', authMiddleware, roleMiddleware(['admin', 'director']), getAllOrders);

// @route   POST /api/orders
// @desc    Создать заказ
// @access  Private (Admin with active shift)
router.post('/', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, validateCreateOrder, createOrder);

// @route   DELETE /api/orders/:id
// @desc    Удалить заказ
// @access  Private (Admin with active shift)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, deleteOrder);

// @route   GET /api/orders/session/:sessionId
// @desc    Получить заказы по сессии столика
// @access  Private (Admin with active shift)
router.get('/session/:sessionId', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getOrdersBySession);

// @route   GET /api/orders/vip-session/:vipSessionId
// @desc    Получить заказы по VIP сессии
// @access  Private (Admin with active shift)
router.get('/vip-session/:vipSessionId', authMiddleware, roleMiddleware(['admin']), shiftMiddleware, getOrdersByVipSession);

module.exports = router;
