const express = require('express');
const router = express.Router();
const storeController = require('./storeController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.get('/status', storeController.getStatus);
router.put('/status', authenticateToken, authorizeRole('admin'), storeController.setStatus);

module.exports = router;