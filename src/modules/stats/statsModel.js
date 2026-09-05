const { pool } = require('../../config/db');

const statsModel = {
  /** Ringkasan pelanggan: total masuk & selesai. */
  async _period(connection, where) {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS served
       FROM queue_entries WHERE ${where}`
    );
    return {
      total: Number(rows[0]?.total || 0),
      served: Number(rows[0]?.served || 0),
    };
  },

  /** Ringkasan revenue dari tabel payments. */
  async _revenue(connection, where) {
    const [rows] = await connection.execute(
      `SELECT COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) AS total,
              COALESCE(SUM(CASE WHEN status='paid' AND method='cash' THEN amount ELSE 0 END),0) AS cash,
              COALESCE(SUM(CASE WHEN status='paid' AND method='qris' THEN amount ELSE 0 END),0) AS qris,
              COALESCE(SUM(CASE WHEN status='paid' AND method='e_wallet' THEN amount ELSE 0 END),0) AS e_wallet,
              COALESCE(SUM(CASE WHEN status='refunded' THEN amount ELSE 0 END),0) AS refunded
       FROM payments WHERE ${where}`
    );
    return {
      total: Number(rows[0]?.total || 0),
      cash: Number(rows[0]?.cash || 0),
      qris: Number(rows[0]?.qris || 0),
      e_wallet: Number(rows[0]?.e_wallet || 0),
      refunded: Number(rows[0]?.refunded || 0),
    };
  },

  async today() {
    const qWhere = 'DATE(check_in_time) = CURDATE()';
    const pWhere = 'DATE(created_at) = CURDATE()';
    const [queue, revenue] = await Promise.all([
      this._period(pool, qWhere),
      this._revenue(pool, pWhere),
    ]);
    return { ...queue, revenue };
  },

  async thisMonth() {
    const qWhere = 'YEAR(check_in_time)=YEAR(CURDATE()) AND MONTH(check_in_time)=MONTH(CURDATE())';
    const pWhere = 'YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())';
    const [queue, revenue] = await Promise.all([
      this._period(pool, qWhere),
      this._revenue(pool, pWhere),
    ]);
    return { ...queue, revenue };
  },

  async perBarber() {
    const [rows] = await pool.execute(
      `SELECT u.id AS barber_id, u.name AS barber_name,
              SUM(CASE WHEN DATE(qe.check_in_time)=CURDATE() AND qe.status='completed'
                       THEN 1 ELSE 0 END) AS today_cuts,
              SUM(CASE WHEN YEAR(qe.check_in_time)=YEAR(CURDATE())
                        AND MONTH(qe.check_in_time)=MONTH(CURDATE())
                        AND qe.status='completed'
                       THEN 1 ELSE 0 END) AS month_cuts
       FROM users u
       LEFT JOIN queue_entries qe ON qe.barber_id = u.id
       WHERE u.role='barber' AND u.is_active=TRUE
       GROUP BY u.id, u.name ORDER BY month_cuts DESC`
    );
    return rows.map((r) => ({
      barber_id: r.barber_id,
      barber_name: r.barber_name,
      today_cuts: Number(r.today_cuts || 0),
      month_cuts: Number(r.month_cuts || 0),
    }));
  },

  async dashboard() {
    const [today, month, barbers] = await Promise.all([
      this.today(), this.thisMonth(), this.perBarber(),
    ]);
    return { today, month, barbers };
  },
};

module.exports = statsModel;