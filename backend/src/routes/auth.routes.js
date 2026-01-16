const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

/**
 * POST /api/auth/register - Registrazione nuovo utente
 */
router.post('/register', validateRegister, authController.register);

/**
 * POST /api/auth/login - Login utente
 */
router.post('/login', validateLogin, authController.login);

/**
 * POST /api/auth/refresh - Refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout - Logout utente
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * GET /api/auth/me - Informazioni utente corrente
 */
router.get('/me', authMiddleware, authController.me);

module.exports = router;
