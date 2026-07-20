// src/services/preferenceStore.js - Lightweight per-user preference learning
const config = require('../../config');

class PreferenceStore {
  constructor() {
    this.prefs = new Map();
  }

  record(userId, { intent, lang }) {
    const p = this.prefs.get(userId) || { intents: {}, langs: {}, lastIntent: null, lastLang: null };
    if (intent) {
      p.intents[intent] = (p.intents[intent] || 0) + 1;
      p.lastIntent = intent;
    }
    if (lang) {
      p.langs[lang] = (p.langs[lang] || 0) + 1;
      p.lastLang = lang;
    }
    this.prefs.set(userId, p);
    return p;
  }

  get(userId) {
    return this.prefs.get(userId) || null;
  }

  topIntent(userId) {
    const p = this.prefs.get(userId);
    if (!p) return null;
    return Object.entries(p.intents).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  clear(userId) {
    this.prefs.delete(userId);
  }
}

module.exports = new PreferenceStore();