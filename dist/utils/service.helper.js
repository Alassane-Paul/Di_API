"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = exports.parseBoolean = exports.asyncHandler = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.notFoundResponse = notFoundResponse;
exports.forbiddenResponse = forbiddenResponse;
exports.validationError = validationError;
exports.paginationResponse = paginationResponse;
const responses_1 = require("../data/responses");
function successResponse(res, messageKey, data = [], httpCode) {
    const message = responses_1.responses.CALL_BACK_MESSAGES[messageKey] || responses_1.responses.CALL_BACK_MESSAGES.SUCCESS;
    return res.status(httpCode || responses_1.responses.HTTP_CODES.RESULT_OK).json({
        responseCode: message.CODE,
        responseMessage: message.MESSAGE,
        data: Array.isArray(data) ? data : [data],
    });
}
function errorResponse(res, error, serviceName) {
    console.error(`[${serviceName} Error]:`, error);
    return res.status(responses_1.responses.HTTP_CODES.SERVER_ERROR).json({
        responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
        responseMessage: responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
        error: error?.message || responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
        data: [],
    });
}
function notFoundResponse(res, messageKey = 'RECORD_NOT_FOUND') {
    const message = responses_1.responses.CALL_BACK_MESSAGES[messageKey];
    return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: message.CODE,
        responseMessage: message.MESSAGE,
        error: message.MESSAGE,
        data: [],
    });
}
function forbiddenResponse(res, messageKey = 'FORBIDDEN_PERMISSION') {
    const message = responses_1.responses.CALL_BACK_MESSAGES[messageKey];
    return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: message.CODE,
        responseMessage: message.MESSAGE,
        error: message.MESSAGE,
        data: [],
    });
}
function validationError(res, messageKey, data = []) {
    const message = responses_1.responses.CALL_BACK_MESSAGES[messageKey];
    return res.status(responses_1.responses.HTTP_CODES.VALIDATION_ERROR).json({
        responseCode: message.CODE,
        responseMessage: message.MESSAGE,
        error: message.MESSAGE,
        data,
    });
}
function paginationResponse(res, messageKey, rows, count, page, limit) {
    const message = responses_1.responses.CALL_BACK_MESSAGES[messageKey] || responses_1.responses.CALL_BACK_MESSAGES.LIST_RETRIEVED;
    return res.status(responses_1.responses.HTTP_CODES.RESULT_OK).json({
        responseCode: message.CODE,
        responseMessage: message.MESSAGE,
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            hasNext: page * limit < count,
            hasPrevious: page > 1,
        },
    });
}
/** Async wrapper to avoid try/catch boilerplate */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
/** Parse boolean from query/body */
const parseBoolean = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string')
        return value.toLowerCase() === 'true';
    return Boolean(value);
};
exports.parseBoolean = parseBoolean;
/** Sanitize user object (remove sensitive fields) */
const sanitizeUser = (user) => {
    if (!user)
        return null;
    const obj = user.toJSON ? user.toJSON() : { ...user };
    delete obj.password;
    delete obj.deviceId;
    return obj;
};
exports.sanitizeUser = sanitizeUser;
