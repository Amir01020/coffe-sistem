const { pool } = require('../config/database');
const { sendResponse, sendError } = require('../utils/helpers');

// Отчет по выручке
const getRevenueReport = async (req, res) => {
  try {
    const { start_date, end_date, admin_id } = req.query;

    let query = `
      SELECT 
        DATE(s.start_time) as date,
        s.id as shift_id,
        s.start_time,
        s.end_time,
        s.total_revenue,
        u.name as admin_name,
        u.id as admin_id,
        COUNT(DISTINCT ts.id) as table_sessions_count,
        COUNT(DISTINCT vs.id) as vip_sessions_count,
        COALESCE(SUM(ts.total_amount), 0) as table_revenue,
        COALESCE(SUM(vs.paid_amount + vs.total_orders_amount), 0) as vip_revenue
      FROM shifts s
      JOIN users u ON s.admin_id = u.id
      LEFT JOIN table_sessions ts ON s.id = ts.shift_id
      LEFT JOIN vip_sessions vs ON s.id = vs.shift_id
      WHERE s.end_time IS NOT NULL
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

    if (admin_id) {
      query += ' AND s.admin_id = ?';
      params.push(admin_id);
    }

    query += `
      GROUP BY s.id, DATE(s.start_time), u.name, u.id
      ORDER BY s.start_time DESC
    `;

    const [rows] = await pool.execute(query, params);

    // Общая статистика
    const totalRevenue = rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
    const totalTableRevenue = rows.reduce((sum, row) => sum + parseFloat(row.table_revenue || 0), 0);
    const totalVipRevenue = rows.reduce((sum, row) => sum + parseFloat(row.vip_revenue || 0), 0);
    const totalSessions = rows.reduce((sum, row) => sum + parseInt(row.table_sessions_count || 0) + parseInt(row.vip_sessions_count || 0), 0);

    return sendResponse(res, true, {
      shifts: rows,
      summary: {
        total_revenue: totalRevenue,
        total_table_revenue: totalTableRevenue,
        total_vip_revenue: totalVipRevenue,
        total_sessions: totalSessions,
        shifts_count: rows.length
      }
    });

  } catch (error) {
    console.error('Ошибка получения отчета по выручке:', error);
    return sendError(res, 'Ошибка получения отчета по выручке');
  }
};

// Отчет по сменам
const getShiftsReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        s.*,
        u.name as admin_name,
        u.phone as admin_phone,
        TIMEDIFF(s.end_time, s.start_time) as shift_duration,
        COUNT(DISTINCT ts.id) as table_sessions,
        COUNT(DISTINCT vs.id) as vip_sessions,
        COUNT(DISTINCT o.id) as total_orders
      FROM shifts s
      JOIN users u ON s.admin_id = u.id
      LEFT JOIN table_sessions ts ON s.id = ts.shift_id
      LEFT JOIN vip_sessions vs ON s.id = vs.shift_id
      LEFT JOIN orders o ON (o.session_id = ts.id OR o.vip_session_id = vs.id)
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

    query += `
      GROUP BY s.id
      ORDER BY s.start_time DESC
    `;

    const [rows] = await pool.execute(query, params);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения отчета по сменам:', error);
    return sendError(res, 'Ошибка получения отчета по сменам');
  }
};

// Дневной отчет
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    // Основная статистика за день
    const [dailyStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.id) as shifts_count,
        COALESCE(SUM(s.total_revenue), 0) as total_revenue,
        COUNT(DISTINCT ts.id) as table_sessions_count,
        COUNT(DISTINCT vs.id) as vip_sessions_count,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.price), 0) as orders_total
      FROM shifts s
      LEFT JOIN table_sessions ts ON s.id = ts.shift_id AND DATE(ts.start_time) = ?
      LEFT JOIN vip_sessions vs ON s.id = vs.shift_id AND DATE(vs.start_time) = ?
      LEFT JOIN orders o ON (o.session_id = ts.id OR o.vip_session_id = vs.id) AND DATE(o.created_at) = ?
      WHERE DATE(s.start_time) = ?
    `, [reportDate, reportDate, reportDate, reportDate]);

    // Статистика по админам
    const [adminStats] = await pool.execute(`
      SELECT 
        u.id,
        u.name as admin_name,
        COUNT(DISTINCT s.id) as shifts_count,
        COALESCE(SUM(s.total_revenue), 0) as admin_revenue,
        TIME_FORMAT(SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(COALESCE(s.end_time, NOW()), s.start_time)))), '%H:%i') as total_work_time
      FROM users u
      LEFT JOIN shifts s ON u.id = s.admin_id AND DATE(s.start_time) = ?
      WHERE u.role = 'admin'
      GROUP BY u.id, u.name
      ORDER BY admin_revenue DESC
    `, [reportDate]);

    // Популярные столики
    const [tableStats] = await pool.execute(`
      SELECT 
        t.table_number,
        COUNT(ts.id) as sessions_count,
        COALESCE(SUM(ts.total_amount), 0) as table_revenue,
        AVG(TIME_TO_SEC(TIMEDIFF(ts.end_time, ts.start_time)) / 3600) as avg_session_hours
      FROM tables t
      LEFT JOIN table_sessions ts ON t.id = ts.table_id AND DATE(ts.start_time) = ?
      GROUP BY t.id, t.table_number
      ORDER BY sessions_count DESC, table_revenue DESC
      LIMIT 10
    `, [reportDate]);

    return sendResponse(res, true, {
      date: reportDate,
      daily_stats: dailyStats[0],
      admin_stats: adminStats,
      table_stats: tableStats
    });

  } catch (error) {
    console.error('Ошибка получения дневного отчета:', error);
    return sendError(res, 'Ошибка получения дневного отчета');
  }
};

// Отчет по клиентам
const getClientsReport = async (req, res) => {
  try {
    const { start_date, end_date, limit = 50 } = req.query;

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT COALESCE(ts.id, vs.id)) as total_sessions,
        COUNT(DISTINCT ts.id) as table_sessions,
        COUNT(DISTINCT vs.id) as vip_sessions,
        COALESCE(SUM(COALESCE(ts.total_amount, vs.paid_amount + vs.total_orders_amount)), 0) as total_spent_period,
        MAX(COALESCE(ts.start_time, vs.start_time)) as last_visit
      FROM clients c
      LEFT JOIN table_sessions ts ON c.id = ts.client_id
      LEFT JOIN vip_sessions vs ON c.id = vs.client_id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND (DATE(ts.start_time) >= ? OR DATE(vs.start_time) >= ?)';
      params.push(start_date, start_date);
    }

    if (end_date) {
      query += ' AND (DATE(ts.start_time) <= ? OR DATE(vs.start_time) <= ?)';
      params.push(end_date, end_date);
    }

    query += `
      GROUP BY c.id
      ORDER BY total_spent_period DESC, total_sessions DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));

    const [rows] = await pool.execute(query, params);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения отчета по клиентам:', error);
    return sendError(res, 'Ошибка получения отчета по клиентам');
  }
};

module.exports = { 
  getRevenueReport, 
  getShiftsReport, 
  getDailyReport,
  getClientsReport 
};