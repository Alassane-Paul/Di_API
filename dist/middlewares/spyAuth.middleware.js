"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spyAuth = spyAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_config_1 = require("../configs/app.config");
const responses_1 = require("../data/responses");
function spyAuth(req, res, next) {
    // 1. Check custom spy headers
    const spyTokenHeader = req.headers['x-spy-token'];
    if (spyTokenHeader && (spyTokenHeader === app_config_1.config.spy.secretToken || spyTokenHeader === app_config_1.config.spy.adminPassword)) {
        req.isAdmin = true;
        return next();
    }
    // 2. Check query param token (useful for ZIP download links and <img>/<video> tags)
    const queryToken = req.query.token;
    if (queryToken) {
        if (queryToken === app_config_1.config.spy.secretToken || queryToken === app_config_1.config.spy.adminPassword) {
            req.isAdmin = true;
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(queryToken, app_config_1.config.jwt.secret);
            req.userId = decoded.userId ?? decoded.id;
            return next();
        }
        catch (_) {
            // Query token invalid, continue to header checks
        }
    }
    // 3. Check Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (token === app_config_1.config.spy.secretToken || token === app_config_1.config.spy.adminPassword) {
            req.isAdmin = true;
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, app_config_1.config.jwt.secret);
            req.userId = decoded.userId ?? decoded.id;
            return next();
        }
        catch (_) {
            res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                success: false,
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
                responseMessage: 'Token de session invalide ou expiré',
                error: 'Token de session invalide ou expiré',
            });
            return;
        }
    }
    res.status(responses_1.responses.HTTP_CODES.UNAUTHORIZED).json({
        success: false,
        responseCode: responses_1.responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
        responseMessage: 'Accès restreint : Authentification requise pour accéder au module Spy',
        error: 'Authentification requise',
    });
}
exports.default = spyAuth;
