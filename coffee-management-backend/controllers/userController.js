const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

// Получить всех админов (только для директора)
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, login, name, phone, role, created_at FROM users WHERE role = "admin" ORDER BY created_at DESC'
    );

    return sendResponse(res, true, rows);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    return sendError(res, 'Ошибка получения списка админов');
  }
};

// Создать нового админа (только для директора)
const createUser = async (req, res) => {
  try {
    const { login, password, name, phone } = req.body;

    // Проверка существования пользователя с таким логином
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE login = ?',
      [login]
    );

    if (existing.length > 0) {
      return sendError(res, 'Пользователь с таким логином уже существует', 400);
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const [result] = await pool.execute(
      'INSERT INTO users (login, password, name, phone, role) VALUES (?, ?, ?, ?, "admin")',
      [login, hashedPassword, name, phone]
    );

    logOperation('USER_CREATED', req.user.id, { 
      newUserId: result.insertId, 
      login, 
      name 
    });

    return sendResponse(res, true, {
      id: result.insertId,
      login,
      name,
      phone,
      role: 'admin',
      created_at: new Date()
    }, 'Админ успешно создан', 201);

  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return sendError(res, 'Ошибка создания админа');
  }
};

// Удалить админа (только для директора)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка существования пользователя
    const [user] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND role = "admin"',
      [id]
    );

    if (user.length === 0) {
      return sendError(res, 'Админ не найден', 404);
    }

    // Проверка активных смен
    const [shifts] = await pool.execute(
      'SELECT id FROM shifts WHERE admin_id = ? AND end_time IS NULL',
      [id]
    );

    if (shifts.length > 0) {
      return sendError(res, 'Нельзя удалить админа с активной сменой', 400);
    }

    // Удаление пользователя
    await pool.execute(
      'DELETE FROM users WHERE id = ? AND role = "admin"',
      [id]
    );

    logOperation('USER_DELETED', req.user.id, { 
      deletedUserId: id,
      deletedUserName: user[0].name 
    });

    return sendResponse(res, true, null, 'Админ успешно удален');

  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    return sendError(res, 'Ошибка удаления админа');
  }
};

// Получить информацию об админе
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT id, login, name, phone, role, created_at FROM users WHERE id = ? AND role = "admin"',
      [id]
    );

    if (rows.length === 0) {
      return sendError(res, 'Админ не найден', 404);
    }

    return sendResponse(res, true, rows[0]);

  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    return sendError(res, 'Ошибка получения информации об админе');
  }
};

module.exports = { 
  getUsers, 
  createUser, 
  deleteUser, 
  getUser 
};