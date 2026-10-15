import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Story, StoryViewer, User } from '../../../data/models';
import { successResponse, errorResponse } from '../../../utils/service.helper';
import { responses } from '../../../data/responses';

export async function getStoriesService(req: Request, res: Response) {
  try {
    const stories = await Story.findAll({
      where: { expiresAt: { [Op.gt]: new Date() } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar'] },
        {
          model: StoryViewer,
          as: 'viewers',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formatted = stories.map((story) => {
      const json = story.toJSON() as any;
      const viewers = (json.viewers || []).map((v: any) => ({
        userId: v.userId,
        username: v.user?.username || '',
        displayName: v.user?.displayName || '',
        viewedAt: v.viewedAt || v.createdAt,
      }));
      return { ...json, viewers };
    });

    return successResponse(res, 'LIST_RETRIEVED', formatted);
  } catch (error) {
    return errorResponse(res, error, 'GetStoriesService');
  }
}

export async function createStoryService(req: Request, res: Response) {
  try {
    const { mediaUrl, mediaType, caption } = req.body;

    if (!mediaUrl) {
      return res.status(responses.HTTP_CODES.VALIDATION_ERROR).json({
        responseCode: responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.CODE,
        responseMessage: 'mediaUrl est requis.',
        error: 'mediaUrl est requis.',
        data: [],
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await Story.create({
      userId: req.userId as number,
      mediaUrl,
      mediaType: mediaType || 'image',
      caption: caption || null,
      expiresAt,
    });

    const populated = await Story.findByPk(story.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar'] }],
    });

    const json = (populated?.toJSON() || {}) as any;
    json.viewers = [];

    return res.status(responses.HTTP_CODES.CREATED).json({
      responseCode: responses.CALL_BACK_MESSAGES.STORY_CREATED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.STORY_CREATED.MESSAGE,
      data: [json],
    });
  } catch (error) {
    return errorResponse(res, error, 'CreateStoryService');
  }
}

export async function viewStoryService(req: Request, res: Response) {
  try {
    const { storyId } = req.params;

    const story = await Story.findByPk(Number(storyId));
    if (!story) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    await StoryViewer.findOrCreate({
      where: { storyId: Number(storyId), userId: req.userId as number },
      defaults: { storyId: Number(storyId), userId: req.userId as number, viewedAt: new Date() },
    });

    return successResponse(res, 'STORY_VIEWED');
  } catch (error) {
    return errorResponse(res, error, 'ViewStoryService');
  }
}

export async function deleteStoryService(req: Request, res: Response) {
  try {
    const { storyId } = req.params;

    const story = await Story.findByPk(Number(storyId));
    if (!story) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.STORY_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    if (story.userId !== req.userId) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    await story.destroy();
    return successResponse(res, 'STORY_DELETED');
  } catch (error) {
    return errorResponse(res, error, 'DeleteStoryService');
  }
}
