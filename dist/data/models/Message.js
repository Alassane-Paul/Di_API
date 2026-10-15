"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMessage = exports.Message = void 0;
const sequelize_1 = require("sequelize");
class Message extends sequelize_1.Model {
}
exports.Message = Message;
const initMessage = (sequelize) => {
    Message.init({
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
        senderId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        messageType: {
            type: sequelize_1.DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'voice'),
            defaultValue: 'text',
        },
        mediaUrl: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        mediaDuration: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        mediaSize: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        thumbnailUrl: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        fileName: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        location: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        contact: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        isRead: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isDelivered: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isEdited: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        editedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        replyToMessageId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id',
            },
        },
        isDeletedForEveryone: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deletedForEveryoneAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        deletedForUsers: {
            type: sequelize_1.DataTypes.JSON,
            defaultValue: [],
        },
        timestamp: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'messages',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ['conversationId', 'timestamp'] },
            { fields: ['senderId'] },
        ],
    });
    return Message;
};
exports.initMessage = initMessage;
exports.default = Message;
