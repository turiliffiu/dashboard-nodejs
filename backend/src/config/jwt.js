require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Algoritmo di firma
  algorithm: 'HS256',
  
  // Issuer
  issuer: 'dashboard-api',
  
  // Audience
  audience: 'dashboard-app',
};
