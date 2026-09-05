// ===========================================
// Service Model - Database operations for services
// ===========================================

const { pool } = require('../../config/db');

const serviceModel = {
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    return rows;
  },

  /**
   * Get ALL services including inactive ones.
   * Used for admin management panel.
   *
   * @returns {Array} All service records
   */
  async findAllAdmin() {
    const [rows] = await pool.execute(
      'SELECT * FROM services ORDER BY display_order ASC'
    );
    return rows;
  },

  /**
   * Find a single service by ID.
   *
   * @param {number} id
   * @returns {object|null}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new service.
   *
   * @param {object} data - { name, description?, duration_minutes, price, display_order? }
   * @returns {object} Insert result
   *
   * TODO: Add category_id when service categories are introduced
   */
  async create(data) {
    const {
      name,
      description = null,
      duration_minutes,
      price,
      display_order = 0,
    } = data;

    const [result] = await pool.execute(
      'INSERT INTO services (name, description, duration_minutes, price, display_order) VALUES (?, ?, ?, ?, ?)',
      [name, description, duration_minutes, price, display_order]
    );
    return result;
  },

  /**
   * Update an existing service.
   *
   * @param {number} id
   * @param {object} data - Fields to update
   * @returns {object} Update result
   */
  async update(id, data) {
    const { name, description, duration_minutes, price, is_active, display_order } = data;

    const [result] = await pool.execute(
      `UPDATE services 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           duration_minutes = COALESCE(?, duration_minutes),
           price = COALESCE(?, price),
           is_active = COALESCE(?, is_active),
           display_order = COALESCE(?, display_order)
       WHERE id = ?`,
      [name, description, duration_minutes, price, is_active, display_order, id]
    );
    return result;
  },

  /**
   * Soft-delete a service by setting is_active to false.
   * We never hard-delete because queue_entries reference services.
   *
   * @param {number} id
   * @returns {object} Update result
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE services SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result;
  },
};

module.exports = serviceModel;