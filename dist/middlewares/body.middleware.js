"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyMiddleware = bodyMiddleware;
const responses_1 = require("../data/responses");
function bodyMiddleware(req, res, next) {
    // Allow multipart/form-data (files)
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(responses_1.responses.HTTP_CODES.VALIDATION_ERROR).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.MESSAGE,
            error: responses_1.responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.MESSAGE,
            data: [],
        });
        return;
    }
    next();
}
exports.default = bodyMiddleware;
