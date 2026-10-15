import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Call, Conversation, ConversationParticipant, User } from '../../../data/models';
import { successResponse, errorResponse } from '../../../utils/service.helper';
import { responses } from '../../../data/responses';

export async function initiateCallService(req: Request, res: Response) {
  try {
    const { conversationId, type } = req.body;

    const call = await Call.create({
      conversationId,
      callerId: req.userId as number,
      type,
      status: 'initiated',
    });

    const populated = await Call.findByPk(call.id, {
      include: [
        { model: User, as: 'caller', attributes: ['id', 'username', 'displayName', 'avatar'] },
        { model: Conversation, as: 'conversation', attributes: ['id', 'type', 'name'] },
      ],
    });

    return res.status(responses.HTTP_CODES.CREATED).json({
      responseCode: responses.CALL_BACK_MESSAGES.CALL_INITIATED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.CALL_INITIATED.MESSAGE,
      data: [populated],
    });
  } catch (error) {
    return errorResponse(res, error, 'InitiateCallService');
  }
}

export async function updateCallStatusService(req: Request, res: Response) {
  try {
    const { callId } = req.params;
    const { status } = req.body;

    const call = await Call.findByPk(Number(callId));
    if (!call) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.CALL_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    call.status = status;
    if (status === 'connected') {
      call.startedAt = new Date();
    } else if (['ended', 'rejected', 'missed'].includes(status)) {
      call.endedAt = new Date();
      if (call.startedAt) {
        call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
      }
    }
    await call.save();

    return successResponse(res, 'CALL_STATUS_UPDATED', call);
  } catch (error) {
    return errorResponse(res, error, 'UpdateCallStatusService');
  }
}

export async function getCallHistoryService(req: Request, res: Response) {
  try {
    const userConvs = await ConversationParticipant.findAll({
      where: { userId: req.userId },
      attributes: ['conversationId'],
    });
    const convIds = userConvs.map((p) => p.conversationId);

    const where =
      convIds.length > 0
        ? {
            [Op.or]: [
              { callerId: req.userId },
              { conversationId: { [Op.in]: convIds } },
            ],
          }
        : { callerId: req.userId };

    const calls = await Call.findAll({
      where,
      include: [
        { model: User, as: 'caller', attributes: ['id', 'username', 'displayName', 'avatar'] },
        { model: Conversation, as: 'conversation', attributes: ['id', 'type', 'name', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return successResponse(res, 'LIST_RETRIEVED', calls);
  } catch (error) {
    return errorResponse(res, error, 'GetCallHistoryService');
  }
}
