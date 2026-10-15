"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesService = getMessagesService;
exports.createMessageService = createMessageService;
exports.editMessageService = editMessageService;
exports.deleteMessageService = deleteMessageService;
exports.markAsReadService = markAsReadService;
exports.addReactionService = addReactionService;
exports.searchMessagesService = searchMessagesService;
const sequelize_1 = require("sequelize");
const models_1 = require("../../../data/models");
const service_helper_1 = require("../../../utils/service.helper");
const responses_1 = require("../../../data/responses");
async function getMessagesService(req, res) {
    try {
        const { conversationId } = req.params;
        const { limit = 50, beforeMessageId } = req.query;
        const where = { conversationId };
        if (beforeMessageId) {
            where.id = { [sequelize_1.Op.lt]: Number(beforeMessageId) };
        }
        const messages = await models_1.Message.findAll({
            where,
            include: [
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
                {
                    model: models_1.MessageReaction,
                    as: 'reactions',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
                },
                {
                    model: models_1.Message,
                    as: 'replyTo',
                    include: [{ model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName'] }],
                },
            ],
            order: [['timestamp', 'DESC']],
            limit: parseInt(String(limit), 10),
        });
        const uid = req.userId;
        const filtered = messages.filter((msg) => {
            if (msg.isDeletedForEveryone)
                return false;
            const deletedFor = msg.deletedForUsers || [];
            return !deletedFor.includes(uid);
        });
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', filtered.reverse());
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetMessagesService');
    }
}
async function createMessageService(req, res) {
    try {
        const { conversationId, content, messageType, mediaUrl, replyToMessageId, location, contact } = req.body;
        const message = await models_1.Message.create({
            conversationId,
            senderId: req.userId,
            content,
            messageType: messageType || 'text',
            mediaUrl,
            replyToMessageId,
            location,
            contact,
        });
        const conversation = await models_1.Conversation.findByPk(conversationId);
        if (conversation) {
            conversation.lastMessageId = message.id;
            conversation.lastMessageAt = new Date();
            await conversation.save();
        }
        await models_1.ConversationParticipant.increment('unreadCount', {
            where: { conversationId, userId: { [sequelize_1.Op.ne]: req.userId } },
        });
        const populated = await models_1.Message.findByPk(message.id, {
            include: [
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
                {
                    model: models_1.MessageReaction,
                    as: 'reactions',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
                },
            ],
        });
        // Emit via socket.io if available
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        if (io && userSockets) {
            const participants = await models_1.ConversationParticipant.findAll({ where: { conversationId } });
            for (const participant of participants) {
                const socketId = userSockets.get(String(participant.userId));
                if (socketId)
                    io.to(socketId).emit('new_message', populated);
            }
        }
        return res.status(responses_1.responses.HTTP_CODES.CREATED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_CREATED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_CREATED.MESSAGE,
            data: [populated],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'CreateMessageService');
    }
}
async function editMessageService(req, res) {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const message = await models_1.Message.findByPk(Number(messageId));
        if (!message) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        if (message.senderId !== req.userId) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        if (message.messageType !== 'text') {
            return res.status(responses_1.responses.HTTP_CODES.BAD_REQUEST).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
                responseMessage: 'Seuls les messages texte peuvent être modifiés.',
                error: 'Seuls les messages texte peuvent être modifiés.',
                data: [],
            });
        }
        const timeDiff = Date.now() - new Date(message.timestamp).getTime();
        if (timeDiff > 24 * 60 * 60 * 1000) {
            return res.status(responses_1.responses.HTTP_CODES.BAD_REQUEST).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.MESSAGE,
                data: [],
            });
        }
        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();
        return (0, service_helper_1.successResponse)(res, 'MESSAGE_EDITED', message);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'EditMessageService');
    }
}
async function deleteMessageService(req, res) {
    try {
        const { messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const message = await models_1.Message.findByPk(Number(messageId));
        if (!message) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        if (message.senderId !== req.userId) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        if (deleteForEveryone) {
            const timeDiff = Date.now() - new Date(message.timestamp).getTime();
            if (timeDiff > 60 * 60 * 1000) {
                return res.status(responses_1.responses.HTTP_CODES.BAD_REQUEST).json({
                    responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.CODE,
                    responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.MESSAGE,
                    error: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.MESSAGE,
                    data: [],
                });
            }
            message.isDeletedForEveryone = true;
            message.deletedForEveryoneAt = new Date();
        }
        else {
            const deletedFor = [...(message.deletedForUsers || [])];
            if (!deletedFor.includes(req.userId))
                deletedFor.push(req.userId);
            message.deletedForUsers = deletedFor;
        }
        await message.save();
        return (0, service_helper_1.successResponse)(res, 'MESSAGE_DELETED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'DeleteMessageService');
    }
}
async function markAsReadService(req, res) {
    try {
        const { conversationId } = req.params;
        const { lastMessageId } = req.body;
        await models_1.Message.update({ isRead: true }, { where: { conversationId, senderId: { [sequelize_1.Op.ne]: req.userId }, isRead: false } });
        await models_1.ConversationParticipant.update({ unreadCount: 0, lastReadMessageId: lastMessageId }, { where: { conversationId, userId: req.userId } });
        return (0, service_helper_1.successResponse)(res, 'SUCCESS');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'MarkAsReadService');
    }
}
async function addReactionService(req, res) {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const message = await models_1.Message.findByPk(Number(messageId));
        if (!message) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        const existing = await models_1.MessageReaction.findOne({ where: { messageId, userId: req.userId } });
        if (existing) {
            if (existing.emoji === emoji) {
                await existing.destroy();
                return res.status(responses_1.responses.HTTP_CODES.RESULT_OK).json({
                    responseCode: responses_1.responses.CALL_BACK_MESSAGES.REACTION_UPDATED.CODE,
                    responseMessage: responses_1.responses.CALL_BACK_MESSAGES.REACTION_UPDATED.MESSAGE,
                    data: [{ removed: true }],
                });
            }
            existing.emoji = emoji;
            await existing.save();
        }
        else {
            await models_1.MessageReaction.create({ messageId: Number(messageId), userId: req.userId, emoji });
        }
        const reactions = await models_1.MessageReaction.findAll({
            where: { messageId },
            include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
        });
        return (0, service_helper_1.successResponse)(res, 'REACTION_UPDATED', reactions);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'AddReactionService');
    }
}
async function searchMessagesService(req, res) {
    try {
        const { query, conversationId } = req.query;
        const where = { content: { [sequelize_1.Op.like]: `%${query}%` }, isDeletedForEveryone: false };
        if (conversationId)
            where.conversationId = conversationId;
        const messages = await models_1.Message.findAll({
            where,
            include: [
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: models_1.Conversation, as: 'conversation', attributes: ['id', 'type', 'name'] },
            ],
            order: [['timestamp', 'DESC']],
            limit: 50,
        });
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', messages);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'SearchMessagesService');
    }
}
