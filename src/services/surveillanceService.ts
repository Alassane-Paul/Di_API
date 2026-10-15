import fs from 'fs';
import path from 'path';
import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import { Server as SocketServer } from 'socket.io';
import { config } from '../configs/app.config';

export class SurveillanceService {
  private io: SocketServer;
  private uploadedFiles: string[];
  private watchers: FSWatcher[];

  constructor(io: SocketServer) {
    this.io = io;
    this.uploadedFiles = this.loadHistory();
    this.watchers = [];
  }

  private get historyFile(): string {
    return path.join(path.dirname(config.upload.dir), 'uploads/surveillance_history.json');
  }

  private loadHistory(): string[] {
    try {
      if (fs.existsSync(this.historyFile)) {
        return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      }
    } catch (_) {}
    return [];
  }

  private saveHistory(): void {
    try {
      fs.mkdirSync(path.dirname(this.historyFile), { recursive: true });
      fs.writeFileSync(this.historyFile, JSON.stringify(this.uploadedFiles, null, 2));
    } catch (err: any) {
      console.error('Error saving surveillance history:', err.message);
    }
  }

  isUploaded(filePath: string): boolean {
    return this.uploadedFiles.includes(filePath);
  }

  markAsUploaded(filePath: string): void {
    this.uploadedFiles.push(filePath);
    this.saveHistory();
  }

  collectMedia(folder: string, files: string[] = []): string[] {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch {
      return files;
    }

    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        this.collectMedia(fullPath, files);
      } else if (/\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(entry.name) && !this.isUploaded(fullPath)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  async scanInitialFiles(): Promise<string[]> {
    const files: string[] = [];
    for (const dir of config.surveillance.watchDirs) {
      if (fs.existsSync(dir)) {
        files.push(...this.collectMedia(dir));
      }
    }
    return files;
  }

  startWatcher(): void {
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

      const watcher = chokidar.watch(dir, { ignored: /(^|[/\\])\../, persistent: true });

      watcher.on('add', async (filePath) => {
        if (/\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(filePath) && !this.isUploaded(filePath)) {
          console.log(`📷 Nouveau fichier détecté: ${filePath}`);
          this.io.emit('new_media_detected', {
            filePath,
            fileName: path.basename(filePath),
            timestamp: new Date(),
            fileSize: fs.statSync(filePath).size,
          });
          this.markAsUploaded(filePath);
        }
      });

      this.watchers.push(watcher);
    }
  }

  stop(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    console.log('🔴 Surveillance arrêtée');
  }
}

export default SurveillanceService;
