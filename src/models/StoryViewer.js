const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoryViewer = sequelize.define('StoryViewer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stories',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  viewedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'story_viewers',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['storyId', 'userId']
    }
  ]
});

module.exports = StoryViewer;
