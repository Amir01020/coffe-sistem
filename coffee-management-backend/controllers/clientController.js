const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

const getClients = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM clients ORDER BY name ASC'
    );

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения клиентов:', error);
    return sendError(res, 'Ошибка получения списка клиентов');
  }
};

const getClient = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return sendError(res, 'Клиент не найден', 404);
    }

    return sendResponse(res, true, rows[0]);

  } catch (error) {
    console.error('Ошибка получения клиента:', error);
    return sendError(res, 'Ошибка получения информации о клиенте');
  }
};

const createClient = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO clients (name, phone) VALUES (?, ?)',
      [name, phone]
    );

    logOperation('CLIENT_CREATED', req.user.id, { clientId: result.insertId, name });

    return sendResponse(res, true, {
      id: result.insertId,
      name,
      phone,
      total_visits: 0,
      total_spent: 0,
      created_at: new Date()
    }, 'Клиент создан', 201);

  } catch (error) {
    console.error('Ошибка создания клиента:', error);
    return sendError(res, 'Ошибка создания клиента');
  }
};

const getClientHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [tableSessions] = await pool.execute(`
      SELECT 'regular' as type, ts.start_time, ts.end_time, ts.total_amount,
             t.table_number, u.name as admin_name
      FROM table_sessions ts
      JOIN tables t ON ts.table_id = t.id
      JOIN users u ON ts.admin_id = u.id
      WHERE ts.client_id = ?
      ORDER BY ts.start_time DESC
    `, [id]);

    const [vipSessions] = await pool.execute(`
      SELECT 'vip' as type, vs.start_time, vs.end_time, 
             (vs.paid_amount + vs.total_orders_amount) as total_amount,
             vs.duration_hours, u.name as admin_name
      FROM vip_sessions vs
      JOIN users u ON vs.admin_id = u.id
      WHERE vs.client_id = ?
      ORDER BY vs.start_time DESC
    `, [id]);

    const history = [...tableSessions, ...vipSessions]
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    return sendResponse(res, true, history);

  } catch (error) {
    console.error('Ошибка получения истории клиента:', error);
    return sendError(res, 'Ошибка получения истории посещений');
  }
};

module.exports = { getClients, getClient, createClient, getClientHistory };