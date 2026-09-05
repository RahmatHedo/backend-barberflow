const { pool } = require('../../config/db');

const storeModel = {
  /** Ambil status buka/tutup toko (selalu satu baris, id=1). */
  async getStatus() {
    const [rows] = await pool.execute(
      'SELECT id, is_open, updated_at, updated_by FROM store_settings WHERE id = 1'
    );
    if (rows.length === 0) {
      await pool.execute('INSERT IGNORE INTO store_settings (id, is_open) VALUES (1, 1)');
      const [again] = await pool.execute(
        'SELECT id, is_open, updated_at, updated_by FROM store_settings WHERE id = 1'
      );
      return again[0];
    }
    return rows[0];
  },

  /** Set status buka/tutup toko. */
  async setStatus(isOpen, updatedBy = null) {
    await pool.execute(
      'UPDATE store_settings SET is_open = ?, updated_by = ? WHERE id = 1',
      [isOpen ? 1 : 0, updatedBy]
    );
    return this.getStatus();
  },

  /** Cek apakah toko sedang buka. */
  async isOpen() {
    const status = await this.getStatus();
    return Boolean(status.is_open);
  },
};

module.exports = storeModel;