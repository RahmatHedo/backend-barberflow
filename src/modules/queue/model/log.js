const ACTIONS = ['joined', 'called', 'completed', 'cancelled', 'no_show'];

/** Simpan audit log aksi antrean. Gunakan koneksi transaksi bila perlu. */
async function logAction(exec, { queueEntryId, action, performedBy = null, notes = null }) {
  if (!ACTIONS.includes(action)) return;
  await exec.execute(
    `INSERT INTO queue_logs (queue_entry_id, action, performed_by, notes, performed_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [queueEntryId, action, performedBy, notes]
  );
}

module.exports = { logAction };