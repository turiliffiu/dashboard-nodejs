const express = require('express');
const router = express.Router();
const procedureController = require('../controllers/procedureController');
const { authMiddleware } = require('../middleware/auth');
const { editorOrAdmin } = require('../middleware/roleCheck');
const upload = require('../config/multer');
const {
  validateCreateProcedure,
  validateUpdateProcedure,
  validateProcedureId,
} = require('../middleware/validation');

/**
 * GET /api/procedures - Lista tutte le procedure
 */
router.get('/', authMiddleware, procedureController.getAll);

/**
 * GET /api/procedures/:id - Dettaglio procedura
 */
router.get('/:id', authMiddleware, validateProcedureId, procedureController.getById);

/**
 * POST /api/procedures - Crea nuova procedura
 * Requires: Admin o Editor
 * Multipart form data con file
 */
router.post(
  '/',
  authMiddleware,
  editorOrAdmin,
  upload.single('file'),
  validateCreateProcedure,
  procedureController.create
);

/**
 * PUT /api/procedures/:id - Aggiorna metadati procedura
 * Requires: Owner o Admin
 */
router.put(
  '/:id',
  authMiddleware,
  validateUpdateProcedure,
  procedureController.update
);

/**
 * PUT /api/procedures/:id/file - Aggiorna file procedura
 * Requires: Owner o Admin
 */
router.put(
  '/:id/file',
  authMiddleware,
  validateProcedureId,
  upload.single('file'),
  procedureController.updateFile
);

/**
 * DELETE /api/procedures/:id - Elimina procedura
 * Requires: Owner o Admin
 */
router.delete(
  '/:id',
  authMiddleware,
  validateProcedureId,
  procedureController.delete
);

/**
 * GET /api/procedures/:id/download - Download file procedura
 */
router.get(
  '/:id/download',
  authMiddleware,
  validateProcedureId,
  editorOrAdmin,
  procedureController.download
);

module.exports = router;
