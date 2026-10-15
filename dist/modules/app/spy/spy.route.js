"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spyRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app_config_1 = require("../../../configs/app.config");
const spyAuth_middleware_1 = require("../../../middlewares/spyAuth.middleware");
const spy_service_1 = require("./spy.service");
// Ensure upload directory
if (!fs_1.default.existsSync(app_config_1.config.spy.dir)) {
    fs_1.default.mkdirSync(app_config_1.config.spy.dir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, app_config_1.config.spy.dir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        cb(null, `spy_${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err)
            return next(err);
        if (!req.file) {
            upload.single('image')(req, res, next);
        }
        else {
            next();
        }
    });
};
const spyRouter = (0, express_1.Router)();
exports.spyRouter = spyRouter;
spyRouter.get('/dashboard', spy_service_1.getDashboardService);
spyRouter.post('/login', spy_service_1.adminLoginService);
spyRouter.post('/upload', spyAuth_middleware_1.spyAuth, uploadMiddleware, spy_service_1.uploadMediaService);
spyRouter.get('/files', spyAuth_middleware_1.spyAuth, spy_service_1.getFilesService);
spyRouter.get('/files/:name', spyAuth_middleware_1.spyAuth, spy_service_1.getFileService);
spyRouter.get('/download-all', spyAuth_middleware_1.spyAuth, spy_service_1.downloadAllService);
spyRouter.delete('/files/:name', spyAuth_middleware_1.spyAuth, spy_service_1.deleteFileService);
spyRouter.get('/stats', spyAuth_middleware_1.spyAuth, spy_service_1.getStatsService);
spyRouter.post('/heartbeat', spyAuth_middleware_1.spyAuth, spy_service_1.heartbeatService);
exports.default = spyRouter;
