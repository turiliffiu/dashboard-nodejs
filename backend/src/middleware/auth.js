const jwt = require('jsonwebtoken');
const { User, UserProfile } = require('../models');
const jwtConfig = require('../config/jwt');

/**
 * Middleware per verificare il token JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Estrai token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token non fornito',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifica token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Carica utente dal database
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disattivato',
      });
    }

    // Aggiungi utente alla request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.profile ? user.profile.role : 'viewer';

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token non valido',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Errore nella verifica del token',
    });
  }
};

/**
 * Middleware opzionale - non fallisce se token mancante
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findByPk(decoded.id, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.profile ? user.profile.role : 'viewer';
    }

    next();
  } catch (error) {
    // Ignora errori e continua senza user
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
};
