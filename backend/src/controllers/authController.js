const jwt = require('jsonwebtoken');
const { User, UserProfile } = require('../models');
const jwtConfig = require('../config/jwt');

/**
 * Genera JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.profile ? user.profile.role : 'viewer',
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }
  );
};

/**
 * Genera refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }
  );
};

class AuthController {
  /**
   * POST /api/auth/register - Registrazione nuovo utente
   */
  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Verifica se username esiste già
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Username già esistente',
        });
      }

      // Verifica se email esiste già
      if (email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: 'Email già registrata',
          });
        }
      }

      // Crea utente
      const user = await User.create({
        username,
        email,
        password, // Verrà hashata automaticamente da hook beforeCreate
        firstName,
        lastName,
      });

      // Crea profilo con ruolo viewer di default
      await UserProfile.create({
        userId: user.id,
        role: 'viewer',
      });

      // Ricarica utente con profilo
      const userWithProfile = await User.findByPk(user.id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      // Genera tokens
      const token = generateToken(userWithProfile);
      const refreshToken = generateRefreshToken(userWithProfile);

      res.status(201).json({
        success: true,
        message: 'Registrazione completata con successo',
        data: {
          token,
          refreshToken,
          user: userWithProfile.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login - Login utente
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Trova utente
      const user = await User.findOne({
        where: { username },
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenziali non valide',
        });
      }

      // Verifica password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Credenziali non valide',
        });
      }

      // Verifica account attivo
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account disattivato',
        });
      }

      // Aggiorna last login
      user.lastLogin = new Date();
      await user.save();

      // Genera tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        message: `Benvenuto, ${user.username}!`,
        data: {
          token,
          refreshToken,
          user: user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh - Refresh token
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token non fornito',
        });
      }

      // Verifica refresh token
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);

      // Carica utente
      const user = await User.findByPk(decoded.id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Utente non valido',
        });
      }

      // Genera nuovo access token
      const newToken = generateToken(user);

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token scaduto',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token non valido',
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/logout - Logout utente
   * (Client-side: rimuove token da localStorage)
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout effettuato con successo',
    });
  }

  /**
   * GET /api/auth/me - Informazioni utente corrente
   */
  async me(req, res, next) {
    try {
      const user = await User.findByPk(req.userId, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      res.json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
