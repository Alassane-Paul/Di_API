import { Sequelize } from 'sequelize';
import { dbConfig } from '../../configs/db.config';
import { initUser, User } from './User';
import { initConversation, Conversation } from './Conversation';
import { initConversationParticipant, ConversationParticipant } from './ConversationParticipant';
import { initMessage, Message } from './Message';
import { initMessageReaction, MessageReaction } from './MessageReaction';
import { initContact, Contact } from './Contact';
import { initCall, Call } from './Call';
import { initDetectedMedia, DetectedMedia } from './DetectedMedia';
import { initStory, Story } from './Story';
import { initStoryViewer, StoryViewer } from './StoryViewer';

const env = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production';
const config = dbConfig[env] || dbConfig.development;

export const sequelize =
  config.dialect === 'sqlite'
    ? new Sequelize({
        dialect: 'sqlite',
        storage: config.storage,
        logging: config.logging,
      })
    : new Sequelize(
        (config as any).database,
        (config as any).username,
        (config as any).password,
        {
          host: (config as any).host,
          port: (config as any).port,
          dialect: 'mysql',
          logging: config.logging,
          pool: config.pool,
          dialectOptions: (config as any).dialectOptions || {},
        }
      );

// Initialize Models
initUser(sequelize);
initConversation(sequelize);
initConversationParticipant(sequelize);
initMessage(sequelize);
initMessageReaction(sequelize);
initContact(sequelize);
initCall(sequelize);
initDetectedMedia(sequelize);
initStory(sequelize);
initStoryViewer(sequelize);

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

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Base de données connectée (${sequelize.getDialect()})`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
};

export const syncDatabase = async (alter = true): Promise<void> => {
  try {
    await sequelize.sync({ alter });
    console.log('✅ Base de données synchronisée');
  } catch (error) {
    console.error('❌ Erreur de synchronisation DB:', error);
  }
};

export const db = {
  Sequelize,
  sequelize,
  User,
  users: User,
  Conversation,
  conversations: Conversation,
  ConversationParticipant,
  conversationParticipants: ConversationParticipant,
  Message,
  messages: Message,
  MessageReaction,
  messageReactions: MessageReaction,
  Contact,
  contacts: Contact,
  Call,
  calls: Call,
  DetectedMedia,
  detectedMedia: DetectedMedia,
  Story,
  stories: Story,
  StoryViewer,
  storyViewers: StoryViewer,
  testConnection,
  syncDatabase,
};

export {
  User,
  Conversation,
  ConversationParticipant,
  Message,
  MessageReaction,
  Contact,
  Call,
  DetectedMedia,
  Story,
  StoryViewer,
};

export default db;
