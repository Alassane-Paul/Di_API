"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initContact = exports.Contact = void 0;
const sequelize_1 = require("sequelize");
class Contact extends sequelize_1.Model {
}
exports.Contact = Contact;
const initContact = (sequelize) => {
    Contact.init({
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
        contactUserId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        displayName: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        isBlocked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isFavorite: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        addedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'contacts',
        timestamps: true,
        updatedAt: false,
        indexes: [{ unique: true, fields: ['userId', 'contactUserId'] }],
    });
    return Contact;
};
exports.initContact = initContact;
exports.default = Contact;
