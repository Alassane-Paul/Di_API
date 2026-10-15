"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUser = exports.User = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User extends sequelize_1.Model {
    async comparePassword(candidatePassword) {
        const hash = this.getDataValue('password') || this.password;
        if (!hash || !candidatePassword)
            return false;
        return bcryptjs_1.default.compare(candidatePassword, hash);
    }
}
exports.User = User;
const initUser = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: sequelize_1.DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },
        email: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        displayName: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
        },
        avatar: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        status: {
            type: sequelize_1.DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null,
        },
        isOnline: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        lastSeen: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        publicKey: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        deviceId: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                const rawPassword = user.getDataValue('password') || user.password;
                if (rawPassword) {
                    const hashed = await bcryptjs_1.default.hash(rawPassword, 10);
                    user.setDataValue('password', hashed);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const rawPassword = user.getDataValue('password') || user.password;
                    if (rawPassword) {
                        const hashed = await bcryptjs_1.default.hash(rawPassword, 10);
                        user.setDataValue('password', hashed);
                    }
                }
            },
        },
    });
    return User;
};
exports.initUser = initUser;
exports.default = User;
