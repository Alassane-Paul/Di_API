const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetectedMedia = sequelize.define('DetectedMedia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('image', 'video', 'audio'),
    allowNull: false
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'detected_media',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      fields: ['uploadedAt']
    },
    {
      fields: ['userId']
    }
  ]
});

module.exports = DetectedMedia;
