const { withTransaction, findById, nextQueueNumber } = require('./helpers');
const { findIdleBarbers, findShortestWaitBarber, entryEstimate } = require('./workload');
const { logAction } = require('./log');
const storeModel = require('../../store/storeModel');

async function joinQueue(data) {
  const {
    customer_name,
    customer_phone,
    service_id,
    preferred_barber_id = null,
    notes = null,
  } = data;

  if (!(await storeModel.isOpen())) return { storeClosed: true };

  return withTransaction(async (connection) => {
    const [svcRows] = await connection.execute(
      'SELECT id, price FROM services WHERE id = ? AND is_active = TRUE',
      [service_id]
    );
    if (svcRows.length === 0) return { serviceMissing: true };

    let assignedBarberId = null;
    let finalPreferred = preferred_barber_id ? Number(preferred_barber_id) : null;
    let finalStatus = 'waiting';
    let calledTime = null;
    let startTime = null;
    const laneType = finalPreferred ? 'request' : 'free';

    const idleBarbers = await findIdleBarbers(connection);

    if (finalPreferred) {
      if (idleBarbers.some((b) => b.id === finalPreferred)) {
        assignedBarberId = finalPreferred;
        finalStatus = 'serving';
        calledTime = new Date();
        startTime = new Date();
      }
    } else if (idleBarbers.length > 0) {
      assignedBarberId = idleBarbers[0].id;
      finalPreferred = idleBarbers[0].id;
      finalStatus = 'serving';
      calledTime = new Date();
      startTime = new Date();
    } else {
      finalPreferred = await findShortestWaitBarber(connection);
    }

    const queueNumber = await nextQueueNumber(connection);

    const [insertResult] = await connection.execute(
      `INSERT INTO queue_entries
       (queue_number, customer_name, customer_phone, service_id, barber_id,
        preferred_barber_id, lane_type, status, notes, called_time, start_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queueNumber, customer_name, customer_phone, service_id, assignedBarberId,
        finalPreferred, laneType, finalStatus, notes, calledTime, startTime,
      ]
    );

    const entry = await findById(connection, insertResult.insertId);

    await logAction(connection, {
      queueEntryId: entry.id,
      action: entry.status === 'serving' ? 'called' : 'joined',
      notes: entry.status === 'serving' ? 'langsung dilayani (barber idle)' : null,
    });

    // Tagihan otomatis dibuat saat join (status pending, kasir tinggal "paid").
    await connection.execute(
      `INSERT INTO payments (queue_entry_id, amount, method, status, notes)
       VALUES (?, ?, 'cash', 'pending', ?)`,
      [entry.id, svcRows[0].price, 'Tagihan dibuat saat pendaftaran antrean.']
    );

    if (entry.status === 'waiting') {
      Object.assign(entry, await entryEstimate(connection, entry));
    } else {
      entry.position = 0;
      entry.estimated_wait_minutes = 0;
    }

    return { entry };
  });
}

module.exports = { joinQueue };