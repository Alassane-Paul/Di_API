const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const callRoutes = require('./routes/calls');
const storyRoutes = require('./routes/stories');
const spyRoutes = require('./routes/spy');
const SurveillanceService = require('./services/surveillanceService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: config.socket.cors
});

// Socket maps
const connectedUsers = new Map(); // socket.id -> String(userId)
const userSockets = new Map(); // String(userId) -> socket.id

// Make io & userSockets accessible in express controllers
app.set('io', io);
app.set('userSockets', userSockets);

// Connect to MySQL and sync database
testConnection();
syncDatabase();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting for production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, veuillez patienter.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.dir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize }
});

// Static files
app.use('/uploads', express.static(config.upload.dir));

// Healthcheck endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/spy', spyRoutes);
app.get('/spy', (req, res) => res.redirect('/api/spy/dashboard'));

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mediaUrl = `/uploads/${req.file.filename}`;
  let mediaType = 'document';

  if (req.file.mimetype.startsWith('image/')) {
    mediaType = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    mediaType = 'video';
  } else if (req.file.mimetype.startsWith('audio/')) {
    mediaType = 'audio';
  }

  res.json({
    mediaUrl,
    mediaType,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté:', socket.id);

  socket.on('join', async (userId) => {
    if (!userId) return;
    const uidStr = String(userId);
    connectedUsers.set(socket.id, uidStr);
    userSockets.set(uidStr, socket.id);
    socket.userId = uidStr;

    // Update user online status
    try {
      const { User } = require('./models');
      await User.update(
        { isOnline: true, lastSeen: new Date() },
        { where: { id: userId } }
      );
    } catch (err) {
      console.error('Error updating user online status:', err);
    }

    // Notify others
    socket.broadcast.emit('user_online', { userId: uidStr });
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, messageType, mediaUrl, replyToMessageId } = data;
      const sender = socket.userId;

      const { Message, User, Conversation, ConversationParticipant } = require('./models');
      const message = await Message.create({
        conversationId,
        senderId: sender,
        content,
        messageType: messageType || 'text',
        mediaUrl,
        replyToMessageId
      });

      // Update conversation last message
      const conversation = await Conversation.findByPk(conversationId);
      if (conversation) {
        conversation.lastMessageId = message.id;
        conversation.lastMessageAt = new Date();
        await conversation.save();
      }

      const populatedMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'displayName', 'avatar']
          }
        ]
      });

      // Get conversation participants
      const participants = await ConversationParticipant.findAll({
        where: { conversationId }
      });

      // Send to all participants
      for (const participant of participants) {
        const participantSocketId = userSockets.get(String(participant.userId));
        if (participantSocketId) {
          io.to(participantSocketId).emit('new_message', populatedMessage);
        }
      }

      // Send back to sender for confirmation
      socket.emit('message_sent', populatedMessage);
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('typing', (data) => {
    const { conversationId } = data || {};
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId
      });
    }
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // WebRTC signaling
  socket.on('call_offer', (data) => {
    const { callId, offer, receiverId } = data || {};
    const receiverSocketId = userSockets.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_offer', {
        callId,
        offer,
        callerId: socket.userId
      });
    }
  });

  socket.on('call_answer', (data) => {
    const { callId, answer, callerId } = data || {};
    const callerSocketId = userSockets.get(String(callerId));
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_answer', {
        callId,
        answer
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    const { callId, candidate, targetUserId } = data || {};
    const targetSocketId = userSockets.get(String(targetUserId));
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', {
        callId,
        candidate
      });
    }
  });

  socket.on('end_call', (data) => {
    const { callId, receiverId } = data || {};
    const receiverSocketId = userSockets.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_ended', { callId });
    }
  });

  // Surveillance event
  socket.on('surveillance_toggle', (data) => {
    const { enabled } = data || {};
    if (enabled) {
      surveillanceService.startWatcher();
    } else {
      surveillanceService.stop();
    }
  });

  socket.on('disconnect', async () => {
    console.log('👤 Utilisateur déconnecté:', socket.id);

    if (socket.userId) {
      const uid = socket.userId;
      connectedUsers.delete(socket.id);
      userSockets.delete(uid);

      try {
        const { User } = require('./models');
        await User.update(
          { isOnline: false, lastSeen: new Date() },
          { where: { id: uid } }
        );
      } catch (err) {
        console.error('Error updating user offline status:', err);
      }

      socket.broadcast.emit('user_offline', { userId: uid });
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// Initialize surveillance service
const surveillanceService = new SurveillanceService(io);
if (config.surveillance.enabled) {
  surveillanceService.startWatcher();
}

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Serveur actif sur le port ${config.port}`);
  console.log(`📡 Socket.io prêt`);
  console.log(`🔐 Chiffrement: ${config.encryption.enabled ? 'Activé' : 'Désactivé'}`);
  if (config.surveillance.enabled) {
    console.log(`👀 Surveillance active sur: ${config.surveillance.watchDirs.join(', ')}`);
  }
});

module.exports = { app, server, io };
