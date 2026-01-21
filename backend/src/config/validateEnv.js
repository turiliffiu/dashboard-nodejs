/**
 * Environment Variables Validation
 * Verifica che tutte le variabili d'ambiente richieste siano presenti
 */

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN'
];

const optionalEnvVars = [
  'FRONTEND_URL',
  'ALLOWED_ORIGINS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'MAX_FILE_SIZE',
  'LOG_LEVEL'
];

function validateEnv() {
  console.log('🔍 Validating environment variables...');

  const missing = [];
  const warnings = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error('   - ' + varName);
    });
    console.error('\nPlease check your .env file.');
    throw new Error('Missing required environment variables');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Optional variables not set (using defaults):');
    warnings.forEach(varName => {
      console.warn('   - ' + varName);
    });
  }

  validateSpecificVars();
  console.log('✅ Environment validation passed');
}

function validateSpecificVars() {
  const validNodeEnvs = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV must be: development, production, or test');
  }

  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be valid (1-65535)');
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }

  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be PostgreSQL connection string');
  }
}

function showConfig() {
  console.log('\n📋 Configuration:');
  console.log('   Environment: ' + process.env.NODE_ENV);
  console.log('   Port: ' + process.env.PORT);
  console.log('   Database: ' + process.env.DB_NAME);
  console.log('   Frontend URL: ' + (process.env.FRONTEND_URL || 'not set'));
  console.log('   Log Level: ' + (process.env.LOG_LEVEL || 'info (default)'));
  console.log('');
}

module.exports = {
  validateEnv,
  showConfig
};
