const { User, UserProfile, ProcedureCategory } = require('../models');
const bcrypt = require('bcryptjs');

class UserController {
  /**
   * GET /api/users - Lista tutti gli utenti (solo admin)
   */
  async getAll(req, res, next) {
    try {
      const users = await User.findAll({
        include: [
          {
            model: UserProfile,
            as: 'profile',
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users - Crea nuovo utente (solo admin)
   */
  async create(req, res, next) {
    try {
      const { username, password, email, firstName, lastName, role } = req.body;

      // Validazione campi obbligatori
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username e password sono obbligatori',
        });
      }

      // Verifica se username già esistente
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username già esistente',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crea utente
      const user = await User.create({
        username,
        password: hashedPassword,
        email: email || null,
        firstName: firstName || '',
        lastName: lastName || '',
        isActive: true,
      });

      // Crea profilo con ruolo
      await UserProfile.create({
        userId: user.id,
        role: role || 'viewer',
      });

      // Ricarica user con profilo
      const createdUser = await User.findByPk(user.id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      res.status(201).json({
        success: true,
        message: `Utente ${username} creato con successo`,
        data: createdUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id - Dettaglio utente (solo admin)
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: UserProfile,
            as: 'profile',
          },
          {
            model: ProcedureCategory,
            as: 'procedures',
            attributes: ['id', 'name', 'icon'],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me - Profilo utente corrente
   */
  async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.userId, {
        include: [
          {
            model: UserProfile,
            as: 'profile',
          },
          {
            model: ProcedureCategory,
            as: 'procedures',
            attributes: ['id', 'name', 'icon'],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/me - Aggiorna profilo utente corrente
   */
  async updateProfile(req, res, next) {
    try {
      const { email, firstName, lastName } = req.body;

      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      // Aggiorna campi
      if (email !== undefined) user.email = email;
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;

      await user.save();

      // Ricarica con profilo
      const updatedUser = await User.findByPk(user.id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/role - Aggiorna ruolo utente (solo admin)
   */
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      // Non permettere di modificare il proprio ruolo
      if (parseInt(id, 10) === req.userId) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi modificare il tuo stesso ruolo',
        });
      }

      // Non permettere di modificare superuser
      if (user.isSuperuser) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi modificare un superuser',
        });
      }

      // Aggiorna ruolo nel profilo
      if (user.profile) {
        user.profile.role = role;
        await user.profile.save();
      } else {
        // Crea profilo se non esiste
        await UserProfile.create({
          userId: user.id,
          role,
        });
      }

      // Ricarica user con profilo
      const updatedUser = await User.findByPk(id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      res.json({
        success: true,
        message: `Ruolo di ${user.username} aggiornato a ${role}`,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/active - Attiva/disattiva utente (solo admin)
   */
  async toggleActive(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [{ model: UserProfile, as: 'profile' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      // Non permettere di disattivare se stesso
      if (parseInt(id, 10) === req.userId) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi disattivare il tuo stesso account',
        });
      }

      // Non permettere di disattivare superuser
      if (user.isSuperuser) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi disattivare un superuser',
        });
      }

      // Toggle active
      user.isActive = !user.isActive;
      await user.save();

      const status = user.isActive ? 'attivato' : 'disattivato';

      res.json({
        success: true,
        message: `Utente ${user.username} ${status}`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id - Elimina utente (solo admin)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato',
        });
      }

      // Non permettere di eliminare se stesso
      if (parseInt(id, 10) === req.userId) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi eliminare il tuo stesso account',
        });
      }

      // Non permettere di eliminare superuser
      if (user.isSuperuser) {
        return res.status(400).json({
          success: false,
          error: 'Non puoi eliminare un superuser',
        });
      }

      const username = user.username;
      await user.destroy();

      res.json({
        success: true,
        message: `Utente ${username} eliminato con successo`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
