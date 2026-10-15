"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStory = exports.Story = void 0;
const sequelize_1 = require("sequelize");
class Story extends sequelize_1.Model {
}
exports.Story = Story;
const initStory = (sequelize) => {
    Story.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        mediaUrl: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
        },
        mediaType: {
            type: sequelize_1.DataTypes.ENUM('image', 'video'),
            defaultValue: 'image',
        },
        caption: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        expiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: 'stories',
        timestamps: true,
        indexes: [{ fields: ['userId'] }, { fields: ['expiresAt'] }],
    });
    return Story;
};
exports.initStory = initStory;
exports.default = Story;
