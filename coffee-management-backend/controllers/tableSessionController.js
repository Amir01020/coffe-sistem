const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

// Создать сессию столика (занять столик)
const createTableSession = async (req, res) => {
  try {
    const { table_id, client_id } = req.body;

    // Проверка свободности столика
    const [occupied] = await pool.execute(
      'SELECT id FROM table_sessions WHERE table_id = ? AND end_time IS NULL',
      [table_id]
    );

    if (occupied.length > 0) {
      return sendError(res, 'Столик уже занят', 400);
    }

    // Проверка существования столика
    const [tableExists] = await pool.execute(
      'SELECT id FROM tables WHERE id = ?',
      [table_id]
    );

    if (tableExists.length === 0) {
      return sendError(res, 'Столик не найден', 404);
    }

    // Проверка существования клиента
    const [clientExists] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [client_id]
    );

    if (clientExists.length === 0) {
      return sendError(res, 'Клиент не найден', 404);
    }

    // Создание сессии
    const [result] = await pool.execute(
      'INSERT INTO table_sessions (table_id, client_id, admin_id, shift_id) VALUES (?, ?, ?, ?)',
      [table_id, client_id, req.user.id, req.shift.id]
    );

    logOperation('TABLE_SESSION_CREATED', req.user.id, { 
      sessionId: result.insertId, 
      table_id, 
      client_id 
    });

    return sendResponse(res, true, {
      id: result.insertId,
      table_id,
      client_id,
      admin_id: req.user.id,
      shift_id: req.shift.id,
      start_time: new Date(),
      end_time: null,
      total_amount: 0
    }, 'Столик успешно занят', 201);

  } catch (error) {
    console.error('Ошибка создания сессии столика:', error);
    return sendError(res, 'Ошибка занятия столика');
  }
};

// Получить информацию о сессии столика
const getTableSession = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT ts.*, c.name as client_name, c.phone as client_phone,
             t.table_number, u.name as admin_name
      FROM table_sessions ts
      JOIN clients c ON ts.client_id = c.id
      JOIN tables t ON ts.table_id = t.id
      JOIN users u ON ts.admin_id = u.id
      WHERE ts.id = ?
    `, [id]);

    if (rows.length === 0) {
      return sendError(res, 'Сессия не найдена', 404);
    }

    return sendResponse(res, true, rows[0]);

  } catch (error) {
    console.error('Ошибка получения сессии:', error);
    return sendError(res, 'Ошибка получения информации о сессии');
  }
};

// Закрыть сессию столика (освободить столик)
const closeTableSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка существования активной сессии
    const [session] = await pool.execute(
      'SELECT * FROM table_sessions WHERE id = ? AND end_time IS NULL',
      [id]
    );

    if (session.length === 0) {
      return sendError(res, 'Активная сессия не найдена', 404);
    }

    // Получение суммы заказов
    const [orders] = await pool.execute(
      'SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE session_id = ?',
      [id]
    );

    const totalAmount = orders[0].total;

    // Закрытие сессии
    await pool.execute(
      'UPDATE table_sessions SET end_time = NOW(), total_amount = ? WHERE id = ?',
      [totalAmount, id]
    );

    // Обновление статистики клиента
    await pool.execute(
      'UPDATE clients SET total_visits = total_visits + 1, total_spent = total_spent + ? WHERE id = ?',
      [totalAmount, session[0].client_id]
    );

    // Обновление возможности удаления заказов (больше нельзя удалять)
    await pool.execute(
      'UPDATE orders SET can_delete = FALSE WHERE session_id = ?',
      [id]
    );

    logOperation('TABLE_SESSION_CLOSED', req.user.id, { 
      sessionId: id, 
      totalAmount 
    });

    return sendResponse(res, true, {
      id: parseInt(id),
      total_amount: totalAmount,
      end_time: new Date()
    }, 'Столик освобожден');

  } catch (error) {
    console.error('Ошибка закрытия сессии:', error);
    return sendError(res, 'Ошибка освобождения столика');
  }
};

// Получить все активные сессии столиков
const getActiveSessions = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ts.*, c.name as client_name, c.phone as client_phone,
             t.table_number, u.name as admin_name,
             COALESCE(order_sum.total, 0) as current_total
      FROM table_sessions ts
      JOIN clients c ON ts.client_id = c.id
      JOIN tables t ON ts.table_id = t.id
      JOIN users u ON ts.admin_id = u.id
      LEFT JOIN (
        SELECT session_id, SUM(price) as total
        FROM orders
        WHERE session_id IS NOT NULL
        GROUP BY session_id
      ) order_sum ON ts.id = order_sum.session_id
      WHERE ts.end_time IS NULL
      ORDER BY ts.start_time ASC
    `);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения активных сессий:', error);
    return sendError(res, 'Ошибка получения активных сессий');
  }
};

module.exports = { 
  createTableSession, 
  getTableSession, 
  closeTableSession,
  getActiveSessions 
};