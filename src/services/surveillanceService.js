const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const config = require('../config');

class SurveillanceService {
  constructor(io) {
    this.io = io;
    this.uploadedFiles = this.loadHistory();
    this.watchers = [];
  }

  loadHistory() {
    const historyFile = path.join(__dirname, '../../uploads/surveillance_history.json');
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    return [];
  }

  saveHistory() {
    const historyFile = path.join(__dirname, '../../uploads/surveillance_history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.uploadedFiles, null, 2));
  }

  isUploaded(filePath) {
    return this.uploadedFiles.includes(filePath);
  }

  markAsUploaded(filePath) {
    this.uploadedFiles.push(filePath);
    this.saveHistory();
  }

  collectMedia(folder, files = []) {
    let entries;
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch {
      return files;
    }

    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        this.collectMedia(fullPath, files);
      } else if (
        /\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(entry.name) &&
        !this.isUploaded(fullPath)
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  async scanInitialFiles() {
    const files = [];
    for (const dir of config.surveillance.watchDirs) {
      if (fs.existsSync(dir)) {
        files.push(...this.collectMedia(dir));
      }
    }
    return files;
  }

  startWatcher() {
    if (!config.surveillance.enabled) {
      console.log('🔴 Surveillance désactivée');
      return;
    }

    console.log('🟢 Surveillance activée pour:', config.surveillance.watchDirs);

    for (const dir of config.surveillance.watchDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`⚠️ Répertoire inexistant: ${dir}`);
        continue;
      }

      const watcher = chokidar.watch(dir, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });

      watcher.on('add', async (filePath) => {
        if (
          /\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(filePath) &&
          !this.isUploaded(filePath)
        ) {
          console.log(`📷 Nouveau fichier détecté: ${filePath}`);

          // Notify all connected clients via Socket.io
          this.io.emit('new_media_detected', {
            filePath,
            fileName: path.basename(filePath),
            timestamp: new Date(),
            fileSize: fs.statSync(filePath).size
          });

          this.markAsUploaded(filePath);
        }
      });

      this.watchers.push(watcher);
    }

    console.log('👀 File watcher actif');
  }

  stop() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }
}

module.exports = SurveillanceService;
