const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProfile = sequelize.define(
    'UserProfile',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'user_id',
      },
      role: {
        type: DataTypes.ENUM('admin', 'editor', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false,
        validate: {
          isIn: [['admin', 'editor', 'viewer']],
        },
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
      tableName: 'user_profiles',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // Metodi di istanza per permessi
  UserProfile.prototype.canCreate = function () {
    return ['admin', 'editor'].includes(this.role);
  };

  UserProfile.prototype.canEdit = function (procedure) {
    if (this.role === 'admin') return true;
    if (this.role === 'editor' && procedure) {
      return procedure.ownerId === this.userId;
    }
    return false;
  };

  UserProfile.prototype.canDelete = function (procedure) {
    if (this.role === 'admin') return true;
    if (this.role === 'editor' && procedure) {
      return procedure.ownerId === this.userId;
    }
    return false;
  };

  UserProfile.prototype.canView = function () {
    return true; // Tutti possono visualizzare
  };

  return UserProfile;
};
