"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStoryViewer = exports.StoryViewer = void 0;
const sequelize_1 = require("sequelize");
class StoryViewer extends sequelize_1.Model {
}
exports.StoryViewer = StoryViewer;
const initStoryViewer = (sequelize) => {
    StoryViewer.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        storyId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'stories',
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
        viewedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'story_viewers',
        timestamps: false,
        indexes: [{ unique: true, fields: ['storyId', 'userId'] }],
    });
    return StoryViewer;
};
exports.initStoryViewer = initStoryViewer;
exports.default = StoryViewer;
