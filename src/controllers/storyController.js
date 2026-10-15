const { Story, StoryViewer, User } = require('../models');
const { Op } = require('sequelize');

class StoryController {
  async getStories(req, res) {
    try {
      const now = new Date();
      const stories = await Story.findAll({
        where: {
          expiresAt: {
            [Op.gt]: now
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatar']
          },
          {
            model: StoryViewer,
            as: 'viewers',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'displayName']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const formatted = stories.map(story => {
        const json = story.toJSON();
        const formattedViewers = (json.viewers || []).map(v => ({
          userId: v.userId,
          username: v.user ? v.user.username : '',
          displayName: v.user ? v.user.displayName : '',
          viewedAt: v.viewedAt || v.createdAt
        }));

        return {
          ...json,
          viewers: formattedViewers
        };
      });

      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createStory(req, res) {
    try {
      const { mediaUrl, mediaType, caption } = req.body;

      if (!mediaUrl) {
        return res.status(400).json({ error: 'mediaUrl is required' });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const story = await Story.create({
        userId: req.userId,
        mediaUrl,
        mediaType: mediaType || 'image',
        caption: caption || null,
        expiresAt
      });

      const populatedStory = await Story.findByPk(story.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'displayName', 'avatar']
          }
        ]
      });

      const json = populatedStory.toJSON();
      json.viewers = [];

      res.status(201).json(json);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async viewStory(req, res) {
    try {
      const { storyId } = req.params;

      const story = await Story.findByPk(storyId);
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      await StoryViewer.findOrCreate({
        where: {
          storyId,
          userId: req.userId
        },
        defaults: {
          storyId,
          userId: req.userId,
          viewedAt: new Date()
        }
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteStory(req, res) {
    try {
      const { storyId } = req.params;

      const story = await Story.findByPk(storyId);
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      if (story.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await story.destroy();
      res.json({ message: 'Story deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new StoryController();
