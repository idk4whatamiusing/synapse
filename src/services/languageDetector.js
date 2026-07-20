// src/services/languageDetector.js - Multi-language detection and translation support
const config = require('../../config');

const LANGUAGE_PATTERNS = {
  'bn': /[\u0980-\u09FF]/,
  'hi': /[\u0900-\u097F]/,
  'en': /[a-zA-Z]/
};

class LanguageDetector {
  constructor() {
    this.defaultLang = config.chatbot.defaultLanguage || 'en';
    this.supported = config.chatbot.supportedLanguages || ['en', 'bn', 'hi'];
  }

  detect(text) {
    for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    return this.defaultLang;
  }

  isSupported(lang) {
    return this.supported.includes(lang);
  }

  async translate(text, targetLang = this.defaultLang) {
    // ponytail: placeholder for translation API (e.g. LibreTranslate/Google).
    // Returns text unchanged until a translation backend is wired in config.
    return text;
  }
}

module.exports = new LanguageDetector();