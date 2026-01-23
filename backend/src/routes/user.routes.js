const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validateUpdateRole, validateUserId } = require('../middleware/validation');

/**
 * GET /api/users/me - Profilo utente corrente
 */
router.get('/me', authMiddleware, userController.getProfile);

/**
 * PUT /api/users/me - Aggiorna profilo utente corrente
 */

/**
 * PUT /api/users/me/password - Cambia password utente corrente
 */
router.put('/me/password', authMiddleware, userController.changePassword);
router.put('/me', authMiddleware, userController.updateProfile);

/**
 * GET /api/users - Lista tutti gli utenti (Admin only)
 */
router.get('/', authMiddleware, adminOnly, userController.getAll);

/**
 * POST /api/users - Crea nuovo utente (Admin only)
 */
router.post('/', authMiddleware, adminOnly, userController.create);

/**
 * GET /api/users/:id - Dettaglio utente (Admin only)
 */
router.get('/:id', authMiddleware, adminOnly, validateUserId, userController.getById);

/**
 * PATCH /api/users/:id/role - Aggiorna ruolo utente (Admin only)
 */
router.patch(
  '/:id/role',
  authMiddleware,
  adminOnly,
  validateUpdateRole,
  userController.updateRole
);

/**
 * PATCH /api/users/:id/active - Attiva/disattiva utente (Admin only)
 */
router.patch(
  '/:id/active',
  authMiddleware,
  adminOnly,
  validateUserId,
  userController.toggleActive
);

/**
 * DELETE /api/users/:id - Elimina utente (Admin only)
 */
router.delete(
  '/:id',
  authMiddleware,
  adminOnly,
  validateUserId,
  userController.delete
);

module.exports = router;
