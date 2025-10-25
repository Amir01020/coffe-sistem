const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation, checkVipSessionExpiry } = require('../utils/helpers');

// Создать VIP сессию
const createVipSession = async (req, res) => {
  try {
    const { client_id, duration_hours, paid_amount } = req.body;

    // Проверка существования клиента
    const [clientExists] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [client_id]
    );

    if (clientExists.length === 0) {
      return sendError(res, 'Клиент не найден', 404);
    }

    // Создание VIP сессии
    const [result] = await pool.execute(
      'INSERT INTO vip_sessions (client_id, admin_id, shift_id, duration_hours, paid_amount) VALUES (?, ?, ?, ?, ?)',
      [client_id, req.user.id, req.shift.id, duration_hours, paid_amount]
    );

    logOperation('VIP_SESSION_CREATED', req.user.id, { 
      sessionId: result.insertId, 
      client_id,
      duration_hours,
      paid_amount 
    });

    return sendResponse(res, true, {
      id: result.insertId,
      client_id,
      admin_id: req.user.id,
      shift_id: req.shift.id,
      start_time: new Date(),
      end_time: null,
      duration_hours,
      paid_amount,
      total_orders_amount: 0,
      is_active: true
    }, 'VIP сессия создана', 201);

  } catch (error) {
    console.error('Ошибка создания VIP сессии:', error);
    return sendError(res, 'Ошибка создания VIP сессии');
  }
};

// Получить активные VIP сессии
const getActiveVipSessions = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT vs.*, c.name as client_name, c.phone as client_phone,
             u.name as admin_name,
             COALESCE(order_sum.total, 0) as current_orders_total
      FROM vip_sessions vs
      JOIN clients c ON vs.client_id = c.id
      JOIN users u ON vs.admin_id = u.id
      LEFT JOIN (
        SELECT vip_session_id, SUM(price) as total
        FROM orders
        WHERE vip_session_id IS NOT NULL
        GROUP BY vip_session_id
      ) order_sum ON vs.id = order_sum.vip_session_id
      WHERE vs.is_active = TRUE
      ORDER BY vs.start_time ASC
    `);

    // Добавляем информацию об истечении времени для каждой сессии
    const sessionsWithExpiry = rows.map(session => {
      const expiryInfo = checkVipSessionExpiry(session.start_time, session.duration_hours);
      return {
        ...session,
        is_expired: expiryInfo.isExpired,
        time_left_ms: expiryInfo.timeLeft,
        end_time_calculated: expiryInfo.endTime
      };
    });

    return sendResponse(res, true, sessionsWithExpiry);

  } catch (error) {
    console.error('Ошибка получения активных VIP сессий:', error);
    return sendError(res, 'Ошибка получения активных VIP сессий');
  }
};

// Продлить VIP сессию
const extendVipSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_hours, additional_payment } = req.body;

    // Проверка существования активной сессии
    const [session] = await pool.execute(
      'SELECT * FROM vip_sessions WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (session.length === 0) {
      return sendError(res, 'Активная VIP сессия не найдена', 404);
    }

    const currentSession = session[0];
    const newDuration = currentSession.duration_hours + additional_hours;
    const newPaidAmount = parseFloat(currentSession.paid_amount) + parseFloat(additional_payment);

    // Обновление сессии
    await pool.execute(
      'UPDATE vip_sessions SET duration_hours = ?, paid_amount = ? WHERE id = ?',
      [newDuration, newPaidAmount, id]
    );

    logOperation('VIP_SESSION_EXTENDED', req.user.id, { 
      sessionId: id,
      additional_hours,
      additional_payment,
      new_duration: newDuration
    });

    return sendResponse(res, true, {
      id: parseInt(id),
      duration_hours: newDuration,
      paid_amount: newPaidAmount,
      additional_hours,
      additional_payment
    }, 'VIP сессия продлена');

  } catch (error) {
    console.error('Ошибка продления VIP сессии:', error);
    return sendError(res, 'Ошибка продления VIP сессии');
  }
};

// Закрыть VIP сессию
const closeVipSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка существования активной сессии
    const [session] = await pool.execute(
      'SELECT * FROM vip_sessions WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (session.length === 0) {
      return sendError(res, 'Активная VIP сессия не найдена', 404);
    }

    // Получение суммы заказов
    const [orders] = await pool.execute(
      'SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE vip_session_id = ?',
      [id]
    );

    const totalOrdersAmount = orders[0].total;
    const totalAmount = parseFloat(session[0].paid_amount) + totalOrdersAmount;

    // Закрытие сессии
    await pool.execute(
      'UPDATE vip_sessions SET end_time = NOW(), is_active = FALSE, total_orders_amount = ? WHERE id = ?',
      [totalOrdersAmount, id]
    );

    // Обновление статистики клиента
    await pool.execute(
      'UPDATE clients SET total_visits = total_visits + 1, total_spent = total_spent + ? WHERE id = ?',
      [totalAmount, session[0].client_id]
    );

    // Обновление возможности удаления заказов
    await pool.execute(
      'UPDATE orders SET can_delete = FALSE WHERE vip_session_id = ?',
      [id]
    );

    logOperation('VIP_SESSION_CLOSED', req.user.id, { 
      sessionId: id,
      totalAmount,
      totalOrdersAmount
    });

    return sendResponse(res, true, {
      id: parseInt(id),
      total_amount: totalAmount,
      total_orders_amount: totalOrdersAmount,
      end_time: new Date()
    }, 'VIP сессия закрыта');

  } catch (error) {
    console.error('Ошибка закрытия VIP сессии:', error);
    return sendError(res, 'Ошибка закрытия VIP сессии');
  }
};

// Получить истекающие VIP сессии (для уведомлений)
const getExpiringVipSessions = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT vs.*, c.name as client_name, c.phone as client_phone
      FROM vip_sessions vs
      JOIN clients c ON vs.client_id = c.id
      WHERE vs.is_active = TRUE
    `);

    // Фильтруем сессии, у которых осталось меньше 30 минут
    const expiringSessions = rows.filter(session => {
      const expiryInfo = checkVipSessionExpiry(session.start_time, session.duration_hours);
      const timeLeftMinutes = expiryInfo.timeLeft / (1000 * 60); // конвертируем в минуты
      return timeLeftMinutes <= 30 && timeLeftMinutes > 0; // меньше 30 минут, но еще не истекло
    }).map(session => {
      const expiryInfo = checkVipSessionExpiry(session.start_time, session.duration_hours);
      return {
        ...session,
        time_left_ms: expiryInfo.timeLeft,
        time_left_minutes: Math.floor(expiryInfo.timeLeft / (1000 * 60))
      };
    });

    return sendResponse(res, true, expiringSessions);

  } catch (error) {
    console.error('Ошибка получения истекающих VIP сессий:', error);
    return sendError(res, 'Ошибка получения истекающих сессий');
  }
};

// Получить информацию о VIP сессии
const getVipSession = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT vs.*, c.name as client_name, c.phone as client_phone,
             u.name as admin_name
      FROM vip_sessions vs
      JOIN clients c ON vs.client_id = c.id
      JOIN users u ON vs.admin_id = u.id
      WHERE vs.id = ?
    `, [id]);

    if (rows.length === 0) {
      return sendError(res, 'VIP сессия не найдена', 404);
    }

    const session = rows[0];
    const expiryInfo = checkVipSessionExpiry(session.start_time, session.duration_hours);

    return sendResponse(res, true, {
      ...session,
      is_expired: expiryInfo.isExpired,
      time_left_ms: expiryInfo.timeLeft,
      end_time_calculated: expiryInfo.endTime
    });

  } catch (error) {
    console.error('Ошибка получения VIP сессии:', error);
    return sendError(res, 'Ошибка получения информации о VIP сессии');
  }
};

module.exports = { 
  createVipSession, 
  getActiveVipSessions, 
  extendVipSession, 
  closeVipSession,
  getExpiringVipSessions,
  getVipSession 
};