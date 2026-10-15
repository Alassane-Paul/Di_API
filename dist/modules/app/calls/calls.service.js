"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateCallService = initiateCallService;
exports.updateCallStatusService = updateCallStatusService;
exports.getCallHistoryService = getCallHistoryService;
const sequelize_1 = require("sequelize");
const models_1 = require("../../../data/models");
const service_helper_1 = require("../../../utils/service.helper");
const responses_1 = require("../../../data/responses");
async function initiateCallService(req, res) {
    try {
        const { conversationId, type } = req.body;
        const call = await models_1.Call.create({
            conversationId,
            callerId: req.userId,
            type,
            status: 'initiated',
        });
        const populated = await models_1.Call.findByPk(call.id, {
            include: [
                { model: models_1.User, as: 'caller', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: models_1.Conversation, as: 'conversation', attributes: ['id', 'type', 'name'] },
            ],
        });
        return res.status(responses_1.responses.HTTP_CODES.CREATED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.CALL_INITIATED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CALL_INITIATED.MESSAGE,
            data: [populated],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'InitiateCallService');
    }
}
async function updateCallStatusService(req, res) {
    try {
        const { callId } = req.params;
        const { status } = req.body;
        const call = await models_1.Call.findByPk(Number(callId));
        if (!call) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        call.status = status;
        if (status === 'connected') {
            call.startedAt = new Date();
        }
        else if (['ended', 'rejected', 'missed'].includes(status)) {
            call.endedAt = new Date();
            if (call.startedAt) {
                call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
            }
        }
        await call.save();
        return (0, service_helper_1.successResponse)(res, 'CALL_STATUS_UPDATED', call);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'UpdateCallStatusService');
    }
}
async function getCallHistoryService(req, res) {
    try {
        const userConvs = await models_1.ConversationParticipant.findAll({
            where: { userId: req.userId },
            attributes: ['conversationId'],
        });
        const convIds = userConvs.map((p) => p.conversationId);
        const where = convIds.length > 0
            ? {
                [sequelize_1.Op.or]: [
                    { callerId: req.userId },
                    { conversationId: { [sequelize_1.Op.in]: convIds } },
                ],
            }
            : { callerId: req.userId };
        const calls = await models_1.Call.findAll({
            where,
            include: [
                { model: models_1.User, as: 'caller', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: models_1.Conversation, as: 'conversation', attributes: ['id', 'type', 'name', 'avatar'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', calls);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetCallHistoryService');
    }
}
