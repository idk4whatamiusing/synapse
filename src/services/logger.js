// src/services/logger.js - Minimal request logger (no external dep)
const config = require('../../config');

function log(level, msg, meta = {}) {
  const entry = {
    level,
    time: new Date().toISOString(),
    msg,
    ...meta
  };
  if (config.logging && config.logging.format === 'json') {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.level}] ${entry.time} ${msg}`, meta);
  }
}

module.exports = {
  info: (m, meta) => log('info', m, meta),
  warn: (m, meta) => log('warn', m, meta),
  error: (m, meta) => log('error', m, meta)
};