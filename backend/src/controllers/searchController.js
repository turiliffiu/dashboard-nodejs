const { ProcedureCategory, User } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { parseFile, highlightText } = require('../utils/parser');

class SearchController {
  /**
   * GET /api/search?q=<query> - Ricerca full-text nelle procedure
   */
  async search(req, res, next) {
    try {
      const { q: query } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Query troppo corta (minimo 2 caratteri)',
        });
      }

      const userId = req.userId;
      const userRole = req.userRole;

      // Determina quali categorie l'utente può vedere
      let whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      };

      // Se non admin, filtra per pubbliche o proprie
      if (userRole !== 'admin' && !req.user.isSuperuser) {
        whereClause = {
          [Op.and]: [
            whereClause,
            {
              [Op.or]: [{ isPublic: true }, { ownerId: userId }],
            },
          ],
        };
      }

      // Cerca nelle categorie (metadati)
      const matchingCategories = await ProcedureCategory.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'username'],
          },
        ],
      });

      const results = [];

      // Aggiungi risultati da metadati
      matchingCategories.forEach((cat) => {
        results.push({
          type: 'category',
          categoryId: cat.id,
          categoryName: highlightText(cat.name, query),
          icon: cat.icon,
          description: highlightText(cat.description, query),
          matchType: 'metadata',
          owner: cat.owner ? cat.owner.username : null,
        });
      });

      // Cerca tutte le categorie per controllare contenuto file
      let allCategories;
      if (userRole === 'admin' || req.user.isSuperuser) {
        allCategories = await ProcedureCategory.findAll({
          include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
        });
      } else {
        allCategories = await ProcedureCategory.findAll({
          where: {
            [Op.or]: [{ isPublic: true }, { ownerId: userId }],
          },
          include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
        });
      }

      // Cerca nei contenuti dei file
      for (const cat of allCategories) {
        try {
          const filePath = path.join(__dirname, '../uploads/procedures', cat.filename);
          const fileContent = await fs.readFile(filePath, 'utf-8');

          // Cerca nel contenuto
          if (fileContent.toLowerCase().includes(query.toLowerCase())) {
            // Parsa file per trovare sezioni match
            const sections = parseFile(fileContent);
            const matchingSections = [];

            for (const section of sections) {
              const sectionMatch =
                section.title.toLowerCase().includes(query.toLowerCase()) ||
                section.desc.toLowerCase().includes(query.toLowerCase());

              const matchingCommands = section.commands.filter(
                (cmd) =>
                  cmd.label.toLowerCase().includes(query.toLowerCase()) ||
                  cmd.cmd.toLowerCase().includes(query.toLowerCase())
              );

              if (sectionMatch || matchingCommands.length > 0) {
                matchingSections.push({
                  title: highlightText(section.title, query),
                  desc: highlightText(section.desc, query),
                  hasMatch: true,
                  matchingCommands: matchingCommands.length,
                  commands: matchingCommands.slice(0, 3).map((cmd) => ({
                    // Max 3 comandi per sezione
                    label: highlightText(cmd.label, query),
                    cmd: highlightText(cmd.cmd, query),
                  })),
                });
              }
            }

            if (matchingSections.length > 0) {
              // Evita duplicati se già trovato nei metadati
              const alreadyAdded = results.find(
                (r) => r.type === 'category' && r.categoryId === cat.id
              );

              if (!alreadyAdded) {
                results.push({
                  type: 'content',
                  categoryId: cat.id,
                  categoryName: highlightText(cat.name, query),
                  icon: cat.icon,
                  matchType: 'content',
                  sections: matchingSections,
                  owner: cat.owner ? cat.owner.username : null,
                });
              } else {
                // Aggiorna risultato esistente con sezioni
                alreadyAdded.sections = matchingSections;
                alreadyAdded.matchType = 'both'; // metadata + content
              }
            }
          }
        } catch (error) {
          // Ignora errori lettura file singoli
          console.error(`Error reading file for category ${cat.id}:`, error.message);
          continue;
        }
      }

      res.json({
        success: true,
        query,
        results,
        total: results.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
