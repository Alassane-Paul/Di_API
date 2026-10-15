"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createController = createController;
const responses_1 = require("../data/responses");
function createController(validator, service, controllerName) {
    return async (req, res) => {
        try {
            if (validator) {
                const validation = await validator(req);
                if (validation.error) {
                    return res.status(validation.status || responses_1.responses.HTTP_CODES.VALIDATION_ERROR).json({
                        responseCode: validation.responseCode || responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
                        responseMessage: validation.responseMessage || 'Erreur de validation',
                        error: validation.responseMessage || 'Erreur de validation',
                        data: validation.data || [],
                    });
                }
                req.validatedData = validation.data;
            }
            await service(req, res);
        }
        catch (error) {
            console.error(`[${controllerName} Error]:`, error);
            return res.status(responses_1.responses.HTTP_CODES.SERVER_ERROR).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
                responseMessage: error?.message || responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
                error: error?.message || responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
                data: [],
            });
        }
    };
}
exports.default = createController;
