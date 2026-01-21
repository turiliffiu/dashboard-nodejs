require('dotenv').config();

// Valida environment variables PRIMA di tutto
const { validateEnv, showConfig } = require('./config/validateEnv');
validateEnv();

const app = require('./app');
const { testConnection } = require('./models');
const { logger } = require('./middleware/errorHandler');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Avvia server
 */
async function startServer() {
  try {
    // Test connessione database
    logger.info('Testing database connection...');
    await testConnection();

    // Avvia server
    app.listen(PORT, HOST, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 Dashboard API Server Started');
      logger.info('='.repeat(50));
      logger.info('Environment: ' + NODE_ENV);
      logger.info('Server running on: http://' + HOST + ':' + PORT);
      logger.info('Health check: http://' + HOST + ':' + PORT + '/health');
      logger.info('API docs: http://' + HOST + ':' + PORT + '/api');
      logger.info('='.repeat(50));
      
      // Mostra configurazione
      showConfig();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Gestione shutdown graceful
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Avvia server
startServer();
