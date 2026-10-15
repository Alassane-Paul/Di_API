"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initConversationParticipant = exports.ConversationParticipant = void 0;
const sequelize_1 = require("sequelize");
class ConversationParticipant extends sequelize_1.Model {
}
exports.ConversationParticipant = ConversationParticipant;
const initConversationParticipant = (sequelize) => {
    ConversationParticipant.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        conversationId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        role: {
            type: sequelize_1.DataTypes.ENUM('admin', 'moderator', 'member'),
            defaultValue: 'member',
        },
        unreadCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastReadMessageId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        joinedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        isAdmin: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        canSendMessages: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        tableName: 'conversation_participants',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['conversationId', 'userId'] },
            { fields: ['userId'] },
        ],
    });
    return ConversationParticipant;
};
exports.initConversationParticipant = initConversationParticipant;
exports.default = ConversationParticipant;
