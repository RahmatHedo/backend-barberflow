const queueModel = require('./model');
const whatsappService = require('../../services/whatsappService');
const { AppError } = require('../../middleware/errorHandler');

const queueController = {

  /**
   * POST /api/queue — pelanggan masuk antrean (publik).
   * Pilihan pelanggan (preferred_barber_id / free) menentukan jalur.
   */
  async joinQueue(req, res, next) {
    try {
      const result = await queueModel.joinQueue(req.body);

      if (result.storeClosed) {
        throw new AppError('Mohon maaf, toko sedang tutup. Silakan datang kembali di jam buka.', 503);
      }
      if (result.serviceMissing) {
        throw new AppError('Layanan tidak ditemukan atau nonaktif.', 400);
      }

      const { entry } = result;

      if (entry.status === 'serving') {
        whatsappService.sendQueueCalled(entry.customer_phone, entry.customer_name);
      } else {
        whatsappService.sendQueueConfirmation(
          entry.customer_phone,
          entry.customer_name,
          entry.queue_number,
          entry.position,
          entry.estimated_wait_minutes
        );
      }

      res.status(201).json({
        success: true,
        message: 'Berhasil masuk antrean.',
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/queue/check?phone=... — pelanggan cek nomor antreannya sendiri.
   * Hanya entry milik nomor tersebut yang dikembalikan.
   */
  async checkMyQueue(req, res, next) {
    try {
      const entry = await queueModel.checkMyQueue(req.query.phone);

      if (!entry) {
        throw new AppError('Tidak ada antrean untuk nomor ini hari ini.', 404);
      }

      res.json({
        success: true,
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/queue/today — semua antrean hari ini + statusnya (admin).
   */
  async getTodayEntries(req, res, next) {
    try {
      const entries = await queueModel.getTodayEntries();

      res.json({
        success: true,
        data: { entries },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/queue/:id — transisi status antrean (admin/barber).
   * Body: { action: 'complete' | 'no-show' | 'cancel' }
   */
  async transitionEntry(req, res, next) {
    try {
      const { action } = req.body;
      const entryId = req.params.id;

      let result;
      const performedBy = req.user ? req.user.id : null;
      switch (action) {
        case 'complete':
          result = await queueModel.completeService(entryId, performedBy);
          break;
        case 'no-show':
          result = await queueModel.markNoShow(entryId, performedBy);
          break;
        case 'cancel':
          result = await queueModel.cancelEntry(entryId, performedBy);
          break;
      }

      if (result.notFound) throw new AppError('Antrean tidak ditemukan.', 404);
      if (result.invalidStatus) {
        throw new AppError(
          action === 'complete'
            ? 'Hanya antrean berstatus serving yang bisa diselesaikan.'
            : 'Entry tidak bisa diproses dengan status ini.',
          400
        );
      }

      const messages = {
        complete: 'Layanan selesai.',
        'no-show': 'Pelanggan ditandai tidak hadir.',
        cancel: 'Antrean dibatalkan.',
      };

      res.json({
        success: true,
        message: messages[action],
        data: { entry: result.entry },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = queueController;