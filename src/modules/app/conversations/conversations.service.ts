import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Conversation, ConversationParticipant, User, Message } from '../../../data/models';
import { successResponse, errorResponse } from '../../../utils/service.helper';
import { responses } from '../../../data/responses';

export async function getConversationsService(req: Request, res: Response) {
  try {
    const participations = await ConversationParticipant.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            {
              model: Message,
              as: 'lastMessage',
              include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] }],
            },
          ],
        },
      ],
      order: [[{ model: Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']],
    });

    const enriched = await Promise.all(
      participations.map(async (cp: any) => {
        const participants = await ConversationParticipant.findAll({
          where: { conversationId: cp.conversationId },
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }],
        });

        return {
          ...(cp.conversation?.toJSON?.() || {}),
          participants: participants.map((p: any) => p.user?.toJSON?.() || p.user),
          unreadCount: cp.unreadCount,
          lastReadMessageId: cp.lastReadMessageId,
        };
      })
    );

    return successResponse(res, 'LIST_RETRIEVED', enriched);
  } catch (error) {
    return errorResponse(res, error, 'GetConversationsService');
  }
}

export async function createConversationService(req: Request, res: Response) {
  try {
    const { type, name, description, participantIds } = req.body;

    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : null,
      description,
      createdBy: req.userId as number,
    });

    await ConversationParticipant.create({
      conversationId: conversation.id,
      userId: req.userId as number,
      role: 'admin',
      isAdmin: true,
    });

    if (participantIds && participantIds.length > 0) {
      for (const userId of participantIds) {
        await ConversationParticipant.create({
          conversationId: conversation.id,
          userId,
          role: 'member',
        });
      }
    }

    const populated = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline'] }],
        },
      ],
    });

    return res.status(responses.HTTP_CODES.CREATED).json({
      responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_CREATED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_CREATED.MESSAGE,
      data: [populated],
    });
  } catch (error) {
    return errorResponse(res, error, 'CreateConversationService');
  }
}

export async function getConversationService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByPk(Number(conversationId), {
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }],
        },
      ],
    });

    if (!conversation) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    return successResponse(res, 'SUCCESS', conversation);
  } catch (error) {
    return errorResponse(res, error, 'GetConversationService');
  }
}

export async function updateConversationService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { name, description, avatar } = req.body;

    const conversation = await Conversation.findByPk(Number(conversationId));
    if (!conversation) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    const participant = await ConversationParticipant.findOne({
      where: { conversationId: Number(conversationId), userId: req.userId },
    });

    if (!participant || !participant.isAdmin) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar) conversation.avatar = avatar;
    await conversation.save();

    return successResponse(res, 'CONVERSATION_UPDATED', conversation);
  } catch (error) {
    return errorResponse(res, error, 'UpdateConversationService');
  }
}

export async function addParticipantService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId: req.userId },
    });

    if (!participant || !participant.isAdmin) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    await ConversationParticipant.create({ conversationId: Number(conversationId), userId, role: 'member' });
    return successResponse(res, 'PARTICIPANT_ADDED');
  } catch (error) {
    return errorResponse(res, error, 'AddParticipantService');
  }
}

export async function removeParticipantService(req: Request, res: Response) {
  try {
    const { conversationId, userId } = req.params;

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId: req.userId },
    });

    if (!participant || !participant.isAdmin) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    await ConversationParticipant.destroy({ where: { conversationId, userId } });
    return successResponse(res, 'PARTICIPANT_REMOVED');
  } catch (error) {
    return errorResponse(res, error, 'RemoveParticipantService');
  }
}

export async function archiveConversationService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { archive } = req.body;

    const conversation = await Conversation.findByPk(Number(conversationId));
    if (!conversation) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    const archivedBy: number[] = [...(conversation.archivedBy || [])];
    const uid = req.userId as number;
    if (archive) {
      if (!archivedBy.includes(uid)) archivedBy.push(uid);
    } else {
      const idx = archivedBy.indexOf(uid);
      if (idx > -1) archivedBy.splice(idx, 1);
    }

    conversation.archivedBy = archivedBy;
    conversation.isArchived = archivedBy.length > 0;
    await conversation.save();

    return successResponse(res, 'CONVERSATION_ARCHIVED');
  } catch (error) {
    return errorResponse(res, error, 'ArchiveConversationService');
  }
}

export async function pinConversationService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { pin } = req.body;

    const conversation = await Conversation.findByPk(Number(conversationId));
    if (!conversation) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    const pinnedBy: number[] = [...(conversation.pinnedBy || [])];
    const uid = req.userId as number;
    if (pin) {
      if (!pinnedBy.includes(uid)) pinnedBy.push(uid);
    } else {
      const idx = pinnedBy.indexOf(uid);
      if (idx > -1) pinnedBy.splice(idx, 1);
    }

    conversation.pinnedBy = pinnedBy;
    conversation.isPinned = pinnedBy.length > 0;
    await conversation.save();

    return successResponse(res, 'CONVERSATION_PINNED');
  } catch (error) {
    return errorResponse(res, error, 'PinConversationService');
  }
}

export async function muteConversationService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { mutedUntil } = req.body;

    const conversation = await Conversation.findByPk(Number(conversationId));
    if (!conversation) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CONVERSATION_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    const mutedMap: Record<string, string> = { ...(conversation.mutedUntil || {}) };
    const uid = String(req.userId);
    if (mutedUntil) {
      mutedMap[uid] = mutedUntil;
    } else {
      delete mutedMap[uid];
    }
    conversation.mutedUntil = mutedMap;
    await conversation.save();

    return successResponse(res, 'CONVERSATION_MUTED');
  } catch (error) {
    return errorResponse(res, error, 'MuteConversationService');
  }
}
