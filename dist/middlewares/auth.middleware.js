"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_config_1 = require("../configs/app.config");
const responses_1 = require("../data/responses");
const models_1 = require("../data/models");
async function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
            error: 'No token provided',
            data: [],
        });
        return;
    }
    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];
    if (!token) {
        res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
            error: 'No token provided',
            data: [],
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, app_config_1.config.jwt.secret);
        req.userId = decoded.userId ?? decoded.id;
        // Optionally enrich req.user with DB data (can be skipped for perf)
        const user = await models_1.User.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
                error: 'User not found',
                data: [],
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.EXPIRED_SESSION.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.EXPIRED_SESSION.MESSAGE,
            error: 'Invalid or expired token',
            data: [],
        });
    }
}
exports.default = authenticate;
