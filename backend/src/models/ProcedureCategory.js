const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProcedureCategory = sequelize.define(
    'ProcedureCategory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      icon: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '📄',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      filename: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        field: 'owner_id',
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_public',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      tableName: 'procedure_categories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['owner_id'],
        },
        {
          fields: ['is_public'],
        },
        {
          fields: ['order'],
        },
      ],
    }
  );

  // Metodi di istanza per verificare permessi utente
  ProcedureCategory.prototype.canUserEdit = function (user) {
    if (!user) return false;
    if (user.isSuperuser) return true;
    if (user.profile && user.profile.role === 'admin') return true;
    if (user.profile && user.profile.role === 'editor' && this.ownerId === user.id) return true;
    return false;
  };

  ProcedureCategory.prototype.canUserDelete = function (user) {
    if (!user) return false;
    if (user.isSuperuser) return true;
    if (user.profile && user.profile.role === 'admin') return true;
    if (user.profile && user.profile.role === 'editor' && this.ownerId === user.id) return true;
    return false;
  };

  ProcedureCategory.prototype.canUserView = function (user) {
    if (!user) return this.isPublic;
    if (user.isSuperuser) return true;
    if (user.profile && user.profile.role === 'admin') return true;
    if (this.isPublic) return true;
    if (this.ownerId === user.id) return true;
    return false;
  };

  return ProcedureCategory;
};
