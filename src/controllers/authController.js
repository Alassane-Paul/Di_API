const { User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password, displayName } = req.body;

      const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Generate key pair for end-to-end encryption
      const publicKey = crypto.randomBytes(32).toString('hex');

      const user = await User.create({
        username,
        email,
        password,
        displayName: displayName || username,
        publicKey
      });

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          status: user.status,
          publicKey: user.publicKey
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { username, password, deviceId } = req.body;

      const user = await User.findOne({ where: { username } });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      user.isOnline = true;
      user.lastSeen = new Date();
      if (deviceId) user.deviceId = deviceId;
      await user.save();

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          status: user.status,
          publicKey: user.publicKey
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password'] }
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { displayName, avatar, status } = req.body;
      const user = await User.findByPk(req.userId);

      if (displayName) user.displayName = displayName;
      if (avatar) user.avatar = avatar;
      if (status !== undefined) user.status = status;

      await user.save();

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async searchUsers(req, res) {
    try {
      const { query } = req.query;
      const users = await User.findAll({
        where: {
          id: { [Op.ne]: req.userId },
          [Op.or]: [
            { username: { [Op.like]: `%${query}%` } },
            { displayName: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: ['id', 'username', 'displayName', 'avatar', 'status', 'isOnline', 'lastSeen'],
        limit: 20
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
