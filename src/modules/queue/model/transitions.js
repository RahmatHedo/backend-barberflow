const { withTransaction, findById } = require('./helpers');
const { logAction } = require('./log');

const STATEFUL_ACTIONS = ['waiting', 'serving'];

async function callNextForBarber(barberId) {
  return withTransaction(async (connection) => {
    const [candidates] = await connection.execute(
      `SELECT id FROM queue_entries
       WHERE status = 'waiting'
         AND (preferred_barber_id = ? OR lane_type = 'free')
         AND DATE(check_in_time) = CURDATE()
       ORDER BY id ASC
       LIMIT 1`,
      [barberId]
    );

    if (candidates.length === 0) return null;

    const entryId = candidates[0].id;
    await connection.execute(
      `UPDATE queue_entries
       SET status = 'serving', barber_id = ?, called_time = NOW(), start_time = NOW()
       WHERE id = ?`,
      [barberId, entryId]
    );

    await logAction(connection, { queueEntryId: entryId, action: 'called', performedBy: barberId });

    return findById(connection, entryId);
  });
}

async function validateStateful(connection, entryId, allowed = STATEFUL_ACTIONS) {
  const [rows] = await connection.execute(
    'SELECT id, status FROM queue_entries WHERE id = ? LIMIT 1',
    [entryId]
  );
  if (rows.length === 0) return { notFound: true };
  if (!allowed.includes(rows[0].status)) return { invalidStatus: true };
  return {};
}

async function transition(entryId, newStatus, allowed, action, performedBy = null) {
  return withTransaction(async (connection) => {
    const check = await validateStateful(connection, entryId, allowed);
    if (check.notFound) return { notFound: true };
    if (check.invalidStatus) return { invalidStatus: true };

    await connection.execute(
      `UPDATE queue_entries SET status = ?, end_time = NOW() WHERE id = ?`,
      [newStatus, entryId]
    );

    await logAction(connection, { queueEntryId: entryId, action, performedBy });

    return { entry: await findById(connection, entryId) };
  });
}

async function completeService(entryId, performedBy = null) {
  return transition(entryId, 'completed', ['serving'], 'completed', performedBy);
}

async function markNoShow(entryId, performedBy = null) {
  return transition(entryId, 'no_show', STATEFUL_ACTIONS, 'no_show', performedBy);
}

async function cancelEntry(entryId, performedBy = null) {
  return transition(entryId, 'cancelled', STATEFUL_ACTIONS, 'cancelled', performedBy);
}

module.exports = { callNextForBarber, completeService, markNoShow, cancelEntry };