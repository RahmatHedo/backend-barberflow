const express = require('express');
const router = express.Router();
const paymentsController = require('./paymentsController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const paymentSchemas = require('./paymentSchemas');
const { idParamSchema } = require('../../validations/common');

// Kasir & admin: daftar antrean selesai yang belum dibayar.
router.get('/unpaid-queue', authenticateToken, authorizeRole('admin', 'barber'),
  paymentsController.getUnpaidQueue);

// Admin: ringkasan revenue (perlu sebelum /:id agar tidak tertangkap).
router.get('/revenue/summary', authenticateToken, authorizeRole('admin'),
  paymentsController.getRevenueSummary);

// Admin: CRUD pembayaran.
router.get('/', authenticateToken, authorizeRole('admin'),
  validate(paymentSchemas.listFilters, 'query'), paymentsController.getPayments);
router.get('/:id', authenticateToken, authorizeRole('admin'),
  validate(idParamSchema, 'params'), paymentsController.getPaymentById);
router.post('/', authenticateToken, authorizeRole('admin'),
  validate(paymentSchemas.create), paymentsController.createPayment);
router.put('/:id/paid', authenticateToken, authorizeRole('admin'),
  validate(idParamSchema, 'params'), validate(paymentSchemas.settle),
  paymentsController.settlePayment);
router.put('/:id/refund', authenticateToken, authorizeRole('admin'),
  validate(idParamSchema, 'params'), paymentsController.refundPayment);

module.exports = router;