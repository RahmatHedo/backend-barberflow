async function findIdleBarbers(connection) {
  const [rows] = await connection.execute(
    `SELECT u.id, u.name
     FROM users u
     LEFT JOIN queue_entries qe
       ON qe.barber_id = u.id AND qe.status = 'serving'
     WHERE u.role = 'barber'
       AND u.is_active = TRUE
       AND u.is_available = TRUE
       AND qe.id IS NULL
     ORDER BY u.id ASC`
  );
  return rows;
}

async function getBarberWorkload(exec) {
  const [servingRows] = await exec.execute(
    `SELECT qe.barber_id, qe.start_time, s.duration_minutes
     FROM queue_entries qe
     JOIN services s ON qe.service_id = s.id
     WHERE qe.status = 'serving'
       AND DATE(qe.check_in_time) = CURDATE()
       AND qe.barber_id IS NOT NULL`
  );

  const [waitingRows] = await exec.execute(
    `SELECT qe.preferred_barber_id AS barber_id,
            COUNT(*) AS waiting_count,
            COALESCE(SUM(s.duration_minutes), 0) AS total_waiting_duration
     FROM queue_entries qe
     JOIN services s ON qe.service_id = s.id
     WHERE qe.status = 'waiting'
       AND DATE(qe.check_in_time) = CURDATE()
       AND qe.preferred_barber_id IS NOT NULL
     GROUP BY qe.preferred_barber_id`
  );

  const [completedRows] = await exec.execute(
    `SELECT barber_id, COUNT(*) AS completed_count
     FROM queue_entries
     WHERE status = 'completed'
       AND barber_id IS NOT NULL
       AND DATE(check_in_time) = CURDATE()
     GROUP BY barber_id`
  );

  const now = Date.now();
  const servingCount = {};
  const servingRemaining = {};
  for (const row of servingRows) {
    servingCount[row.barber_id] = (servingCount[row.barber_id] || 0) + 1;
    const elapsed = Math.max(0, Math.floor((now - new Date(row.start_time)) / 60000));
    servingRemaining[row.barber_id] = Math.max(0, row.duration_minutes - elapsed);
  }

  const waitingCount = {};
  const waitingDuration = {};
  for (const row of waitingRows) {
    waitingCount[row.barber_id] = row.waiting_count;
    waitingDuration[row.barber_id] = Number(row.total_waiting_duration);
  }

  const completedCount = {};
  for (const row of completedRows) {
    completedCount[row.barber_id] = Number(row.completed_count);
  }

  return { servingCount, servingRemaining, waitingCount, waitingDuration, completedCount };
}

async function findShortestWaitBarber(connection) {
  const [barbers] = await connection.execute(
    `SELECT id FROM users
     WHERE role = 'barber' AND is_active = TRUE AND is_available = TRUE`
  );
  if (barbers.length === 0) return null;

  const { servingRemaining, waitingDuration } = await getBarberWorkload(connection);

  let shortest = barbers[0].id;
  let minWait = Infinity;
  for (const barber of barbers) {
    const wait = (servingRemaining[barber.id] || 0) + (waitingDuration[barber.id] || 0);
    if (wait < minWait) {
      minWait = wait;
      shortest = barber.id;
    }
  }
  return shortest;
}

async function getAverageServiceDuration(exec) {
  const [rows] = await exec.execute(
    'SELECT AVG(duration_minutes) AS avg_duration FROM services WHERE is_active = TRUE'
  );
  return rows[0]?.avg_duration || 30;
}

async function entryEstimate(exec, entry) {
  let whereSQL;
  let params;
  if (entry.lane_type === 'request') {
    whereSQL = "status = 'waiting' AND (preferred_barber_id = ? OR lane_type = 'free') AND id < ?";
    params = [entry.preferred_barber_id, entry.id];
  } else {
    whereSQL = "status = 'waiting' AND lane_type = 'free' AND id < ?";
    params = [entry.id];
  }

  const [rows] = await exec.execute(
    `SELECT COUNT(*) AS ahead FROM queue_entries WHERE ${whereSQL}`,
    params
  );
  const position = rows[0]?.ahead + 1 || 1;
  const avg = await getAverageServiceDuration(exec);
  return {
    position,
    estimated_wait_minutes: Math.round(avg * (position - 1)),
  };
}

module.exports = {
  findIdleBarbers,
  getBarberWorkload,
  findShortestWaitBarber,
  getAverageServiceDuration,
  entryEstimate,
};