const { sequelize } = require('../config/database');
const User = require('./User');
const Message = require('./Message');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const MessageReaction = require('./MessageReaction');
const Contact = require('./Contact');
const Call = require('./Call');
const DetectedMedia = require('./DetectedMedia');
const Story = require('./Story');
const StoryViewer = require('./StoryViewer');

// User Associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(ConversationParticipant, { foreignKey: 'userId', as: 'conversations' });
User.hasMany(Contact, { foreignKey: 'userId', as: 'contacts' });
User.hasMany(Contact, { foreignKey: 'contactUserId', as: 'inContacts' });
User.hasMany(Call, { foreignKey: 'callerId', as: 'calls' });
User.hasMany(DetectedMedia, { foreignKey: 'userId', as: 'detectedMedia' });
User.hasMany(Story, { foreignKey: 'userId', as: 'stories' });

// Message Associations
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.hasMany(MessageReaction, { foreignKey: 'messageId', as: 'reactions' });
Message.belongsTo(Message, { foreignKey: 'replyToMessageId', as: 'replyTo' });

// Conversation Associations
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
Conversation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Conversation.belongsTo(Message, { foreignKey: 'lastMessageId', as: 'lastMessage' });
Conversation.hasMany(Call, { foreignKey: 'conversationId', as: 'calls' });

// ConversationParticipant Associations
ConversationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// MessageReaction Associations
MessageReaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MessageReaction.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

// Contact Associations
Contact.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Contact.belongsTo(User, { foreignKey: 'contactUserId', as: 'contact' });

// Call Associations
Call.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
Call.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// DetectedMedia Associations
DetectedMedia.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Story Associations
Story.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Story.hasMany(StoryViewer, { foreignKey: 'storyId', as: 'viewers' });
StoryViewer.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
StoryViewer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données synchronisée');
  } catch (error) {
    console.error('❌ Erreur de synchronisation:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Message,
  Conversation,
  ConversationParticipant,
  MessageReaction,
  Contact,
  Call,
  DetectedMedia,
  Story,
  StoryViewer,
  syncDatabase
};
