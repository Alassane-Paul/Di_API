const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware de sécurité pour le module Spy
 * Vérifie :
 * 1. Token JWT utilisateur Di valide (Bearer token)
 * 2. OU Secret token Spy (x-spy-token ou Bearer token ou query param token)
 * 3. OU Mot de passe administrateur Spy
 */
function spyAuth(req, res, next) {
  // 1. Check custom spy headers
  const spyTokenHeader = req.headers['x-spy-token'];
  if (spyTokenHeader && (spyTokenHeader === config.spy.secretToken || spyTokenHeader === config.spy.adminPassword)) {
    req.isAdmin = true;
    return next();
  }

  // 2. Check query param token (utile pour liens de téléchargement ZIP et balises <img>/<video>)
  const queryToken = req.query.token;
  if (queryToken) {
    if (queryToken === config.spy.secretToken || queryToken === config.spy.adminPassword) {
      req.isAdmin = true;
      return next();
    }
    try {
      const decoded = jwt.verify(queryToken, config.jwt.secret);
      req.userId = decoded.userId;
      return next();
    } catch (_) {
      // Query token invalid, continue to header checks
    }
  }

  // 3. Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (token === config.spy.secretToken || token === config.spy.adminPassword) {
      req.isAdmin = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.userId = decoded.userId;
      return next();
    } catch (_) {
      return res.status(403).json({ success: false, error: 'Token de session invalide ou expiré' });
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Accès restreint : Authentification requise pour accéder au module Spy'
  });
}

module.exports = spyAuth;
