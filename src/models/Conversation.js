const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    defaultValue: 'direct'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  archivedBy: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pinnedBy: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  mutedUntil: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['lastMessageAt']
    }
  ]
});

module.exports = Conversation;
