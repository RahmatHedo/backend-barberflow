// ===========================================
// Barber Routes
// ===========================================

const express = require('express');
const router = express.Router();
const barberController = require('./barberController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { idParamSchema } = require('../../validations/common');

// Publik: pelanggan lihat estimasi waktu & total antrean tiap barber.
router.get('/', barberController.getBarbersOverview);

// Terproteksi: manajemen per barber.
router.get('/:id/queue', authenticateToken, authorizeRole('admin', 'barber'),
  validate(idParamSchema, 'params'), barberController.getBarberQueue);
router.put('/:id/next', authenticateToken, authorizeRole('admin', 'barber'),
  validate(idParamSchema, 'params'), barberController.callNext);
router.put('/:id/availability', authenticateToken, authorizeRole('admin', 'barber'),
  validate(idParamSchema, 'params'), barberController.toggleAvailability);

module.exports = router;