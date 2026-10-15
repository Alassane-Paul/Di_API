"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryViewer = exports.Story = exports.DetectedMedia = exports.Call = exports.Contact = exports.MessageReaction = exports.Message = exports.ConversationParticipant = exports.Conversation = exports.User = exports.db = exports.syncDatabase = exports.testConnection = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const db_config_1 = require("../../configs/db.config");
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Conversation_1 = require("./Conversation");
Object.defineProperty(exports, "Conversation", { enumerable: true, get: function () { return Conversation_1.Conversation; } });
const ConversationParticipant_1 = require("./ConversationParticipant");
Object.defineProperty(exports, "ConversationParticipant", { enumerable: true, get: function () { return ConversationParticipant_1.ConversationParticipant; } });
const Message_1 = require("./Message");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return Message_1.Message; } });
const MessageReaction_1 = require("./MessageReaction");
Object.defineProperty(exports, "MessageReaction", { enumerable: true, get: function () { return MessageReaction_1.MessageReaction; } });
const Contact_1 = require("./Contact");
Object.defineProperty(exports, "Contact", { enumerable: true, get: function () { return Contact_1.Contact; } });
const Call_1 = require("./Call");
Object.defineProperty(exports, "Call", { enumerable: true, get: function () { return Call_1.Call; } });
const DetectedMedia_1 = require("./DetectedMedia");
Object.defineProperty(exports, "DetectedMedia", { enumerable: true, get: function () { return DetectedMedia_1.DetectedMedia; } });
const Story_1 = require("./Story");
Object.defineProperty(exports, "Story", { enumerable: true, get: function () { return Story_1.Story; } });
const StoryViewer_1 = require("./StoryViewer");
Object.defineProperty(exports, "StoryViewer", { enumerable: true, get: function () { return StoryViewer_1.StoryViewer; } });
const env = (process.env.NODE_ENV || 'development');
const config = db_config_1.dbConfig[env] || db_config_1.dbConfig.development;
exports.sequelize = config.dialect === 'sqlite'
    ? new sequelize_1.Sequelize({
        dialect: 'sqlite',
        storage: config.storage,
        logging: config.logging,
    })
    : new sequelize_1.Sequelize(config.database, config.username, config.password, {
        host: config.host,
        port: config.port,
        dialect: 'mysql',
        logging: config.logging,
        pool: config.pool,
        dialectOptions: config.dialectOptions || {},
    });
// Initialize Models
(0, User_1.initUser)(exports.sequelize);
(0, Conversation_1.initConversation)(exports.sequelize);
(0, ConversationParticipant_1.initConversationParticipant)(exports.sequelize);
(0, Message_1.initMessage)(exports.sequelize);
(0, MessageReaction_1.initMessageReaction)(exports.sequelize);
(0, Contact_1.initContact)(exports.sequelize);
(0, Call_1.initCall)(exports.sequelize);
(0, DetectedMedia_1.initDetectedMedia)(exports.sequelize);
(0, Story_1.initStory)(exports.sequelize);
(0, StoryViewer_1.initStoryViewer)(exports.sequelize);
// User Associations
User_1.User.hasMany(Message_1.Message, { foreignKey: 'senderId', as: 'sentMessages' });
User_1.User.hasMany(ConversationParticipant_1.ConversationParticipant, { foreignKey: 'userId', as: 'conversations' });
User_1.User.hasMany(Contact_1.Contact, { foreignKey: 'userId', as: 'contacts' });
User_1.User.hasMany(Contact_1.Contact, { foreignKey: 'contactUserId', as: 'inContacts' });
User_1.User.hasMany(Call_1.Call, { foreignKey: 'callerId', as: 'calls' });
User_1.User.hasMany(DetectedMedia_1.DetectedMedia, { foreignKey: 'userId', as: 'detectedMedia' });
User_1.User.hasMany(Story_1.Story, { foreignKey: 'userId', as: 'stories' });
// Message Associations
Message_1.Message.belongsTo(User_1.User, { foreignKey: 'senderId', as: 'sender' });
Message_1.Message.belongsTo(Conversation_1.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message_1.Message.hasMany(MessageReaction_1.MessageReaction, { foreignKey: 'messageId', as: 'reactions' });
Message_1.Message.belongsTo(Message_1.Message, { foreignKey: 'replyToMessageId', as: 'replyTo' });
// Conversation Associations
Conversation_1.Conversation.hasMany(Message_1.Message, { foreignKey: 'conversationId', as: 'messages' });
Conversation_1.Conversation.hasMany(ConversationParticipant_1.ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
Conversation_1.Conversation.belongsTo(User_1.User, { foreignKey: 'createdBy', as: 'creator' });
Conversation_1.Conversation.belongsTo(Message_1.Message, { foreignKey: 'lastMessageId', as: 'lastMessage' });
Conversation_1.Conversation.hasMany(Call_1.Call, { foreignKey: 'conversationId', as: 'calls' });
// ConversationParticipant Associations
ConversationParticipant_1.ConversationParticipant.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
ConversationParticipant_1.ConversationParticipant.belongsTo(Conversation_1.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
// MessageReaction Associations
MessageReaction_1.MessageReaction.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
MessageReaction_1.MessageReaction.belongsTo(Message_1.Message, { foreignKey: 'messageId', as: 'message' });
// Contact Associations
Contact_1.Contact.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
Contact_1.Contact.belongsTo(User_1.User, { foreignKey: 'contactUserId', as: 'contact' });
// Call Associations
Call_1.Call.belongsTo(User_1.User, { foreignKey: 'callerId', as: 'caller' });
Call_1.Call.belongsTo(Conversation_1.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
// DetectedMedia Associations
DetectedMedia_1.DetectedMedia.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
// Story Associations
Story_1.Story.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
Story_1.Story.hasMany(StoryViewer_1.StoryViewer, { foreignKey: 'storyId', as: 'viewers' });
StoryViewer_1.StoryViewer.belongsTo(Story_1.Story, { foreignKey: 'storyId', as: 'story' });
StoryViewer_1.StoryViewer.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
const testConnection = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log(`✅ Base de données connectée (${exports.sequelize.getDialect()})`);
        return true;
    }
    catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error);
        return false;
    }
};
exports.testConnection = testConnection;
const syncDatabase = async (alter = true) => {
    try {
        await exports.sequelize.sync({ alter });
        console.log('✅ Base de données synchronisée');
    }
    catch (error) {
        console.error('❌ Erreur de synchronisation DB:', error);
    }
};
exports.syncDatabase = syncDatabase;
exports.db = {
    Sequelize: sequelize_1.Sequelize,
    sequelize: exports.sequelize,
    User: User_1.User,
    users: User_1.User,
    Conversation: Conversation_1.Conversation,
    conversations: Conversation_1.Conversation,
    ConversationParticipant: ConversationParticipant_1.ConversationParticipant,
    conversationParticipants: ConversationParticipant_1.ConversationParticipant,
    Message: Message_1.Message,
    messages: Message_1.Message,
    MessageReaction: MessageReaction_1.MessageReaction,
    messageReactions: MessageReaction_1.MessageReaction,
    Contact: Contact_1.Contact,
    contacts: Contact_1.Contact,
    Call: Call_1.Call,
    calls: Call_1.Call,
    DetectedMedia: DetectedMedia_1.DetectedMedia,
    detectedMedia: DetectedMedia_1.DetectedMedia,
    Story: Story_1.Story,
    stories: Story_1.Story,
    StoryViewer: StoryViewer_1.StoryViewer,
    storyViewers: StoryViewer_1.StoryViewer,
    testConnection: exports.testConnection,
    syncDatabase: exports.syncDatabase,
};
exports.default = exports.db;
