const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware per gestire risultati validazione
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errori di validazione',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
};

/**
 * Validatori per Autenticazione
 */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Username deve essere tra 3 e 150 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username può contenere solo lettere, numeri e underscore'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve essere almeno 6 caratteri'),
  handleValidationErrors,
];

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username richiesto'),
  body('password')
    .notEmpty()
    .withMessage('Password richiesta'),
  handleValidationErrors,
];

/**
 * Validatori per Procedure
 */
const validateCreateProcedure = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve essere tra 3 e 100 caratteri'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icona troppo lunga (max 10 caratteri)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrizione troppo lunga (max 500 caratteri)'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic deve essere booleano'),
  handleValidationErrors,
];

const validateUpdateProcedure = [
  param('id')
    .isInt()
    .withMessage('ID procedura non valido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve essere tra 3 e 100 caratteri'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icona troppo lunga'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrizione troppo lunga'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic deve essere booleano'),
  handleValidationErrors,
];

const validateProcedureId = [
  param('id')
    .isInt()
    .withMessage('ID procedura non valido'),
  handleValidationErrors,
];

/**
 * Validatori per Utenti
 */
const validateUpdateRole = [
  param('id')
    .isInt()
    .withMessage('ID utente non valido'),
  body('role')
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Ruolo non valido'),
  handleValidationErrors,
];

const validateUserId = [
  param('id')
    .isInt()
    .withMessage('ID utente non valido'),
  handleValidationErrors,
];

/**
 * Validatori per Ricerca
 */
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Query di ricerca deve essere almeno 2 caratteri'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateProcedure,
  validateUpdateProcedure,
  validateProcedureId,
  validateUpdateRole,
  validateUserId,
  validateSearch,
};
