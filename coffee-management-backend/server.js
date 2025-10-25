const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Импорт конфигурации БД
const { initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cafe Backend API запущен успешно!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes (добавляем поэтапно)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/table-sessions', require('./routes/tableSessions'));
app.use('/api/vip-sessions', require('./routes/vipSessions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/shifts', require('./routes/shifts'));
// app.use('/api/tables', require('./routes/tables'));
// app.use('/api/clients', require('./routes/clients'));
// app.use('/api/table-sessions', require('./routes/tableSessions'));
// app.use('/api/vip-sessions', require('./routes/vipSessions'));
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Инициализируем базу данных (создаем таблицы и начальные данные)
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;