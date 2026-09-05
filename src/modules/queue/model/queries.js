const { pool } = require('../../../config/db');
const { findRows, findById } = require('./helpers');
const { getBarberWorkload, entryEstimate } = require('./workload');

async function getBarbersOverview() {
  const [barbers] = await pool.execute(
    `SELECT id, name, avatar_url, is_available FROM users
     WHERE role = 'barber' AND is_active = TRUE
     ORDER BY name ASC`
  );

  const { servingCount, servingRemaining, waitingCount, waitingDuration, completedCount } =
    await getBarberWorkload(pool);

  return {
    barbers: barbers.map((barber) => {
      const waiting = waitingCount[barber.id] || 0;
      const serving = servingCount[barber.id] || 0;
      return {
        id: barber.id,
        name: barber.name,
        avatar_url: barber.avatar_url,
        is_available: barber.is_available,
        waiting_count: waiting,
        serving_count: serving,
        completed_count: completedCount[barber.id] || 0,
        total_queue: waiting + serving,
        estimated_wait_minutes:
          (servingRemaining[barber.id] || 0) + (waitingDuration[barber.id] || 0),
      };
    }),
  };
}

async function getById(id) {
  return findById(pool, id);
}

async function getTodayEntries() {
  return findRows(
    pool,
    `WHERE DATE(qe.check_in_time) = CURDATE()
     ORDER BY qe.id ASC`
  );
}

async function getBarberQueue(barberId) {
  const [barberRows] = await pool.execute(
    `SELECT id, name, avatar_url FROM users
     WHERE id = ? AND role = 'barber'`,
    [barberId]
  );
  if (barberRows.length === 0) return null;
  const barber = barberRows[0];

  const waiting = await findRows(
    pool,
    `WHERE qe.status = 'waiting'
       AND (qe.preferred_barber_id = ? OR qe.lane_type = 'free')
       AND DATE(qe.check_in_time) = CURDATE()
     ORDER BY qe.id ASC`,
    [barberId]
  );

  const serving = await findRows(
    pool,
    `WHERE qe.status = 'serving'
       AND qe.barber_id = ?
       AND DATE(qe.check_in_time) = CURDATE()
     ORDER BY qe.id ASC`,
    [barberId]
  );

  const [completedRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM queue_entries
     WHERE status = 'completed'
       AND barber_id = ?
       AND DATE(check_in_time) = CURDATE()`,
    [barberId]
  );

  return {
    barber,
    waiting_entries: waiting,
    serving_entries: serving,
    waiting_count: waiting.length,
    serving_count: serving.length,
    completed_count: completedRows[0]?.total || 0,
  };
}

async function checkMyQueue(phone) {
  const [rows] = await pool.execute(
    `SELECT id FROM queue_entries
     WHERE customer_phone = ? AND DATE(check_in_time) = CURDATE()
     ORDER BY id DESC
     LIMIT 1`,
    [phone]
  );
  if (rows.length === 0) return null;

  const entry = await findById(pool, rows[0].id);
  if (entry.status === 'waiting') {
    Object.assign(entry, await entryEstimate(pool, entry));
  }
  return entry;
}

/** Antrean menunggu di jalur barber, diurutkan antreannya. */
async function getWaitingLine(barberId) {
  const [rows] = await pool.execute(
    `SELECT qe.*, s.name AS service_name, s.duration_minutes, u.name AS barber_name
     FROM queue_entries qe
     JOIN services s ON qe.service_id = s.id
     LEFT JOIN users u ON qe.barber_id = u.id
     WHERE qe.status = 'waiting'
       AND (qe.preferred_barber_id = ? OR qe.lane_type = 'free')
       AND DATE(qe.check_in_time) = CURDATE()
     ORDER BY qe.id ASC`,
    [barberId]
  );
  return rows.map((row, index) => ({ ...row, position: index + 1 }));
}

module.exports = {
  getBarbersOverview,
  getById,
  getTodayEntries,
  getBarberQueue,
  checkMyQueue,
  getWaitingLine,
};