const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

const getTables = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             CASE WHEN ts.id IS NOT NULL THEN TRUE ELSE FALSE END as is_occupied,
             c.name as client_name,
             ts.id as session_id,
             ts.start_time
      FROM tables t
      LEFT JOIN table_sessions ts ON t.id = ts.table_id AND ts.end_time IS NULL
      LEFT JOIN clients c ON ts.client_id = c.id
      ORDER BY t.table_number ASC
    `);

    return sendResponse(res, true, rows);

  } catch (error) {
    console.error('Ошибка получения столиков:', error);
    return sendError(res, 'Ошибка получения списка столиков');
  }
};

const createTable = async (req, res) => {
  try {
    const { table_number } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM tables WHERE table_number = ?',
      [table_number]
    );

    if (existing.length > 0) {
      return sendError(res, 'Столик с таким номером уже существует', 400);
    }

    const [result] = await pool.execute(
      'INSERT INTO tables (table_number) VALUES (?)',
      [table_number]
    );

    logOperation('TABLE_CREATED', req.user.id, { tableId: result.insertId, table_number });

    return sendResponse(res, true, {
      id: result.insertId,
      table_number,
      is_occupied: false,
      created_at: new Date()
    }, 'Столик создан', 201);

  } catch (error) {
    console.error('Ошибка создания столика:', error);
    return sendError(res, 'Ошибка создания столика');
  }
};

module.exports = { getTables, createTable };