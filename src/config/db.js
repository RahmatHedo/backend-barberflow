// ===========================================
// MySQL Connection Pool (mysql2/promise)
// ===========================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hair_connect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Timezone & charset
  timezone: '+07:00',
  charset: 'utf8mb4',
  // Enable named placeholders for cleaner queries
  namedPlaceholders: true,
});

/**
 * Test database connection on startup
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection }; // Restart nodemon
