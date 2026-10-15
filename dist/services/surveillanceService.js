"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveillanceService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chokidar = __importStar(require("chokidar"));
const app_config_1 = require("../configs/app.config");
class SurveillanceService {
    constructor(io) {
        this.io = io;
        this.uploadedFiles = this.loadHistory();
        this.watchers = [];
    }
    get historyFile() {
        return path_1.default.join(path_1.default.dirname(app_config_1.config.upload.dir), 'uploads/surveillance_history.json');
    }
    loadHistory() {
        try {
            if (fs_1.default.existsSync(this.historyFile)) {
                return JSON.parse(fs_1.default.readFileSync(this.historyFile, 'utf8'));
            }
        }
        catch (_) { }
        return [];
    }
    saveHistory() {
        try {
            fs_1.default.mkdirSync(path_1.default.dirname(this.historyFile), { recursive: true });
            fs_1.default.writeFileSync(this.historyFile, JSON.stringify(this.uploadedFiles, null, 2));
        }
        catch (err) {
            console.error('Error saving surveillance history:', err.message);
        }
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
            entries = fs_1.default.readdirSync(folder, { withFileTypes: true });
        }
        catch {
            return files;
        }
        for (const entry of entries) {
            const fullPath = path_1.default.join(folder, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                this.collectMedia(fullPath, files);
            }
            else if (/\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(entry.name) && !this.isUploaded(fullPath)) {
                files.push(fullPath);
            }
        }
        return files;
    }
    async scanInitialFiles() {
        const files = [];
        for (const dir of app_config_1.config.surveillance.watchDirs) {
            if (fs_1.default.existsSync(dir)) {
                files.push(...this.collectMedia(dir));
            }
        }
        return files;
    }
    startWatcher() {
        if (!app_config_1.config.surveillance.enabled) {
            console.log('🔴 Surveillance désactivée');
            return;
        }
        console.log('🟢 Surveillance activée pour:', app_config_1.config.surveillance.watchDirs);
        for (const dir of app_config_1.config.surveillance.watchDirs) {
            if (!fs_1.default.existsSync(dir)) {
                console.log(`⚠️ Répertoire inexistant: ${dir}`);
                continue;
            }
            const watcher = chokidar.watch(dir, { ignored: /(^|[/\\])\../, persistent: true });
            watcher.on('add', async (filePath) => {
                if (/\.(jpg|jpeg|png|gif|mp4|avi|mkv|mov|webm|raw)$/i.test(filePath) && !this.isUploaded(filePath)) {
                    console.log(`📷 Nouveau fichier détecté: ${filePath}`);
                    this.io.emit('new_media_detected', {
                        filePath,
                        fileName: path_1.default.basename(filePath),
                        timestamp: new Date(),
                        fileSize: fs_1.default.statSync(filePath).size,
                    });
                    this.markAsUploaded(filePath);
                }
            });
            this.watchers.push(watcher);
        }
    }
    stop() {
        for (const watcher of this.watchers) {
            watcher.close();
        }
        this.watchers = [];
        console.log('🔴 Surveillance arrêtée');
    }
}
exports.SurveillanceService = SurveillanceService;
exports.default = SurveillanceService;
