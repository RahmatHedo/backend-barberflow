const { pool } = require('../../config/db');

const userModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, phone, avatar_url, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create(userData) {
    const { name, email, password_hash, role = 'barber', phone = null } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, role, phone]
    );
    return result;
  },

  async updateLastLogin(id) {
    await pool.execute(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [id]
    );
  },
};

module.exports = userModel;