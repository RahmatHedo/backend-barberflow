const queueModel = require('../queue/model');
const whatsappService = require('../../services/whatsappService');
const { AppError } = require('../../middleware/errorHandler');
const { pool } = require('../../config/db');

const REMIND_POSITION = 3;

/** Kirim WA pengingat ke pelanggan yang tinggal 2 antrean lagi. */
async function sendTwoAheadReminder(barberId) {
  try {
    const line = await queueModel.getWaitingLine(barberId);
    const next = line.find((entry) => entry.position === REMIND_POSITION);
    if (next) {
      whatsappService.sendQueueReminder(next.customer_phone, next.customer_name, REMIND_POSITION - 1);
    }
  } catch (error) {
    console.error('❌ Gagal kirim reminder:', error.message);
  }
}

const barberController = {

  /**
   * GET /api/barbers — gambaran antrean tiap barber (publik):
   * jumlah antrean, yang sedang dilayani, dan estimasi waktu tunggu.
   */
  async getBarbersOverview(req, res, next) {
    try {
      const data = await queueModel.getBarbersOverview();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/barbers/:id/queue — antrean milik satu barber (admin/barber):
   * siapa menunggu, siapa sedang dilayani, dan total sudah dipotong.
   */
  async getBarberQueue(req, res, next) {
    try {
      const barberId = parseInt(req.params.id);
      const data = await queueModel.getBarberQueue(barberId);

      if (!data) throw new AppError('Barber tidak ditemukan.', 404);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/barbers/:id/next — panggil pelanggan berikutnya di jalur barber.
   */
  async callNext(req, res, next) {
    try {
      const barberId = parseInt(req.params.id);

      if (req.user.role === 'barber' && req.user.id !== barberId) {
        throw new AppError('Barber hanya bisa memanggil untuk dirinya sendiri.', 403);
      }

      const entry = await queueModel.callNextForBarber(barberId);

      if (!entry) {
        throw new AppError('Tidak ada pelanggan yang menunggu.', 404);
      }

      whatsappService.sendQueueCalled(entry.customer_phone, entry.customer_name);
      await sendTwoAheadReminder(barberId);

      res.json({
        success: true,
        message: `Memanggil ${entry.customer_name} (${entry.queue_number}).`,
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/barbers/:id/availability — atur status aktif/istirahat.
   * Selalu pastikan minimal 1 barber aktif.
   */
  async toggleAvailability(req, res, next) {
    try {
      const barberId = parseInt(req.params.id);

      if (req.user.role === 'barber' && req.user.id !== barberId) {
        throw new AppError('Anda hanya bisa mengubah status Anda sendiri.', 403);
      }

      const [rows] = await pool.execute(
        'SELECT is_available FROM users WHERE id = ? AND role = ?',
        [barberId, 'barber']
      );

      if (rows.length === 0) throw new AppError('Barber tidak ditemukan.', 404);

      const newStatus = rows[0].is_available ? 0 : 1;

      if (newStatus === 0) {
        const [activeBarbers] = await pool.execute(
          `SELECT COUNT(*) AS active_count FROM users
           WHERE role = 'barber' AND is_active = TRUE AND is_available = TRUE AND id != ?`,
          [barberId]
        );
        if (activeBarbers[0].active_count === 0) {
          throw new AppError(
            'Tidak bisa istirahat! Harus ada minimal 1 barber aktif. Minta rekan barber lain aktif dulu.',
            400
          );
        }
      }

      await pool.execute('UPDATE users SET is_available = ? WHERE id = ?', [newStatus, barberId]);

      res.json({
        success: true,
        message: newStatus ? 'Status: Aktif' : 'Status: Istirahat',
        data: { is_available: Boolean(newStatus) },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = barberController;