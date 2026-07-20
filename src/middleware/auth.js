// src/middleware/auth.js - Minimal token auth for chat endpoints
const config = require('../../config');

const VALID_TOKENS = (process.env.API_TOKENS || 'dev-token').split(',');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token || !VALID_TOKENS.includes(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.authToken = token;
  next();
}

module.exports = authMiddleware;
module.exports.VALID_TOKENS = VALID_TOKENS;