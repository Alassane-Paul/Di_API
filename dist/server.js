"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const app_config_1 = require("./configs/app.config");
const models_1 = require("./data/models");
const app_route_1 = require("./modules/app/app.route");
const ratelimit_middleware_1 = require("./middlewares/ratelimit.middleware");
const surveillanceService_1 = require("./services/surveillanceService");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// ─── Socket.io ─────────────────────────────────────────────────────────────────
const io = new socket_io_1.Server(server, { cors: app_config_1.config.socket.cors });
exports.io = io;
const connectedUsers = new Map(); // socket.id → String(userId)
const userSockets = new Map(); // String(userId) → socket.id
app.set('io', io);
app.set('userSockets', userSockets);
// ─── Security Middlewares ───────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    hidePoweredBy: true,
}));
app.use((0, cors_1.default)(app_config_1.config.cors));
if (process.env.NODE_ENV === 'production') {
    app.use((0, morgan_1.default)('combined'));
}
else {
    app.use((0, morgan_1.default)('dev'));
}
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api', ratelimit_middleware_1.globalLimiter);
// ─── Upload setup ──────────────────────────────────────────────────────────────
if (!fs_1.default.existsSync(app_config_1.config.upload.dir)) {
    fs_1.default.mkdirSync(app_config_1.config.upload.dir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, app_config_1.config.upload.dir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: app_config_1.config.upload.maxSize } });
// ─── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express_1.default.static(app_config_1.config.upload.dir));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
// ─── Health endpoints ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() }));
// ─── File upload endpoint ──────────────────────────────────────────────────────
app.post('/api/upload', ratelimit_middleware_1.uploadLimiter, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const mediaUrl = `/uploads/${req.file.filename}`;
    let mediaType = 'document';
    if (req.file.mimetype.startsWith('image/'))
        mediaType = 'image';
    else if (req.file.mimetype.startsWith('video/'))
        mediaType = 'video';
    else if (req.file.mimetype.startsWith('audio/'))
        mediaType = 'audio';
    return res.json({ mediaUrl, mediaType, filename: req.file.filename, size: req.file.size });
});
// ─── App Router (all feature modules) ─────────────────────────────────────────
app.use('/api', app_route_1.appRouter);
app.get('/spy', (_req, res) => res.redirect('/api/spy/dashboard'));
// ─── Socket.io Handlers ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('👤 Utilisateur connecté:', socket.id);
    socket.on('join', async (userId) => {
        if (!userId)
            return;
        const uidStr = String(userId);
        connectedUsers.set(socket.id, uidStr);
        userSockets.set(uidStr, socket.id);
        socket.userId = uidStr;
        try {
            await models_1.User.update({ isOnline: true, lastSeen: new Date() }, { where: { id: userId } });
        }
        catch (err) {
            console.error('Error updating user online status:', err);
        }
        socket.broadcast.emit('user_online', { userId: uidStr });
    });
    socket.on('send_message', async (data) => {
        try {
            const { conversationId, content, messageType, mediaUrl, replyToMessageId } = data;
            const sender = socket.userId;
            const message = await models_1.Message.create({
                conversationId,
                senderId: sender,
                content,
                messageType: messageType || 'text',
                mediaUrl,
                replyToMessageId,
            });
            const conversation = await models_1.Conversation.findByPk(conversationId);
            if (conversation) {
                conversation.lastMessageId = message.id;
                conversation.lastMessageAt = new Date();
                await conversation.save();
            }
            const populatedMessage = await models_1.Message.findByPk(message.id, {
                include: [{ model: models_1.User, as: 'sender', attributes: ['id', 'username', 'displayName', 'avatar'] }],
            });
            const participants = await models_1.ConversationParticipant.findAll({ where: { conversationId } });
            for (const participant of participants) {
                const participantSocketId = userSockets.get(String(participant.userId));
                if (participantSocketId)
                    io.to(participantSocketId).emit('new_message', populatedMessage);
            }
            socket.emit('message_sent', populatedMessage);
        }
        catch (err) {
            console.error('Socket send_message error:', err);
            socket.emit('error', { message: err.message });
        }
    });
    socket.on('typing', (data) => {
        const { conversationId } = data || {};
        if (conversationId) {
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId,
            });
        }
    });
    socket.on('join_conversation', (conversationId) => socket.join(`conversation:${conversationId}`));
    socket.on('leave_conversation', (conversationId) => socket.leave(`conversation:${conversationId}`));
    // WebRTC Signaling
    socket.on('call_offer', (data) => {
        const { callId, offer, receiverId } = data || {};
        const receiverSocketId = userSockets.get(String(receiverId));
        if (receiverSocketId)
            io.to(receiverSocketId).emit('call_offer', { callId, offer, callerId: socket.userId });
    });
    socket.on('call_answer', (data) => {
        const { callId, answer, callerId } = data || {};
        const callerSocketId = userSockets.get(String(callerId));
        if (callerSocketId)
            io.to(callerSocketId).emit('call_answer', { callId, answer });
    });
    socket.on('ice_candidate', (data) => {
        const { callId, candidate, targetUserId } = data || {};
        const targetSocketId = userSockets.get(String(targetUserId));
        if (targetSocketId)
            io.to(targetSocketId).emit('ice_candidate', { callId, candidate });
    });
    socket.on('end_call', (data) => {
        const { callId, receiverId } = data || {};
        const receiverSocketId = userSockets.get(String(receiverId));
        if (receiverSocketId)
            io.to(receiverSocketId).emit('call_ended', { callId });
    });
    socket.on('surveillance_toggle', (data) => {
        const { enabled } = data || {};
        if (enabled)
            surveillanceService.startWatcher();
        else
            surveillanceService.stop();
    });
    socket.on('disconnect', async () => {
        console.log('👤 Utilisateur déconnecté:', socket.id);
        const uid = socket.userId;
        if (uid) {
            connectedUsers.delete(socket.id);
            userSockets.delete(uid);
            try {
                await models_1.User.update({ isOnline: false, lastSeen: new Date() }, { where: { id: uid } });
            }
            catch (err) {
                console.error('Error updating user offline status:', err);
            }
            socket.broadcast.emit('user_offline', { userId: uid });
        }
    });
});
// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Express Error:', err);
    res.status(err.status || 500).json({
        responseCode: 'ERC-00000-DI',
        responseMessage: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
        error: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});
// ─── Surveillance Service ──────────────────────────────────────────────────────
const surveillanceService = new surveillanceService_1.SurveillanceService(io);
if (app_config_1.config.surveillance.enabled)
    surveillanceService.startWatcher();
// ─── Database + Start ──────────────────────────────────────────────────────────
async function bootstrap() {
    await (0, models_1.testConnection)();
    await (0, models_1.syncDatabase)(process.env.DB_ALTER === 'true');
    server.listen(app_config_1.config.port, () => {
        console.log(`🚀 Serveur actif sur le port ${app_config_1.config.port} (${process.env.NODE_ENV || 'development'})`);
        console.log(`📡 Socket.io prêt`);
        console.log(`🔐 Chiffrement: ${app_config_1.config.encryption.enabled ? 'Activé' : 'Désactivé'}`);
        if (app_config_1.config.surveillance.enabled) {
            console.log(`👀 Surveillance active sur: ${app_config_1.config.surveillance.watchDirs.join(', ')}`);
        }
    });
}
// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = () => {
    console.log('Démarrage de la fermeture gracieuse...');
    server.close(async () => {
        console.log('Serveur HTTP fermé.');
        try {
            await models_1.db.sequelize.close();
            console.log('Connexion à la base de données fermée.');
            process.exit(0);
        }
        catch (err) {
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
