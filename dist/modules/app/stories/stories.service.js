"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoriesService = getStoriesService;
exports.createStoryService = createStoryService;
exports.viewStoryService = viewStoryService;
exports.deleteStoryService = deleteStoryService;
const sequelize_1 = require("sequelize");
const models_1 = require("../../../data/models");
const service_helper_1 = require("../../../utils/service.helper");
const responses_1 = require("../../../data/responses");
async function getStoriesService(req, res) {
    try {
        const stories = await models_1.Story.findAll({
            where: { expiresAt: { [sequelize_1.Op.gt]: new Date() } },
            include: [
                { model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar'] },
                {
                    model: models_1.StoryViewer,
                    as: 'viewers',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        const formatted = stories.map((story) => {
            const json = story.toJSON();
            const viewers = (json.viewers || []).map((v) => ({
                userId: v.userId,
                username: v.user?.username || '',
                displayName: v.user?.displayName || '',
                viewedAt: v.viewedAt || v.createdAt,
            }));
            return { ...json, viewers };
        });
        return (0, service_helper_1.successResponse)(res, 'LIST_RETRIEVED', formatted);
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'GetStoriesService');
    }
}
async function createStoryService(req, res) {
    try {
        const { mediaUrl, mediaType, caption } = req.body;
        if (!mediaUrl) {
            return res.status(responses_1.responses.HTTP_CODES.VALIDATION_ERROR).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.CODE,
                responseMessage: 'mediaUrl est requis.',
                error: 'mediaUrl est requis.',
                data: [],
            });
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const story = await models_1.Story.create({
            userId: req.userId,
            mediaUrl,
            mediaType: mediaType || 'image',
            caption: caption || null,
            expiresAt,
        });
        const populated = await models_1.Story.findByPk(story.id, {
            include: [{ model: models_1.User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar'] }],
        });
        const json = (populated?.toJSON() || {});
        json.viewers = [];
        return res.status(responses_1.responses.HTTP_CODES.CREATED).json({
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.STORY_CREATED.CODE,
            responseMessage: responses_1.responses.CALL_BACK_MESSAGES.STORY_CREATED.MESSAGE,
            data: [json],
        });
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'CreateStoryService');
    }
}
async function viewStoryService(req, res) {
    try {
        const { storyId } = req.params;
        const story = await models_1.Story.findByPk(Number(storyId));
        if (!story) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        await models_1.StoryViewer.findOrCreate({
            where: { storyId: Number(storyId), userId: req.userId },
            defaults: { storyId: Number(storyId), userId: req.userId, viewedAt: new Date() },
        });
        return (0, service_helper_1.successResponse)(res, 'STORY_VIEWED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'ViewStoryService');
    }
}
async function deleteStoryService(req, res) {
    try {
        const { storyId } = req.params;
        const story = await models_1.Story.findByPk(Number(storyId));
        if (!story) {
            return res.status(responses_1.responses.HTTP_CODES.NOT_FOUND).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
                data: [],
            });
        }
        if (story.userId !== req.userId) {
            return res.status(responses_1.responses.HTTP_CODES.FORBIDDEN).json({
                responseCode: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
                responseMessage: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                error: responses_1.responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
                data: [],
            });
        }
        await story.destroy();
        return (0, service_helper_1.successResponse)(res, 'STORY_DELETED');
    }
    catch (error) {
        return (0, service_helper_1.errorResponse)(res, error, 'DeleteStoryService');
    }
}
