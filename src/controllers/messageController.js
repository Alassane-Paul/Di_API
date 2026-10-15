const { Message, Conversation, ConversationParticipant, User, MessageReaction } = require('../models');
const { Op } = require('sequelize');

class MessageController {
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, beforeMessageId } = req.query;

      const whereClause = { conversationId };
      if (beforeMessageId) {
        whereClause.id = { [Op.lt]: beforeMessageId };
      }

      const messages = await Message.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: MessageReaction,
            as: 'reactions',
            include: [
              { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
            ]
          },
          {
            model: Message,
            as: 'replyTo',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'username', 'displayName'] }
            ]
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });

      // Check if message is deleted for current user
      const filteredMessages = messages.filter(msg => {
        if (msg.isDeletedForEveryone) return false;
        const deletedForUsers = msg.deletedForUsers || [];
        return !deletedForUsers.includes(req.userId);
      });

      res.json(filteredMessages.reverse());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createMessage(req, res) {
    try {
      const { conversationId, content, messageType, mediaUrl, replyToMessageId, location, contact } = req.body;

      const message = await Message.create({
        conversationId,
        senderId: req.userId,
        content,
        messageType: messageType || 'text',
        mediaUrl,
        replyToMessageId,
        location,
        contact
      });

      // Update conversation last message
      const conversation = await Conversation.findByPk(conversationId);
      conversation.lastMessageId = message.id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      // Update unread count for all participants except sender
      await ConversationParticipant.increment('unreadCount', {
        where: {
          conversationId,
          userId: { [Op.ne]: req.userId }
        }
      });

      const populatedMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: MessageReaction,
            as: 'reactions',
            include: [
              { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
            ]
          }
        ]
      });

      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      if (io && userSockets) {
        const participants = await ConversationParticipant.findAll({
          where: { conversationId }
        });
        for (const participant of participants) {
          const participantSocketId = userSockets.get(String(participant.userId));
          if (participantSocketId) {
            io.to(participantSocketId).emit('new_message', populatedMessage);
          }
        }
      }

      res.status(201).json(populatedMessage);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.senderId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Can only edit text messages within 24 hours
      if (message.messageType !== 'text') {
        return res.status(400).json({ error: 'Can only edit text messages' });
      }

      const timeDiff = Date.now() - new Date(message.timestamp).getTime();
      if (timeDiff > 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Can only edit messages within 24 hours' });
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      res.json(message);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { deleteForEveryone } = req.body;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.senderId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (deleteForEveryone) {
        // Can only delete for everyone within 1 hour
        const timeDiff = Date.now() - new Date(message.timestamp).getTime();
        if (timeDiff > 60 * 60 * 1000) {
          return res.status(400).json({ error: 'Can only delete for everyone within 1 hour' });
        }

        message.isDeletedForEveryone = true;
        message.deletedForEveryoneAt = new Date();
        await message.save();
      } else {
        const deletedForUsers = message.deletedForUsers || [];
        if (!deletedForUsers.includes(req.userId)) {
          deletedForUsers.push(req.userId);
        }
        message.deletedForUsers = deletedForUsers;
        await message.save();
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const { lastMessageId } = req.body;

      // Mark messages as read
      await Message.update(
        { isRead: true },
        {
          where: {
            conversationId,
            senderId: { [Op.ne]: req.userId },
            isRead: false
          }
        }
      );

      // Update participant unread count
      await ConversationParticipant.update(
        { unreadCount: 0, lastReadMessageId: lastMessageId },
        {
          where: {
            conversationId,
            userId: req.userId
          }
        }
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if reaction already exists
      const existingReaction = await MessageReaction.findOne({
        where: { messageId, userId: req.userId }
      });

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          // Remove reaction
          await existingReaction.destroy();
          return res.json({ success: true, removed: true });
        } else {
          // Update reaction
          existingReaction.emoji = emoji;
          await existingReaction.save();
        }
      } else {
        await MessageReaction.create({
          messageId,
          userId: req.userId,
          emoji
        });
      }

      const reactions = await MessageReaction.findAll({
        where: { messageId },
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
        ]
      });

      res.json(reactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async searchMessages(req, res) {
    try {
      const { query, conversationId } = req.query;

      const whereClause = {
        content: { [Op.like]: `%${query}%` },
        isDeletedForEveryone: false
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      const messages = await Message.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: Conversation,
            attributes: ['id', 'type', 'name']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 50
      });

      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new MessageController();
