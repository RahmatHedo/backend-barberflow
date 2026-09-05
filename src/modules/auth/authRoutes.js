const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticateToken } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { authSchemas } = require('./authSchemas');

router.post('/login', validate(authSchemas.login), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/me', authenticateToken, authController.getMe);

module.exports = router;