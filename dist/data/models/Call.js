"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCall = exports.Call = void 0;
const sequelize_1 = require("sequelize");
class Call extends sequelize_1.Model {
}
exports.Call = Call;
const initCall = (sequelize) => {
    Call.init({
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
        callerId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('audio', 'video'),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed'),
            defaultValue: 'initiated',
        },
        startedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        endedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        duration: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: 'calls',
        timestamps: true,
        updatedAt: false,
        indexes: [{ fields: ['conversationId'] }, { fields: ['callerId'] }],
    });
    return Call;
};
exports.initCall = initCall;
exports.default = Call;
