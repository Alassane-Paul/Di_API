"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.messageLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const responses_1 = require("../data/responses");
const msg = (message) => ({
    responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
    responseMessage: message,
    error: message,
    data: [],
});
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: msg('Trop de requêtes. Veuillez réessayer plus tard.'),
    keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown',
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50', 10),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: msg("Trop de tentatives d'authentification. Réessayez dans 15 minutes."),
});
exports.messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: msg('Trop de messages envoyés. Réessayez dans une minute.'),
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: msg('Trop de fichiers envoyés. Réessayez plus tard.'),
});
