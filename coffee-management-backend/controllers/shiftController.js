const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

const startShift = async (req, res) => {
  try {
    const [existingShift] = await pool.execute(
      'SELECT id FROM shifts WHERE admin_id = ? AND end_time IS NULL',
      [req.user.id]
    );

    if (existingShift.length > 0) {
      return sendError(res, 'У вас уже есть активная смена', 400);
    }

    const [result] = await pool.execute(
      'INSERT INTO shifts (admin_id, start_time) VALUES (?, NOW())',
      [req.user.id]
    );

    logOperation('SHIFT_STARTED', req.user.id, { shiftId: result.insertId });

    return sendResponse(res, true, {
      id: result.insertId,
      admin_id: req.user.id,
      start_time: new Date(),
      end_time: null,
      total_revenue: 0
    }, 'Смена успешно начата', 201);

  } catch (error) {
    console.error('Ошибка начала смены:', error);
    return sendError(res, 'Ошибка начала смены');
  }
};

const endShift = async (req, res) => {
  try {
    const [shift] = await pool.execute(
      'SELECT * FROM shifts WHERE admin_id = ? AND end_time IS NULL',
      [req.user.id]
    );

    if (shift.length === 0) {
      return sendError(res, 'У вас нет активной смены', 400);
    }

    const shiftId = shift[0].id;

    await pool.execute(
      'UPDATE table_sessions SET end_time = NOW() WHERE shift_id = ? AND end_time IS NULL',
      [shiftId]
    );

    await pool.execute(
      'UPDATE vip_sessions SET end_time = NOW(), is_active = FALSE WHERE shift_id = ? AND is_active = TRUE',
      [shiftId]
    );

    const [revenue] = await pool.execute(`
      SELECT 
        (COALESCE(ts_revenue.total, 0) + COALESCE(vip_revenue.total, 0)) as total_revenue
      FROM (
        SELECT SUM(total_amount) as total
        FROM table_sessions 
        WHERE shift_id = ?
      ) ts_revenue
      CROSS JOIN (
        SELECT SUM(paid_amount + total_orders_amount) as total
        FROM vip_sessions 
        WHERE shift_id = ?
      ) vip_revenue
    `, [shiftId, shiftId]);

    const totalRevenue = revenue[0].total_revenue || 0;

    await pool.execute(
      'UPDATE shifts SET end_time = NOW(), total_revenue = ? WHERE id = ?',
      [totalRevenue, shiftId]
    );

    logOperation('SHIFT_ENDED', req.user.id, { shiftId, totalRevenue });

    return sendResponse(res, true, {
      id: shiftId,
      total_revenue: totalRevenue,
      end_time: new Date()
    }, 'Смена завершена');

  } catch (error) {
    console.error('Ошибка завершения смены:', error);
    return sendError(res, 'Ошибка завершения смены');
  }
};

const getCurrentShift = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM shifts WHERE admin_id = ? AND end_time IS NULL',
      [req.user.id]
    );

    if (rows.length === 0) {
      return sendResponse(res, true, null, 'Нет активной смены');
    }

    return sendResponse(res, true, rows[0]);

  } catch (error) {
    console.error('Ошибка получения смены:', error);
    return sendError(res, 'Ошибка получения текущей смены');
  }
};

const getShifts = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT s.*, u.name as admin_name, u.phone as admin_phone
      FROM shifts s
      JOIN users u ON s.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND DATE(s.start_time) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(s.start_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY s.start_time DESC';

    const [rows] = await pool.execute(query, params);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения смен:', error);
    return sendError(res, 'Ошибка получения списка смен');
  }
};

module.exports = { startShift, endShift, getCurrentShift, getShifts };