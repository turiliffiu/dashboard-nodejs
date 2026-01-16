const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Inizializza Sequelize
const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: dbConfig.pool,
  dialectOptions: dbConfig.dialectOptions || {},
});

// Importa modelli
const User = require('./User')(sequelize);
const UserProfile = require('./UserProfile')(sequelize);
const ProcedureCategory = require('./ProcedureCategory')(sequelize);

// Definisci relazioni
User.hasOne(UserProfile, {
  foreignKey: 'userId',
  as: 'profile',
  onDelete: 'CASCADE',
});

UserProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

ProcedureCategory.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

User.hasMany(ProcedureCategory, {
  foreignKey: 'ownerId',
  as: 'procedures',
});

// Test connessione database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Export
module.exports = {
  sequelize,
  Sequelize,
  User,
  UserProfile,
  ProcedureCategory,
  testConnection,
};
