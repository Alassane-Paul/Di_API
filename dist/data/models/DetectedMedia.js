"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDetectedMedia = exports.DetectedMedia = void 0;
const sequelize_1 = require("sequelize");
class DetectedMedia extends sequelize_1.Model {
}
exports.DetectedMedia = DetectedMedia;
const initDetectedMedia = (sequelize) => {
    DetectedMedia.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        filePath: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
        },
        fileName: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        fileSize: {
            type: sequelize_1.DataTypes.BIGINT,
            allowNull: false,
        },
        fileType: {
            type: sequelize_1.DataTypes.ENUM('image', 'video', 'audio'),
            allowNull: false,
        },
        uploadedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        processed: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    }, {
        sequelize,
        tableName: 'detected_media',
        timestamps: true,
        updatedAt: false,
        indexes: [{ fields: ['uploadedAt'] }, { fields: ['userId'] }],
    });
    return DetectedMedia;
};
exports.initDetectedMedia = initDetectedMedia;
exports.default = DetectedMedia;
