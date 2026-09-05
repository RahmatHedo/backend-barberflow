const { pool } = require('../../config/db');

const paymentsModel = {
  /** Antrean selesai yang belum lunas (untuk kasir). */
  async findUnpaidQueue() {
    const [rows] = await pool.execute(
      `SELECT qe.id, qe.queue_number, qe.customer_name, qe.end_time,
              s.name AS service_name, s.price,
              u.name AS barber_name
       FROM queue_entries qe
       JOIN services s ON qe.service_id = s.id
       LEFT JOIN users u ON qe.barber_id = u.id
       WHERE qe.status = 'completed'
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.queue_entry_id = qe.id AND p.status = 'paid'
         )
       ORDER BY qe.end_time DESC`
    );
    return rows;
  },

  /** Buat pembayaran (langsung berstatus paid). */
  async create(data) {
    const { queue_entry_id, amount, method = 'cash', notes = null } = data;
    const [result] = await pool.execute(
      `INSERT INTO payments (queue_entry_id, amount, method, status, notes, paid_at)
       VALUES (?, ?, ?, 'paid', ?, NOW())`,
      [queue_entry_id, amount, method, notes]
    );
    return this.findById(result.insertId);
  },

  /** Cari pembayaran terbaru milik suatu antrean (untuk cek duplikat). */
  async findByQueueEntryId(queueEntryId) {
    const [rows] = await pool.execute(
      `SELECT * FROM payments WHERE queue_entry_id = ? ORDER BY id DESC LIMIT 1`,
      [queueEntryId]
    );
    return rows[0] || null;
  },

  /** Terima pembayaran: pending -> paid (method/amount boleh diubah). */
  async settle(id, { method = null, amount = null }) {
    const sets = ["status = 'paid'", 'paid_at = NOW()'];
    const params = [];
    if (method) { sets.push('method = ?'); params.push(method); }
    if (amount != null && amount > 0) { sets.push('amount = ?'); params.push(amount); }

    const [result] = await pool.execute(
      `UPDATE payments SET ${sets.join(', ')} WHERE id = ? AND status = 'pending'`,
      [...params, id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  },

  /** Daftar pembayaran dengan filter opsional. */
  async findAll(filters = {}) {
    const conditions = [];
    const params = [];

    if (filters.method) { conditions.push('p.method = ?'); params.push(filters.method); }
    if (filters.status) { conditions.push('p.status = ?'); params.push(filters.status); }
    if (filters.date) { conditions.push('DATE(p.created_at) = ?'); params.push(filters.date); }
    if (filters.start_date) { conditions.push('DATE(p.created_at) >= ?'); params.push(filters.start_date); }
    if (filters.end_date) { conditions.push('DATE(p.created_at) <= ?'); params.push(filters.end_date); }

    let sql = `
      SELECT p.id, p.queue_entry_id, p.amount, p.method, p.status,
             p.notes, p.created_at, p.paid_at,
             qe.queue_number, qe.customer_name, s.name AS service_name
      FROM payments p
      JOIN queue_entries qe ON p.queue_entry_id = qe.id
      JOIN services s ON qe.service_id = s.id`;
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY p.created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(Number(filters.limit));
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /** Detail satu pembayaran beserta info antrean. */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.id, p.queue_entry_id, p.amount, p.method, p.status,
              p.notes, p.created_at, p.paid_at,
              qe.queue_number, qe.customer_name, s.name AS service_name
       FROM payments p
       JOIN queue_entries qe ON p.queue_entry_id = qe.id
       JOIN services s ON qe.service_id = s.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Refund pembayaran (hanya yang berstatus paid). */
  async refund(id) {
    const [result] = await pool.execute(
      `UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'paid'`,
      [id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  },

  /** Ringkasan revenue (total, per metode) untuk rentang waktu. */
  async getRevenueSummary(filters = {}) {
    const conditions = [];
    const params = [];
    if (filters.date) { conditions.push('DATE(created_at) = ?'); params.push(filters.date); }
    if (filters.start_date) { conditions.push('DATE(created_at) >= ?'); params.push(filters.start_date); }
    if (filters.end_date) { conditions.push('DATE(created_at) <= ?'); params.push(filters.end_date); }

    let sql = `
      SELECT COUNT(*) AS total_transactions,
             COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) AS total_revenue,
             COALESCE(SUM(CASE WHEN status='paid' AND method='cash' THEN amount ELSE 0 END),0) AS cash_revenue,
             COALESCE(SUM(CASE WHEN status='paid' AND method='qris' THEN amount ELSE 0 END),0) AS qris_revenue,
             COALESCE(SUM(CASE WHEN status='paid' AND method='e_wallet' THEN amount ELSE 0 END),0) AS e_wallet_revenue,
             COALESCE(SUM(CASE WHEN status='refunded' THEN amount ELSE 0 END),0) AS total_refunded
      FROM payments`;
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');

    const [rows] = await pool.execute(sql, params);
    return rows[0];
  },
};

module.exports = paymentsModel;