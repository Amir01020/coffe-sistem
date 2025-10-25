const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// Тестирование подключения
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Подключение к базе данных успешно!');
    connection.release();
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    process.exit(1);
  }
};

// Создание базы данных если она не существует
const createDatabase = async () => {
  try {
    const configWithoutDB = {
      ...dbConfig,
      database: undefined
    };
    
    const connection = await mysql.createConnection(configWithoutDB);
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'cafe_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ База данных создана или уже существует');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Ошибка создания базы данных:', error.message);
    process.exit(1);
  }
};

// Создание всех таблиц
const createTables = async () => {
  try {
    console.log('🔧 Создание таблиц...');

    // Таблица пользователей
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role ENUM('director', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Таблица смен
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id INT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NULL,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Таблица столиков
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT PRIMARY KEY AUTO_INCREMENT,
        table_number INT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица клиентов
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        total_visits INT DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Таблица сессий столиков
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS table_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        table_id INT NOT NULL,
        client_id INT NOT NULL,
        admin_id INT NOT NULL,
        shift_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        total_amount DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (table_id) REFERENCES tables(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (admin_id) REFERENCES users(id),
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
      )
    `);

    // Таблица VIP сессий
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vip_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        client_id INT NOT NULL,
        admin_id INT NOT NULL,
        shift_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        duration_hours INT NOT NULL,
        paid_amount DECIMAL(10,2) NOT NULL,
        total_orders_amount DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (admin_id) REFERENCES users(id),
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
      )
    `);

    // Таблица заказов
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NULL,
        vip_session_id INT NULL,
        item_name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        can_delete BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (session_id) REFERENCES table_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (vip_session_id) REFERENCES vip_sessions(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Все таблицы созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error.message);
    process.exit(1);
  }
};

// Создание индексов
const createIndexes = async () => {
  try {
    console.log('🔧 Создание индексов...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_shifts_admin_active ON shifts(admin_id, end_time)',
      'CREATE INDEX IF NOT EXISTS idx_table_sessions_active ON table_sessions(table_id, end_time)',
      'CREATE INDEX IF NOT EXISTS idx_vip_sessions_active ON vip_sessions(is_active, end_time)',
      'CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_vip_session ON orders(vip_session_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_can_delete ON orders(can_delete, created_at)'
    ];

    for (const indexQuery of indexes) {
      await pool.execute(indexQuery);
    }

    console.log('✅ Индексы созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка создания индексов:', error.message);
  }
};

// Вставка начальных данных
const insertInitialData = async () => {
  try {
    console.log('🔧 Вставка начальных данных...');

    // Проверяем есть ли уже пользователи
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      const bcrypt = require('bcryptjs');
      
      // Хешируем пароли
      const directorPassword = await bcrypt.hash('director123', 10);
      const adminPassword = await bcrypt.hash('admin123', 10);

      // Вставляем пользователей
      await pool.execute(`
        INSERT INTO users (login, password, name, phone, role) VALUES 
        ('director', ?, 'Директор', '+998901234567', 'director'),
        ('admin1', ?, 'Админ 1', '+998901234568', 'admin')
      `, [directorPassword, adminPassword]);

      console.log('✅ Пользователи созданы (director/director123, admin1/admin123)');
    }

    // Проверяем есть ли столики
    const [existingTables] = await pool.execute('SELECT COUNT(*) as count FROM tables');
    
    if (existingTables[0].count === 0) {
      await pool.execute(`
        INSERT INTO tables (table_number) VALUES (1), (2), (3), (4), (5)
      `);
      console.log('✅ Тестовые столики созданы');
    }

    // Проверяем есть ли клиенты
    const [existingClients] = await pool.execute('SELECT COUNT(*) as count FROM clients');
    
    if (existingClients[0].count === 0) {
      await pool.execute(`
        INSERT INTO clients (name, phone) VALUES 
        ('Иван Иванов', '+998901111111'),
        ('Мария Петрова', '+998902222222'),
        ('Ахмед Каримов', '+998903333333')
      `);
      console.log('✅ Тестовые клиенты созданы');
    }

    console.log('✅ Начальные данные вставлены успешно!');
  } catch (error) {
    console.error('❌ Ошибка вставки начальных данных:', error.message);
  }
};

// Инициализация базы данных
const initializeDatabase = async () => {
  await createDatabase();
  await testConnection();
  await createTables();
  await createIndexes();
  await insertInitialData();
  console.log('🎉 База данных полностью настроена!');
};

module.exports = { pool, testConnection, initializeDatabase };