const paymentsModel = require('./paymentsModel');
const { AppError } = require('../../middleware/errorHandler');

const paymentsController = {
  /** GET /api/payments/unpaid-queue — antrean selesai belum bayar (kasir). */
  async getUnpaidQueue(req, res, next) {
    try {
      const entries = await paymentsModel.findUnpaidQueue();
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/payments — input pembayaran manual oleh kasir. */
  async createPayment(req, res, next) {
    try {
      const { queue_entry_id, amount, method, notes } = req.body;
      if (!queue_entry_id || !amount) {
        throw new AppError('queue_entry_id dan amount wajib diisi.', 400);
      }
      if (amount <= 0) {
        throw new AppError('Nominal pembayaran harus lebih dari 0.', 400);
      }

      const existing = await paymentsModel.findByQueueEntryId(queue_entry_id);
      if (existing) {
        throw new AppError(
          existing.status === 'paid'
            ? 'Antrean ini sudah lunas.'
            : 'Antrean ini sudah punya tagihan. Gunakan PUT /api/payments/:id/paid untuk menerima pembayaran.',
          409
        );
      }

      const payment = await paymentsModel.create({
        queue_entry_id, amount, method, notes,
      });

      res.status(201).json({
        success: true,
        message: 'Pembayaran berhasil.',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/payments/:id/paid — terima tagihan pending. */
  async settlePayment(req, res, next) {
    try {
      const payment = await paymentsModel.settle(req.params.id, {
        method: req.body.method,
        amount: req.body.amount,
      });
      if (!payment) {
        throw new AppError(
          'Pembayaran tidak ditemukan atau tidak berstatus pending.',
          404
        );
      }
      res.json({
        success: true,
        message: 'Pembayaran diterima.',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/payments — daftar pembayaran dengan filter. */
  async getPayments(req, res, next) {
    try {
      const filters = {
        method: req.query.method,
        status: req.query.status,
        date: req.query.date,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit,
      };
      const payments = await paymentsModel.findAll(filters);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/payments/:id — detail satu pembayaran. */
  async getPaymentById(req, res, next) {
    try {
      const payment = await paymentsModel.findById(req.params.id);
      if (!payment) throw new AppError('Pembayaran tidak ditemukan.', 404);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/payments/:id/refund — refund pembayaran. */
  async refundPayment(req, res, next) {
    try {
      const payment = await paymentsModel.refund(req.params.id);
      if (!payment) {
        throw new AppError(
          'Pembayaran tidak ditemukan atau belum berstatus paid.',
          404
        );
      }
      res.json({
        success: true,
        message: 'Refund berhasil.',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/payments/revenue/summary — ringkasan revenue. */
  async getRevenueSummary(req, res, next) {
    try {
      const filters = {
        date: req.query.date,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      };
      const summary = await paymentsModel.getRevenueSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = paymentsController;