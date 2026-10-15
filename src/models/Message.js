const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'voice'),
    defaultValue: 'text'
  },
  mediaUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mediaDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mediaSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true
  },
  contact: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  replyToMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  isDeletedForEveryone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedForEveryoneAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletedForUsers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      fields: ['conversationId', 'timestamp']
    },
    {
      fields: ['senderId']
    }
  ]
});

module.exports = Message;
