import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Message, Conversation, ConversationParticipant, User, MessageReaction } from '../../../data/models';
import { successResponse, errorResponse } from '../../../utils/service.helper';
import { responses } from '../../../data/responses';

export async function getMessagesService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { limit = 50, beforeMessageId } = req.query;

    const where: any = { conversationId };
    if (beforeMessageId) {
      where.id = { [Op.lt]: Number(beforeMessageId) };
    }

    const messages = await Message.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
        {
          model: MessageReaction,
          as: 'reactions',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
        },
        {
          model: Message,
          as: 'replyTo',
          include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'displayName'] }],
        },
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(String(limit), 10),
    });

    const uid = req.userId as number;
    const filtered = messages.filter((msg) => {
      if (msg.isDeletedForEveryone) return false;
      const deletedFor: number[] = msg.deletedForUsers || [];
      return !deletedFor.includes(uid);
    });

    return successResponse(res, 'LIST_RETRIEVED', filtered.reverse());
  } catch (error) {
    return errorResponse(res, error, 'GetMessagesService');
  }
}

export async function createMessageService(req: Request, res: Response) {
  try {
    const { conversationId, content, messageType, mediaUrl, replyToMessageId, location, contact } = req.body;

    const message = await Message.create({
      conversationId,
      senderId: req.userId as number,
      content,
      messageType: messageType || 'text',
      mediaUrl,
      replyToMessageId,
      location,
      contact,
    });

    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      conversation.lastMessageId = message.id;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    await ConversationParticipant.increment('unreadCount', {
      where: { conversationId, userId: { [Op.ne]: req.userId } },
    });

    const populated = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
        {
          model: MessageReaction,
          as: 'reactions',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
        },
      ],
    });

    // Emit via socket.io if available
    const io = req.app.get('io');
    const userSockets: Map<string, string> = req.app.get('userSockets');
    if (io && userSockets) {
      const participants = await ConversationParticipant.findAll({ where: { conversationId } });
      for (const participant of participants) {
        const socketId = userSockets.get(String(participant.userId));
        if (socketId) io.to(socketId).emit('new_message', populated);
      }
    }

    return res.status(responses.HTTP_CODES.CREATED).json({
      responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_CREATED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_CREATED.MESSAGE,
      data: [populated],
    });
  } catch (error) {
    return errorResponse(res, error, 'CreateMessageService');
  }
}

export async function editMessageService(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findByPk(Number(messageId));
    if (!message) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    if (message.senderId !== req.userId) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    if (message.messageType !== 'text') {
      return res.status(responses.HTTP_CODES.BAD_REQUEST).json({
        responseCode: responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
        responseMessage: 'Seuls les messages texte peuvent être modifiés.',
        error: 'Seuls les messages texte peuvent être modifiés.',
        data: [],
      });
    }

    const timeDiff = Date.now() - new Date(message.timestamp).getTime();
    if (timeDiff > 24 * 60 * 60 * 1000) {
      return res.status(responses.HTTP_CODES.BAD_REQUEST).json({
        responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.MESSAGE_EDIT_TIME_EXPIRED.MESSAGE,
        data: [],
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return successResponse(res, 'MESSAGE_EDITED', message);
  } catch (error) {
    return errorResponse(res, error, 'EditMessageService');
  }
}

export async function deleteMessageService(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findByPk(Number(messageId));
    if (!message) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    if (message.senderId !== req.userId) {
      return res.status(responses.HTTP_CODES.FORBIDDEN).json({
        responseCode: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.FORBIDDEN_PERMISSION.MESSAGE,
        data: [],
      });
    }

    if (deleteForEveryone) {
      const timeDiff = Date.now() - new Date(message.timestamp).getTime();
      if (timeDiff > 60 * 60 * 1000) {
        return res.status(responses.HTTP_CODES.BAD_REQUEST).json({
          responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.CODE,
          responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.MESSAGE,
          error: responses.CALL_BACK_MESSAGES.MESSAGE_DELETE_TIME_EXPIRED.MESSAGE,
          data: [],
        });
      }
      message.isDeletedForEveryone = true;
      message.deletedForEveryoneAt = new Date();
    } else {
      const deletedFor: number[] = [...(message.deletedForUsers || [])];
      if (!deletedFor.includes(req.userId as number)) deletedFor.push(req.userId as number);
      message.deletedForUsers = deletedFor;
    }
    await message.save();

    return successResponse(res, 'MESSAGE_DELETED');
  } catch (error) {
    return errorResponse(res, error, 'DeleteMessageService');
  }
}

export async function markAsReadService(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { lastMessageId } = req.body;

    await Message.update(
      { isRead: true },
      { where: { conversationId, senderId: { [Op.ne]: req.userId }, isRead: false } }
    );

    await ConversationParticipant.update(
      { unreadCount: 0, lastReadMessageId: lastMessageId },
      { where: { conversationId, userId: req.userId } }
    );

    return successResponse(res, 'SUCCESS');
  } catch (error) {
    return errorResponse(res, error, 'MarkAsReadService');
  }
}

export async function addReactionService(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findByPk(Number(messageId));
    if (!message) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.MESSAGE_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    const existing = await MessageReaction.findOne({ where: { messageId, userId: req.userId } });

    if (existing) {
      if (existing.emoji === emoji) {
        await existing.destroy();
        return res.status(responses.HTTP_CODES.RESULT_OK).json({
          responseCode: responses.CALL_BACK_MESSAGES.REACTION_UPDATED.CODE,
          responseMessage: responses.CALL_BACK_MESSAGES.REACTION_UPDATED.MESSAGE,
          data: [{ removed: true }],
        });
      }
      existing.emoji = emoji;
      await existing.save();
    } else {
      await MessageReaction.create({ messageId: Number(messageId), userId: req.userId as number, emoji });
    }

    const reactions = await MessageReaction.findAll({
      where: { messageId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }],
    });

    return successResponse(res, 'REACTION_UPDATED', reactions);
  } catch (error) {
    return errorResponse(res, error, 'AddReactionService');
  }
}

export async function searchMessagesService(req: Request, res: Response) {
  try {
    const { query, conversationId } = req.query as { query: string; conversationId?: string };

    const where: any = { content: { [Op.like]: `%${query}%` }, isDeletedForEveryone: false };
    if (conversationId) where.conversationId = conversationId;

    const messages = await Message.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
        { model: Conversation, as: 'conversation', attributes: ['id', 'type', 'name'] },
      ],
      order: [['timestamp', 'DESC']],
      limit: 50,
    });

    return successResponse(res, 'LIST_RETRIEVED', messages);
  } catch (error) {
    return errorResponse(res, error, 'SearchMessagesService');
  }
}
