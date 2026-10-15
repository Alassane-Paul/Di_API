import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import { config } from './configs/app.config';
import { db, testConnection, syncDatabase, User, Conversation, Message, ConversationParticipant } from './data/models';
import { appRouter } from './modules/app/app.route';
import { globalLimiter, uploadLimiter } from './middlewares/ratelimit.middleware';
import { SurveillanceService } from './services/surveillanceService';

const app = express();
const server = http.createServer(app);

// ─── Socket.io ─────────────────────────────────────────────────────────────────
const io = new SocketServer(server, { cors: config.socket.cors });
const connectedUsers = new Map<string, string>(); // socket.id → String(userId)
const userSockets = new Map<string, string>();     // String(userId) → socket.id

app.set('io', io);
app.set('userSockets', userSockets);

// ─── Security Middlewares ───────────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  hidePoweredBy: true,
}));

app.use(cors(config.cors));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ─── Upload setup ──────────────────────────────────────────────────────────────
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: config.upload.maxSize } });

// ─── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(config.upload.dir));
app.use('/public', express.static(path.join(__dirname, '../public')));

// ─── Health endpoints ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() }));

// ─── File upload endpoint ──────────────────────────────────────────────────────
app.post('/api/upload', uploadLimiter, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mediaUrl = `/uploads/${req.file.filename}`;
  let mediaType = 'document';
  if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
  else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
  else if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';

  return res.json({ mediaUrl, mediaType, filename: req.file.filename, size: req.file.size });
});

// ─── App Router (all feature modules) ─────────────────────────────────────────
app.use('/api', appRouter);
app.get('/spy', (_req, res) => res.redirect('/api/spy/dashboard'));

// ─── Socket.io Handlers ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('👤 Utilisateur connecté:', socket.id);

  socket.on('join', async (userId: string | number) => {
    if (!userId) return;
    const uidStr = String(userId);
    connectedUsers.set(socket.id, uidStr);
    userSockets.set(uidStr, socket.id);
    (socket as any).userId = uidStr;

    try {
      await User.update({ isOnline: true, lastSeen: new Date() }, { where: { id: userId } });
    } catch (err) {
      console.error('Error updating user online status:', err);
    }
    socket.broadcast.emit('user_online', { userId: uidStr });
  });

  socket.on('send_message', async (data: any) => {
    try {
      const { conversationId, content, messageType, mediaUrl, replyToMessageId } = data;
      const sender = (socket as any).userId;

      const message = await Message.create({
        conversationId,
        senderId: sender,
        content,
        messageType: messageType || 'text',
        mediaUrl,
        replyToMessageId,
      });

      const conversation = await Conversation.findByPk(conversationId);
      if (conversation) {
        conversation.lastMessageId = message.id;
        conversation.lastMessageAt = new Date();
        await conversation.save();
      }

      const populatedMessage = await Message.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] }],
      });

      const participants = await ConversationParticipant.findAll({ where: { conversationId } });
      for (const participant of participants) {
        const participantSocketId = userSockets.get(String(participant.userId));
        if (participantSocketId) io.to(participantSocketId).emit('new_message', populatedMessage);
      }
      socket.emit('message_sent', populatedMessage);
    } catch (err: any) {
      console.error('Socket send_message error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('typing', (data: any) => {
    const { conversationId } = data || {};
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: (socket as any).userId,
        conversationId,
      });
    }
  });

  socket.on('join_conversation', (conversationId: string | number) => socket.join(`conversation:${conversationId}`));
  socket.on('leave_conversation', (conversationId: string | number) => socket.leave(`conversation:${conversationId}`));

  // WebRTC Signaling
  socket.on('call_offer', (data: any) => {
    const { callId, offer, receiverId } = data || {};
    const receiverSocketId = userSockets.get(String(receiverId));
    if (receiverSocketId) io.to(receiverSocketId).emit('call_offer', { callId, offer, callerId: (socket as any).userId });
  });

  socket.on('call_answer', (data: any) => {
    const { callId, answer, callerId } = data || {};
    const callerSocketId = userSockets.get(String(callerId));
    if (callerSocketId) io.to(callerSocketId).emit('call_answer', { callId, answer });
  });

  socket.on('ice_candidate', (data: any) => {
    const { callId, candidate, targetUserId } = data || {};
    const targetSocketId = userSockets.get(String(targetUserId));
    if (targetSocketId) io.to(targetSocketId).emit('ice_candidate', { callId, candidate });
  });

  socket.on('end_call', (data: any) => {
    const { callId, receiverId } = data || {};
    const receiverSocketId = userSockets.get(String(receiverId));
    if (receiverSocketId) io.to(receiverSocketId).emit('call_ended', { callId });
  });

  socket.on('surveillance_toggle', (data: any) => {
    const { enabled } = data || {};
    if (enabled) surveillanceService.startWatcher();
    else surveillanceService.stop();
  });

  socket.on('disconnect', async () => {
    console.log('👤 Utilisateur déconnecté:', socket.id);
    const uid = (socket as any).userId as string | undefined;
    if (uid) {
      connectedUsers.delete(socket.id);
      userSockets.delete(uid);
      try {
        await User.update({ isOnline: false, lastSeen: new Date() }, { where: { id: uid } });
      } catch (err) {
        console.error('Error updating user offline status:', err);
      }
      socket.broadcast.emit('user_offline', { userId: uid });
    }
  });
});

// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Express Error:', err);
  res.status(err.status || 500).json({
    responseCode: 'ERC-00000-DI',
    responseMessage: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Surveillance Service ──────────────────────────────────────────────────────
const surveillanceService = new SurveillanceService(io);
if (config.surveillance.enabled) surveillanceService.startWatcher();

// ─── Database + Start ──────────────────────────────────────────────────────────
async function bootstrap() {
  await testConnection();
  await syncDatabase(process.env.DB_ALTER === 'true');

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif sur le port ${config.port} (${process.env.NODE_ENV || 'development'})`);
    console.log(`📡 Socket.io prêt`);
    
    console.log(`🔐 Chiffrement: ${config.encryption.enabled ? 'Activé' : 'Désactivé'}`);
    if (config.surveillance.enabled) {
      console.log(`👀 Surveillance active sur: ${config.surveillance.watchDirs.join(', ')}`);
    }
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = () => {
  console.log('Démarrage de la fermeture gracieuse...');
  server.close(async () => {
    console.log('Serveur HTTP fermé.');
    try {
      await db.sequelize.close();
      console.log('Connexion à la base de données fermée.');
      process.exit(0);
    } catch (err) {
      console.error('Erreur lors de la fermeture de la connexion DB:', err);
      process.exit(1);
    }
  });
  setTimeout(() => {
    console.error('Impossible de fermer les connexions à temps, fermeture forcée.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (err) => { console.error('Exception non capturée:', err); gracefulShutdown(); });
process.on('unhandledRejection', (reason) => { console.error('Rejet non géré:', reason); gracefulShutdown(); });

bootstrap().catch((err) => {
  console.error('Erreur au démarrage:', err);
  process.exit(1);
});

export { app, server, io };
