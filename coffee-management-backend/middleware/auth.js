const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware для проверки JWT токена
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Токен не предоставлен'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error.message);
    res.status(401).json({
      success: false,
      error: 'Неверный токен'
    });
  }
};

// Middleware для проверки роли пользователя
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав доступа'
      });
    }
    next();
  };
};

// Middleware для проверки активной смены (только для админов)
const shiftMiddleware = async (req, res, next) => {
  try {
    // Если пользователь не админ, пропускаем проверку
    if (req.user.role !== 'admin') {
      return next();
    }

    const [rows] = await pool.execute(
      'SELECT * FROM shifts WHERE admin_id = ? AND end_time IS NULL',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активной смены. Начните смену для продолжения работы.'
      });
    }

    req.shift = rows[0];
    next();
  } catch (error) {
    console.error('Ошибка проверки смены:', error.message);
    res.status(500).json({
      success: false,
      error: 'Ошибка проверки смены'
    });
  }
};

module.exports = { 
  authMiddleware, 
  roleMiddleware, 
  shiftMiddleware 
};