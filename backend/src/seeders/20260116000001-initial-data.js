'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Password hashata per "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crea utente admin
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@dashboard.local',
        password: hashedPassword,
        first_name: 'Administrator',
        last_name: 'Dashboard',
        is_active: true,
        is_superuser: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Crea profilo admin
    await queryInterface.bulkInsert('user_profiles', [
      {
        user_id: 1,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Crea categorie di esempio
    await queryInterface.bulkInsert('procedure_categories', [
      {
        id: 1,
        name: 'Comandi Docker',
        icon: '🐳',
        description: 'Gestione container e immagini Docker',
        filename: 'docker.txt',
        order: 1,
        owner_id: 1,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Comandi Linux',
        icon: '🐧',
        description: 'Comandi essenziali per amministrazione Linux',
        filename: 'linux.txt',
        order: 2,
        owner_id: 1,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Comandi Git',
        icon: '🔀',
        description: 'Controllo versione e gestione repository',
        filename: 'git.txt',
        order: 3,
        owner_id: 1,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('procedure_categories', null, {});
    await queryInterface.bulkDelete('user_profiles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
