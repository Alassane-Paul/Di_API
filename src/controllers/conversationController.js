const { Conversation, ConversationParticipant, User, Message } = require('../models');
const { Op } = require('sequelize');

class ConversationController {
  async getConversations(req, res) {
    try {
      const conversations = await ConversationParticipant.findAll({
        where: { userId: req.userId },
        include: [
          {
            model: Conversation,
            include: [
              {
                model: Message,
                as: 'lastMessage',
                include: [
                  { model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] }
                ]
              }
            ]
          }
        ],
        order: [[{ model: Conversation }, 'lastMessageAt', 'DESC']]
      });

      // Enrich with participant info
      const enrichedConversations = await Promise.all(
        conversations.map(async (cp) => {
          const participants = await ConversationParticipant.findAll({
            where: { conversationId: cp.conversationId },
            include: [
              { model: User, attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }
            ]
          });

          return {
            ...cp.conversation.toJSON(),
            participants: participants.map(p => p.user.toJSON()),
            unreadCount: cp.unreadCount,
            lastReadMessageId: cp.lastReadMessageId
          };
        })
      );

      res.json(enrichedConversations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createConversation(req, res) {
    try {
      const { type, name, description, participantIds } = req.body;

      const conversation = await Conversation.create({
        type,
        name: type === 'group' ? name : null,
        description,
        createdBy: req.userId
      });

      // Add creator as admin
      await ConversationParticipant.create({
        conversationId: conversation.id,
        userId: req.userId,
        role: 'admin',
        isAdmin: true
      });

      // Add other participants
      if (participantIds && participantIds.length > 0) {
        for (const userId of participantIds) {
          await ConversationParticipant.create({
            conversationId: conversation.id,
            userId,
            role: 'member'
          });
        }
      }

      const populatedConversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: ConversationParticipant,
            include: [
              { model: User, attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline'] }
            ]
          }
        ]
      });

      res.status(201).json(populatedConversation);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: ConversationParticipant,
            include: [
              { model: User, attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen'] }
            ]
          }
        ]
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { name, description, avatar } = req.body;

      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Check if user is admin
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: req.userId }
      });

      if (!participant || !participant.isAdmin) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (name) conversation.name = name;
      if (description !== undefined) conversation.description = description;
      if (avatar) conversation.avatar = avatar;

      await conversation.save();

      res.json(conversation);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async addParticipant(req, res) {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;

      // Check if user is admin
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: req.userId }
      });

      if (!participant || !participant.isAdmin) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await ConversationParticipant.create({
        conversationId,
        userId,
        role: 'member'
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async removeParticipant(req, res) {
    try {
      const { conversationId, userId } = req.params;

      // Check if requester is admin
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: req.userId }
      });

      if (!participant || !participant.isAdmin) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await ConversationParticipant.destroy({
        where: { conversationId, userId }
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async archiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { archive } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const archivedBy = conversation.archivedBy || [];
      if (archive) {
        if (!archivedBy.includes(req.userId)) {
          archivedBy.push(req.userId);
        }
      } else {
        const index = archivedBy.indexOf(req.userId);
        if (index > -1) {
          archivedBy.splice(index, 1);
        }
      }

      conversation.archivedBy = archivedBy;
      conversation.isArchived = archivedBy.length > 0;
      await conversation.save();

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async pinConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { pin } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const pinnedBy = conversation.pinnedBy || [];
      if (pin) {
        if (!pinnedBy.includes(req.userId)) {
          pinnedBy.push(req.userId);
        }
      } else {
        const index = pinnedBy.indexOf(req.userId);
        if (index > -1) {
          pinnedBy.splice(index, 1);
        }
      }

      conversation.pinnedBy = pinnedBy;
      conversation.isPinned = pinnedBy.length > 0;
      await conversation.save();

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async muteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { mutedUntil } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const mutedUntilMap = conversation.mutedUntil || {};
      if (mutedUntil) {
        mutedUntilMap[req.userId] = mutedUntil;
      } else {
        delete mutedUntilMap[req.userId];
      }

      conversation.mutedUntil = mutedUntilMap;
      await conversation.save();

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ConversationController();
