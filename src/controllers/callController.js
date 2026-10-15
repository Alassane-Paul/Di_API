const { Call, Conversation, ConversationParticipant, User } = require('../models');
const { Op } = require('sequelize');

class CallController {
  async initiateCall(req, res) {
    try {
      const { conversationId, type } = req.body;

      const call = await Call.create({
        conversationId,
        callerId: req.userId,
        type,
        status: 'initiated'
      });

      const populatedCall = await Call.findByPk(call.id, {
        include: [
          {
            model: User,
            as: 'caller',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: Conversation,
            attributes: ['id', 'type', 'name']
          }
        ]
      });

      res.status(201).json(populatedCall);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateCallStatus(req, res) {
    try {
      const { callId } = req.params;
      const { status } = req.body;

      const call = await Call.findByPk(callId);
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      call.status = status;

      if (status === 'connected') {
        call.startedAt = new Date();
      } else if (status === 'ended' || status === 'rejected' || status === 'missed') {
        call.endedAt = new Date();
        if (call.startedAt) {
          call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
        }
      }

      await call.save();

      res.json(call);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getCallHistory(req, res) {
    try {
      const userConvs = await ConversationParticipant.findAll({
        where: { userId: req.userId },
        attributes: ['conversationId']
      });
      const convIds = userConvs.map(p => p.conversationId);

      const whereClause = convIds.length > 0
        ? {
            [Op.or]: [
              { callerId: req.userId },
              { conversationId: { [Op.in]: convIds } }
            ]
          }
        : { callerId: req.userId };

      const calls = await Call.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'caller',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: Conversation,
            attributes: ['id', 'type', 'name', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json(calls);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CallController();
