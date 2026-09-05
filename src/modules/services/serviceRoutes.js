// ===========================================
// Service Routes
// ===========================================

const express = require('express');
const router = express.Router();
const serviceController = require('./serviceController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { serviceSchemas } = require('./serviceSchemas');
const { idParamSchema } = require('../../validations/common');

// Public routes — customers view active services
router.get('/', serviceController.getServices);

// Admin-only routes — full service management
router.get('/all', authenticateToken, authorizeRole('admin'), serviceController.getAllServices);
router.post('/', authenticateToken, authorizeRole('admin'),
  validate(serviceSchemas.create), serviceController.createService);
router.put('/:id', authenticateToken, authorizeRole('admin'),
  validate(idParamSchema, 'params'), validate(serviceSchemas.update), serviceController.updateService);
router.delete('/:id', authenticateToken, authorizeRole('admin'),
  validate(idParamSchema, 'params'), serviceController.deleteService);

module.exports = router;