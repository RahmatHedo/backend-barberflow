// ===========================================
// Queue Routes
// ===========================================

const express = require('express');
const router = express.Router();
const queueController = require('./queueController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { queueSchemas } = require('./queueSchemas');
const { idParamSchema, phoneQuerySchema } = require('../../validations/common');

// Publik: pelanggan masuk antrean & cek nomor antreannya sendiri.
router.post('/', validate(queueSchemas.joinQueue), queueController.joinQueue);
router.get('/check', validate(phoneQuerySchema, 'query'), queueController.checkMyQueue);

// Terproteksi: kelola antrean.
router.get('/today', authenticateToken, authorizeRole('admin', 'barber'),
  queueController.getTodayEntries);

// Transisi status antrean: body { action: 'complete'|'no-show'|'cancel' }
router.put('/:id', authenticateToken, authorizeRole('admin', 'barber'),
  validate(idParamSchema, 'params'), validate(queueSchemas.transitionAction),
  queueController.transitionEntry);

module.exports = router;