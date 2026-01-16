const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authMiddleware } = require('../middleware/auth');
const { validateSearch } = require('../middleware/validation');

/**
 * GET /api/search?q=<query> - Ricerca full-text
 */
router.get('/', authMiddleware, validateSearch, searchController.search);

module.exports = router;
