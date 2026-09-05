const express = require('express');
const router = express.Router();
const statsController = require('./statsController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeRole('admin'), statsController.getDashboard);
router.get('/today', authenticateToken, authorizeRole('admin'), statsController.getToday);
router.get('/month', authenticateToken, authorizeRole('admin'), statsController.getMonth);
router.get('/barbers', authenticateToken, authorizeRole('admin'), statsController.getBarbers);

module.exports = router;