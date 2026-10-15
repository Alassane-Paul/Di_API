"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerService = registerService;
exports.loginService = loginService;
exports.getProfileService = getProfileService;
exports.updateProfileService = updateProfileService;
exports.searchUsersService = searchUsersService;
const sequelize_1 = require("sequelize");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../../../data/models");
const app_config_1 = require("../../../configs/app.config");
const responses_1 = require("../../../data/responses");
const service_helper_1 = require("../../../utils/service.helper");
async function registerService(req, res) {
    try {
        const { username, email, password, displayName } = req.validatedData || req.body;
        const publicKey = crypto_1.default.randomBytes(32).toString('hex');
        const user = await models_1.User.create({
            username,
            email,
            password,
            displayName: displayName || username,
            publicKey,
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, app_config_1.config.jwt.secret, {
            expiresIn: app_config_1.config.jwt.expiresIn,
        });
        return res.status(responses_1.responses.HTTP_CODES.CREATED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.REGISTRATION_SUCCESS.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.REGISTRATION_SUCCESS.MESSAGE,
            data: [{
                    token,
                    user: (0, service_helper_1.sanitizeUser)(user),
                }],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'RegisterService');
    }
}
async function loginService(req, res) {
    try {
        const { username, password, deviceId } = req.body;
        const user = await models_1.User.findOne({ where: { username } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.MESSAGE,
                data: [],
            });
        }
        user.isOnline = true;
        user.lastSeen = new Date();
        if (deviceId)
            user.deviceId = deviceId;
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, app_config_1.config.jwt.secret, {
            expiresIn: app_config_1.config.jwt.expiresIn,
        });
        return res.status(responses_1.responses.HTTP_CODES.RESULT_OK).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.LOGIN_SUCCESS.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.LOGIN_SUCCESS.MESSAGE,
            data: [{
                    token,
                    user: (0, service_helper_1.sanitizeUser)(user),
                }],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'LoginService');
    }
}
async function getProfileService(req, res) {
    try {
        const user = await models_1.User.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        return (0, service_helper_1.successResponse)(res, 'SUCCESS', user);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetProfileService');
    }
}
async function updateProfileService(req, res) {
    try {
        const { displayName, avatar, status } = req.body;
        const user = await models_1.User.findByPk(req.userId);
        if (!user) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        if (displayName)
            user.displayName = displayName;
        if (avatar)
            user.avatar = avatar;
        if (status !== undefined)
            user.status = status;
        await user.save();
        return (0, service_helper_1.successResponse)(res, 'PROFILE_UPDATED', (0, service_helper_1.sanitizeUser)(user));
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'UpdateProfileService');
    }
}
async function searchUsersService(req, res) {
    try {
        const { query } = req.query;
        const users = await models_1.User.findAll({
            where: {
                id: { [sequelize_1.Op.ne]: req.userId },
                [sequelize_1.Op.or]: [
                    { username: { [sequelize_1.Op.like]: `%${query}%` } },
                    { displayName: { [sequelize_1.Op.like]: `%${query}%` } },
                    { email: { [sequelize_1.Op.like]: `%${query}%` } },
                ],
            },
            attributes: ['id', 'username', 'displayName', 'avatar', 'status', 'isOnline', 'lastSeen'],
            limit: 20,
        });
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', users);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'SearchUsersService');
    }
}
