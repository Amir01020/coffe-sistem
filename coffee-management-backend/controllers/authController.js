const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendResponse, sendError, logOperation } = require('../utils/helpers');

// Вход в систему
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Поиск пользователя по логину
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE login = ?',
      [login]
    );

    if (rows.length === 0) {
      logOperation('LOGIN_FAILED', null, { login, reason: 'User not found' });
      return sendError(res, 'Неверные учетные данные', 401);
    }

    const user = rows[0];

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logOperation('LOGIN_FAILED', user.id, { reason: 'Wrong password' });
      return sendError(res, 'Неверные учетные данные', 401);
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        login: user.login 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logOperation('LOGIN_SUCCESS', user.id, { role: user.role });

    // Отправка ответа с токеном и данными пользователя
    return sendResponse(res, true, {
      token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      }
    }, 'Успешный вход в систему');

  } catch (error) {
    console.error('Ошибка входа:', error);
    return sendError(res, 'Ошибка входа в систему');
  }
};

// Выход из системы
const logout = (req, res) => {
  try {
    logOperation('LOGOUT', req.user?.id || null);
    return sendResponse(res, true, null, 'Успешный выход из системы');
  } catch (error) {
    console.error('Ошибка выхода:', error);
    return sendError(res, 'Ошибка выхода из системы');
  }
};

// Получение данных текущего пользователя
const getMe = async (req, res) => {
  try {
    // Получаем свежие данные пользователя из БД
    const [rows] = await pool.execute(
      'SELECT id, login, name, phone, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return sendError(res, 'Пользователь не найден', 404);
    }

    const user = rows[0];

    // Если пользователь админ, получаем информацию о текущей смене
    let currentShift = null;
    if (user.role === 'admin') {
      const [shiftRows] = await pool.execute(
        'SELECT id, start_time, total_revenue FROM shifts WHERE admin_id = ? AND end_time IS NULL',
        [user.id]
      );
      
      if (shiftRows.length > 0) {
        currentShift = shiftRows[0];
      }
    }

    return sendResponse(res, true, {
      user,
      currentShift
    });

  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return sendError(res, 'Ошибка получения данных пользователя');
  }
};

// Проверка токена
const verifyToken = (req, res) => {
  try {
    return sendResponse(res, true, {
      valid: true,
      user: {
        id: req.user.id,
        login: req.user.login,
        name: req.user.name,
        role: req.user.role
      }
    }, 'Токен действителен');
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return sendError(res, 'Ошибка проверки токена');
  }
};

module.exports = { 
  login, 
  logout, 
  getMe, 
  verifyToken 
};