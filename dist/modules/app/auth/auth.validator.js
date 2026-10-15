"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidator = registerValidator;
exports.loginValidator = loginValidator;
const constants_1 = require("../../../data/constants");
const responses_1 = require("../../../data/responses");
const models_1 = require("../../../data/models");
const sequelize_1 = require("sequelize");
async function registerValidator(req) {
    const { username, email, password, displayName } = req.body;
    if (!username || typeof username !== 'string') {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.MESSAGE,
        };
    }
    if (username.length < constants_1.constants.LENGTHS.USERNAME.MIN || username.length > constants_1.constants.LENGTHS.USERNAME.MAX) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.INVALID_USERNAME.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.INVALID_USERNAME.MESSAGE,
        };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.INVALID_EMAIL.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.INVALID_EMAIL.MESSAGE,
        };
    }
    if (!password || password.length < constants_1.constants.LENGTHS.PASSWORD.MIN || password.length > constants_1.constants.LENGTHS.PASSWORD.MAX) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.MESSAGE,
        };
    }
    const existing = await models_1.User.findOne({ where: { [sequelize_1.Op.or]: [{ username }, { email }] } });
    if (existing) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.CONFLICT,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.USER_ALREADY_EXISTS.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.USER_ALREADY_EXISTS.MESSAGE,
        };
    }
    return { error: false, data: { username: username.trim(), email: email.trim().toLowerCase(), password, displayName: displayName || username } };
}
async function loginValidator(req) {
    const { username, password } = req.body;
    if (!username) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.MESSAGE,
        };
    }
    if (!password) {
        return {
            error: true,
            status: responses_1.responses.HTTP_CODES.VALIDATION_ERROR,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.MESSAGE,
        };
    }
    return { error: false };
}
