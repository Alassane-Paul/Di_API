"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initConversation = exports.Conversation = void 0;
const sequelize_1 = require("sequelize");
class Conversation extends sequelize_1.Model {
}
exports.Conversation = Conversation;
const initConversation = (sequelize) => {
    Conversation.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('direct', 'group'),
            defaultValue: 'direct',
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        avatar: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        lastMessageId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        lastMessageAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        isArchived: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        archivedBy: {
            type: sequelize_1.DataTypes.JSON,
            defaultValue: [],
        },
        isPinned: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        pinnedBy: {
            type: sequelize_1.DataTypes.JSON,
            defaultValue: [],
        },
        mutedUntil: {
            type: sequelize_1.DataTypes.JSON,
            defaultValue: {},
        },
    }, {
        sequelize,
        tableName: 'conversations',
        timestamps: true,
        indexes: [
            { fields: ['type'] },
            { fields: ['lastMessageAt'] },
        ],
    });
    return Conversation;
};
exports.initConversation = initConversation;
exports.default = Conversation;
