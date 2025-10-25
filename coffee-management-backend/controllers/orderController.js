const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation, canDeleteOrder } = require('../utils/helpers');

// Добавить заказ
const createOrder = async (req, res) => {
  try {
    const { item_name, price, session_id, vip_session_id } = req.body;

    // Проверка, что указан либо session_id, либо vip_session_id
    if (!session_id && !vip_session_id) {
      return sendError(res, 'Необходимо указать ID сессии столика или VIP сессии', 400);
    }

    if (session_id && vip_session_id) {
      return sendError(res, 'Нельзя указывать одновременно ID сессии столика и VIP сессии', 400);
    }

    // Проверка существования сессии
    if (session_id) {
      const [sessionExists] = await pool.execute(
        'SELECT id FROM table_sessions WHERE id = ? AND end_time IS NULL',
        [session_id]
      );
      
      if (sessionExists.length === 0) {
        return sendError(res, 'Активная сессия столика не найдена', 404);
      }
    }

    if (vip_session_id) {
      const [vipSessionExists] = await pool.execute(
        'SELECT id FROM vip_sessions WHERE id = ? AND is_active = TRUE',
        [vip_session_id]
      );
      
      if (vipSessionExists.length === 0) {
        return sendError(res, 'Активная VIP сессия не найдена', 404);
      }
    }

    // Создание заказа
    const [result] = await pool.execute(
      'INSERT INTO orders (item_name, price, session_id, vip_session_id) VALUES (?, ?, ?, ?)',
      [item_name, price, session_id || null, vip_session_id || null]
    );

    logOperation('ORDER_CREATED', req.user.id, { 
      orderId: result.insertId,
      item_name,
      price,
      session_id,
      vip_session_id
    });

    return sendResponse(res, true, {
      id: result.insertId,
      item_name,
      price: parseFloat(price),
      session_id: session_id || null,
      vip_session_id: vip_session_id || null,
      created_at: new Date(),
      can_delete: true
    }, 'Заказ добавлен', 201);

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    return sendError(res, 'Ошибка добавления заказа');
  }
};

// Удалить заказ (в течение 5 минут)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Получение информации о заказе
    const [order] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (order.length === 0) {
      return sendError(res, 'Заказ не найден', 404);
    }

    const orderData = order[0];

    // Проверка возможности удаления (в течение 5 минут)
    if (!canDeleteOrder(orderData.created_at)) {
      return sendError(res, 'Заказ можно удалить только в течение 5 минут после создания', 400);
    }

    // Удаление заказа
    await pool.execute(
      'DELETE FROM orders WHERE id = ?',
      [id]
    );

    logOperation('ORDER_DELETED', req.user.id, { 
      orderId: id,
      item_name: orderData.item_name,
      price: orderData.price
    });

    return sendResponse(res, true, null, 'Заказ удален');

  } catch (error) {
    console.error('Ошибка удаления заказа:', error);
    return sendError(res, 'Ошибка удаления заказа');
  }
};

// Получить заказы по сессии столика
const getOrdersBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    // Добавляем информацию о возможности удаления
    const ordersWithDeleteInfo = rows.map(order => ({
      ...order,
      can_delete_now: canDeleteOrder(order.created_at) && order.can_delete
    }));

    return sendResponse(res, true, ordersWithDeleteInfo);

  } catch (error) {
    console.error('Ошибка получения заказов сессии:', error);
    return sendError(res, 'Ошибка получения заказов');
  }
};

// Получить заказы по VIP сессии
const getOrdersByVipSession = async (req, res) => {
  try {
    const { vipSessionId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE vip_session_id = ? ORDER BY created_at ASC',
      [vipSessionId]
    );

    // Добавляем информацию о возможности удаления
    const ordersWithDeleteInfo = rows.map(order => ({
      ...order,
      can_delete_now: canDeleteOrder(order.created_at) && order.can_delete
    }));

    return sendResponse(res, true, ordersWithDeleteInfo);

  } catch (error) {
    console.error('Ошибка получения заказов VIP сессии:', error);
    return sendError(res, 'Ошибка получения заказов VIP сессии');
  }
};

// Получить все заказы (с фильтрацией)
const getAllOrders = async (req, res) => {
  try {
    const { date, session_type } = req.query;

    let query = `
      SELECT o.*, 
             CASE WHEN o.session_id IS NOT NULL THEN 'regular' ELSE 'vip' END as session_type,
             CASE WHEN o.session_id IS NOT NULL THEN ts.table_id ELSE null END as table_id,
             CASE WHEN o.session_id IS NOT NULL THEN t.table_number ELSE null END as table_number,
             c.name as client_name,
             u.name as admin_name
      FROM orders o
      LEFT JOIN table_sessions ts ON o.session_id = ts.id
      LEFT JOIN vip_sessions vs ON o.vip_session_id = vs.id
      LEFT JOIN tables t ON ts.table_id = t.id
      LEFT JOIN clients c ON COALESCE(ts.client_id, vs.client_id) = c.id
      LEFT JOIN users u ON COALESCE(ts.admin_id, vs.admin_id) = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (date) {
      query += ' AND DATE(o.created_at) = ?';
      params.push(date);
    }

    if (session_type) {
      if (session_type === 'regular') {
        query += ' AND o.session_id IS NOT NULL';
      } else if (session_type === 'vip') {
        query += ' AND o.vip_session_id IS NOT NULL';
      }
    }

    query += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения всех заказов:', error);
    return sendError(res, 'Ошибка получения списка заказов');
  }
};

// Получить статистику заказов
const getOrdersStats = async (req, res) => {
  try {
    const { date } = req.query;

    let dateCondition = '';
    const params = [];

    if (date) {
      dateCondition = 'WHERE DATE(created_at) = ?';
      params.push(date);
    }

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(price) as total_amount,
        COUNT(CASE WHEN session_id IS NOT NULL THEN 1 END) as regular_orders,
        COUNT(CASE WHEN vip_session_id IS NOT NULL THEN 1 END) as vip_orders,
        SUM(CASE WHEN session_id IS NOT NULL THEN price ELSE 0 END) as regular_amount,
        SUM(CASE WHEN vip_session_id IS NOT NULL THEN price ELSE 0 END) as vip_amount
      FROM orders 
      ${dateCondition}
    `, params);

    return sendResponse(res, true, stats[0]);

  } catch (error) {
    console.error('Ошибка получения статистики заказов:', error);
    return sendError(res, 'Ошибка получения статистики заказов');
  }
};

module.exports = { 
  createOrder, 
  deleteOrder, 
  getOrdersBySession, 
  getOrdersByVipSession,
  getAllOrders,
  getOrdersStats 
};