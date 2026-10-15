"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationsService = getConversationsService;
exports.createConversationService = createConversationService;
exports.getConversationService = getConversationService;
exports.updateConversationService = updateConversationService;
exports.addParticipantService = addParticipantService;
exports.removeParticipantService = removeParticipantService;
exports.archiveConversationService = archiveConversationService;
exports.pinConversationService = pinConversationService;
exports.muteConversationService = muteConversationService;
const models_1 = require("../../../data/models");
const service_helper_1 = require("../../../utils/service.helper");
const responses_1 = require("../../../data/responses");
async function getConversationsService(req, res) {
    try {
        const participations = await models_1.ConversationParticipant.findAll({
            where: { userId: req.userId },
            include: [
                {
                    model: models_1.Conversation,
                    as: 'conversation',
                    include: [
                        {
                            model: models_1.Message,
                            as: 'lastMessage',
                            include: [{ model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] }],
                        },
                    ],
                },
            ],
            order: [[{ model: models_1.Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']],
        });
        const enriched = await Promise.all(participations.map(async (cp) => {
            const participants = await models_1.ConversationParticipant.findAll({
                where: { conversationId: cp.conversationId },
                include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }],
            });
            return {
                ...(cp.conversation?.toJSON?.() || {}),
                participants: participants.map((p) => p.user?.toJSON?.() || p.user),
                unreadCount: cp.unreadCount,
                lastReadMessageId: cp.lastReadMessageId,
            };
        }));
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', enriched);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetConversationsService');
    }
}
async function createConversationService(req, res) {
    try {
        const { type, name, description, participantIds } = req.body;
        const conversation = await models_1.Conversation.create({
            type,
            name: type === 'group' ? name : null,
            description,
            createdBy: req.userId,
        });
        await models_1.ConversationParticipant.create({
            conversationId: conversation.id,
            userId: req.userId,
            role: 'admin',
            isAdmin: true,
        });
        if (participantIds && participantIds.length > 0) {
            for (const userId of participantIds) {
                await models_1.ConversationParticipant.create({
                    conversationId: conversation.id,
                    userId,
                    role: 'member',
                });
            }
        }
        const populated = await models_1.Conversation.findByPk(conversation.id, {
            include: [
                {
                    model: models_1.ConversationParticipant,
                    as: 'participants',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline'] }],
                },
            ],
        });
        return res.status(responses_1.responses.HTTP_CODES.CREATED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_CREATED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_CREATED.MESSAGE,
            data: [populated],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'CreateConversationService');
    }
}
async function getConversationService(req, res) {
    try {
        const { conversationId } = req.params;
        const conversation = await models_1.Conversation.findByPk(Number(conversationId), {
            include: [
                {
                    model: models_1.ConversationParticipant,
                    as: 'participants',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }],
                },
            ],
        });
        if (!conversation) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        return (0, service_helper_1.successResponse)(res, 'SUCCESS', conversation);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetConversationService');
    }
}
async function updateConversationService(req, res) {
    try {
        const { conversationId } = req.params;
        const { name, description, avatar } = req.body;
        const conversation = await models_1.Conversation.findByPk(Number(conversationId));
        if (!conversation) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        const participant = await models_1.ConversationParticipant.findOne({
            where: { conversationId: Number(conversationId), userId: req.userId },
        });
        if (!participant || !participant.isAdmin) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        if (name)
            conversation.name = name;
        if (description !== undefined)
            conversation.description = description;
        if (avatar)
            conversation.avatar = avatar;
        await conversation.save();
        return (0, service_helper_1.successResponse)(res, 'CONVERSATION_UPDATED', conversation);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'UpdateConversationService');
    }
}
async function addParticipantService(req, res) {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        const participant = await models_1.ConversationParticipant.findOne({
            where: { conversationId, userId: req.userId },
        });
        if (!participant || !participant.isAdmin) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        await models_1.ConversationParticipant.create({ conversationId: Number(conversationId), userId, role: 'member' });
        return (0, service_helper_1.successResponse)(res, 'PARTICIPANT_ADDED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'AddParticipantService');
    }
}
async function removeParticipantService(req, res) {
    try {
        const { conversationId, userId } = req.params;
        const participant = await models_1.ConversationParticipant.findOne({
            where: { conversationId, userId: req.userId },
        });
        if (!participant || !participant.isAdmin) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        await models_1.ConversationParticipant.destroy({ where: { conversationId, userId } });
        return (0, service_helper_1.successResponse)(res, 'PARTICIPANT_REMOVED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'RemoveParticipantService');
    }
}
async function archiveConversationService(req, res) {
    try {
        const { conversationId } = req.params;
        const { archive } = req.body;
        const conversation = await models_1.Conversation.findByPk(Number(conversationId));
        if (!conversation) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        const archivedBy = [...(conversation.archivedBy || [])];
        const uid = req.userId;
        if (archive) {
            if (!archivedBy.includes(uid))
                archivedBy.push(uid);
        }
        else {
            const idx = archivedBy.indexOf(uid);
            if (idx > -1)
                archivedBy.splice(idx, 1);
        }
        conversation.archivedBy = archivedBy;
        conversation.isArchived = archivedBy.length > 0;
        await conversation.save();
        return (0, service_helper_1.successResponse)(res, 'CONVERSATION_ARCHIVED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'ArchiveConversationService');
    }
}
async function pinConversationService(req, res) {
    try {
        const { conversationId } = req.params;
        const { pin } = req.body;
        const conversation = await models_1.Conversation.findByPk(Number(conversationId));
        if (!conversation) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        const pinnedBy = [...(conversation.pinnedBy || [])];
        const uid = req.userId;
        if (pin) {
            if (!pinnedBy.includes(uid))
                pinnedBy.push(uid);
        }
        else {
            const idx = pinnedBy.indexOf(uid);
            if (idx > -1)
                pinnedBy.splice(idx, 1);
        }
        conversation.pinnedBy = pinnedBy;
        conversation.isPinned = pinnedBy.length > 0;
        await conversation.save();
        return (0, service_helper_1.successResponse)(res, 'CONVERSATION_PINNED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'PinConversationService');
    }
}
async function muteConversationService(req, res) {
    try {
        const { conversationId } = req.params;
        const { mutedUntil } = req.body;
        const conversation = await models_1.Conversation.findByPk(Number(conversationId));
        if (!conversation) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        const mutedMap = { ...(conversation.mutedUntil || {}) };
        const uid = String(req.userId);
        if (mutedUntil) {
            mutedMap[uid] = mutedUntil;
        }
        else {
            delete mutedMap[uid];
        }
        conversation.mutedUntil = mutedMap;
        await conversation.save();
        return (0, service_helper_1.successResponse)(res, 'CONVERSATION_MUTED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'MuteConversationService');
    }
}
