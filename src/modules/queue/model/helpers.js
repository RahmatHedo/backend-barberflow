const { pool } = require('../../../config/db');

const ENTRY_SELECT = `
  SELECT qe.*, s.name AS service_name, s.duration_minutes, s.price,
         u.name AS barber_name,
         pb.name AS preferred_barber_name, pb.avatar_url AS preferred_barber_avatar
  FROM queue_entries qe
  JOIN services s ON qe.service_id = s.id
  LEFT JOIN users u ON qe.barber_id = u.id
  LEFT JOIN users pb ON qe.preferred_barber_id = pb.id
`;

async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findRows(exec, where, params = [], limit = null) {
  const [rows] = await exec.execute(
    `${ENTRY_SELECT} ${where}${limit ? ` LIMIT ${limit}` : ''}`,
    params
  );
  return rows;
}

async function findById(exec, id) {
  const rows = await findRows(exec, 'WHERE qe.id = ?', [id], 1);
  return rows[0] || null;
}

async function nextQueueNumber(connection) {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) AS total FROM queue_entries WHERE DATE(check_in_time) = CURDATE()'
  );
  return String((rows[0]?.total || 0) + 1).padStart(3, '0');
}

module.exports = { ENTRY_SELECT, withTransaction, findRows, findById, nextQueueNumber };