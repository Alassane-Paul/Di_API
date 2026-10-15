"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMessageReaction = exports.MessageReaction = void 0;
const sequelize_1 = require("sequelize");
class MessageReaction extends sequelize_1.Model {
}
exports.MessageReaction = MessageReaction;
const initMessageReaction = (sequelize) => {
    MessageReaction.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        messageId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'messages',
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
        emoji: {
            type: sequelize_1.DataTypes.STRING(10),
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: 'message_reactions',
        timestamps: true,
        updatedAt: false,
        indexes: [{ unique: true, fields: ['messageId', 'userId'] }],
    });
    return MessageReaction;
};
exports.initMessageReaction = initMessageReaction;
exports.default = MessageReaction;
