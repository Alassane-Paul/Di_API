import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../../../configs/app.config';
import { spyAuth } from '../../../middlewares/spyAuth.middleware';
import {
  uploadMediaService,
  getFilesService,
  getFileService,
  deleteFileService,
  downloadAllService,
  getStatsService,
  heartbeatService,
  getDashboardService,
  adminLoginService,
} from './spy.service';

// Ensure upload directory
if (!fs.existsSync(config.spy.dir)) {
  fs.mkdirSync(config.spy.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.spy.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `spy_${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) return next(err);
    if (!req.file) {
      upload.single('image')(req, res, next);
    } else {
      next();
    }
  });
};

const spyRouter = Router();

spyRouter.get('/dashboard', getDashboardService);
spyRouter.post('/login', adminLoginService);
spyRouter.post('/upload', spyAuth, uploadMiddleware, uploadMediaService);
spyRouter.get('/files', spyAuth, getFilesService);
spyRouter.get('/files/:name', spyAuth, getFileService);
spyRouter.get('/download-all', spyAuth, downloadAllService);
spyRouter.delete('/files/:name', spyAuth, deleteFileService);
spyRouter.get('/stats', spyAuth, getStatsService);
spyRouter.post('/heartbeat', spyAuth, heartbeatService);

export { spyRouter };
export default spyRouter;
