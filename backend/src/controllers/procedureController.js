const { ProcedureCategory, User, UserProfile } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { parseFile } = require('../utils/parser');

class ProcedureController {
  /**
   * GET /api/procedures - Lista tutte le procedure
   */
  async getAll(req, res, next) {
    try {
      const userId = req.userId;
      const userRole = req.userRole;

      // Admin vede tutto, altri vedono pubbliche o proprie
      let whereClause = {};
      if (userRole !== 'admin' && !req.user.isSuperuser) {
        whereClause = {
          [Op.or]: [{ isPublic: true }, { ownerId: userId }],
        };
      }

      const procedures = await ProcedureCategory.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'firstName', 'lastName'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['role'],
              },
            ],
          },
        ],
        order: [
          ['order', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      // Aggiungi permessi per ogni procedura
      const proceduresWithPermissions = procedures.map((proc) => ({
        ...proc.toJSON(),
        canEdit: proc.canUserEdit(req.user),
        canDelete: proc.canUserDelete(req.user),
      }));

      res.json({
        success: true,
        data: proceduresWithPermissions,
        total: proceduresWithPermissions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/procedures/:id - Dettaglio procedura con contenuto file
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const procedure = await ProcedureCategory.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      if (!procedure) {
        return res.status(404).json({
          success: false,
          error: 'Procedura non trovata',
        });
      }

      // Verifica permessi visualizzazione
      if (!procedure.canUserView(req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Accesso negato',
        });
      }

      // Leggi e parsa il file
      const filePath = path.join(__dirname, '../uploads/procedures', procedure.filename);
      
      let sections = [];
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        sections = parseFile(fileContent);
      } catch (error) {
        console.error('Error reading procedure file:', error);
        // Se file non trovato, ritorna procedura senza sezioni
      }

      res.json({
        success: true,
        data: {
          ...procedure.toJSON(),
          sections,
          canEdit: procedure.canUserEdit(req.user),
          canDelete: procedure.canUserDelete(req.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/procedures - Crea nuova procedura
   */
  async create(req, res, next) {
    try {
      const { name, icon, description, isPublic } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'File non fornito',
        });
      }

      // Verifica che il file non sia vuoto
      const stats = await fs.stat(file.path);
      if (stats.size === 0) {
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          error: 'File vuoto',
        });
      }

      // Crea procedura
      const procedure = await ProcedureCategory.create({
        name,
        icon: icon || '📄',
        description,
        filename: file.filename,
        ownerId: req.userId,
        isPublic: isPublic !== undefined ? isPublic : true,
        order: 0,
      });

      // Ricarica con owner
      const procedureWithOwner = await ProcedureCategory.findByPk(procedure.id, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
      });

      res.status(201).json({
        success: true,
        message: 'Procedura creata con successo',
        data: procedureWithOwner,
      });
    } catch (error) {
      // Elimina file se creazione fallisce
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      next(error);
    }
  }

  /**
   * PUT /api/procedures/:id - Aggiorna procedura (metadati)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, icon, description, isPublic, order } = req.body;

      const procedure = await ProcedureCategory.findByPk(id);

      if (!procedure) {
        return res.status(404).json({
          success: false,
          error: 'Procedura non trovata',
        });
      }

      // Verifica permessi
      if (!procedure.canUserEdit(req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Permessi insufficienti',
        });
      }

      // Aggiorna campi forniti
      if (name !== undefined) procedure.name = name;
      if (icon !== undefined) procedure.icon = icon;
      if (description !== undefined) procedure.description = description;
      if (isPublic !== undefined) procedure.isPublic = isPublic;
      if (order !== undefined) procedure.order = order;

      await procedure.save();

      // Ricarica con owner
      const updatedProcedure = await ProcedureCategory.findByPk(id, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
      });

      res.json({
        success: true,
        message: 'Procedura aggiornata con successo',
        data: updatedProcedure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/procedures/:id/file - Aggiorna file procedura
   */
  async updateFile(req, res, next) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'File non fornito',
        });
      }

      const procedure = await ProcedureCategory.findByPk(id);

      if (!procedure) {
        await fs.unlink(file.path);
        return res.status(404).json({
          success: false,
          error: 'Procedura non trovata',
        });
      }

      // Verifica permessi
      if (!procedure.canUserEdit(req.user)) {
        await fs.unlink(file.path);
        return res.status(403).json({
          success: false,
          error: 'Permessi insufficienti',
        });
      }

      // Elimina vecchio file
      const oldFilePath = path.join(__dirname, '../uploads/procedures', procedure.filename);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old file:', error);
      }

      // Aggiorna filename
      procedure.filename = file.filename;
      await procedure.save();

      res.json({
        success: true,
        message: 'File aggiornato con successo',
        data: procedure,
      });
    } catch (error) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      next(error);
    }
  }

  /**
   * DELETE /api/procedures/:id - Elimina procedura
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const procedure = await ProcedureCategory.findByPk(id);

      if (!procedure) {
        return res.status(404).json({
          success: false,
          error: 'Procedura non trovata',
        });
      }

      // Verifica permessi
      if (!procedure.canUserDelete(req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Permessi insufficienti',
        });
      }

      // Elimina file
      const filePath = path.join(__dirname, '../uploads/procedures', procedure.filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }

      // Elimina procedura
      await procedure.destroy();

      res.json({
        success: true,
        message: 'Procedura eliminata con successo',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/procedures/:id/download - Download file procedura
   */
  async download(req, res, next) {
    try {
      const { id } = req.params;

      const procedure = await ProcedureCategory.findByPk(id);

      if (!procedure) {
        return res.status(404).json({
          success: false,
          error: 'Procedura non trovata',
        });
      }

      // Verifica permessi visualizzazione
      if (!procedure.canUserView(req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Accesso negato',
        });
      }

      const filePath = path.join(__dirname, '../uploads/procedures', procedure.filename);

      // Verifica esistenza file
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'File non trovato',
        });
      }

      // Imposta headers per download
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${procedure.filename}"`);

      // Stream file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProcedureController();
