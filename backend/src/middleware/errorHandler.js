const winston = require('winston');

// Configurazione logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// In production, aggiungi file transport
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

/**
 * Middleware per gestire errori Sequelize
 */
const handleSequelizeError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    return {
      status: 400,
      message: 'Errore di validazione',
      errors: error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    };
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      status: 409,
      message: 'Risorsa già esistente',
      errors: error.errors.map((e) => ({
        field: e.path,
        message: `${e.path} già in uso`,
      })),
    };
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return {
      status: 400,
      message: 'Violazione vincolo foreign key',
    };
  }

  return null;
};

/**
 * Middleware principale per gestione errori
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Gestisci errori Sequelize
  const sequelizeError = handleSequelizeError(err);
  if (sequelizeError) {
    return res.status(sequelizeError.status).json({
      success: false,
      error: sequelizeError.message,
      errors: sequelizeError.errors,
    });
  }

  // Gestisci errori Multer (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File troppo grande',
        maxSize: '10MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Errore nel caricamento del file',
    });
  }

  // Errori custom con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Errore generico 500
  const isDevelopment = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: 'Errore interno del server',
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * Middleware per route non trovate (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    path: req.originalUrl,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  logger,
};
