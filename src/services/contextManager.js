// src/services/contextManager.js - Conversation context and session tracking
const config = require('../../config');

class ContextManager {
  constructor() {
    this.sessions = new Map();
    this.maxHistory = config.chatbot.maxHistory || 10;
    this.sessionTTL = config.chatbot.sessionTTL || 1800000; // 30 min
  }

  getSession(userId) {
    const session = this.sessions.get(userId);
    if (session && Date.now() - session.lastActivity < this.sessionTTL) {
      return session;
    }
    return this.createSession(userId);
  }

  createSession(userId) {
    const session = {
      userId,
      history: [],
      context: {},
      lastActivity: Date.now(),
      createdAt: Date.now()
    };
    this.sessions.set(userId, session);
    return session;
  }

  addMessage(userId, role, message, metadata = {}) {
    const session = this.getSession(userId);
    session.history.push({
      role,
      message,
      timestamp: Date.now(),
      ...metadata
    });

    if (session.history.length > this.maxHistory) {
      session.history = session.history.slice(-this.maxHistory);
    }

    session.lastActivity = Date.now();
    return session;
  }

  getHistory(userId) {
    return this.getSession(userId).history;
  }

  getContext(userId) {
    return this.getSession(userId).context;
  }

  updateContext(userId, updates) {
    const session = this.getSession(userId);
    session.context = { ...session.context, ...updates };
    session.lastActivity = Date.now();
    return session.context;
  }

  clearContext(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.context = {};
      session.history = [];
      session.lastActivity = Date.now();
    }
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [userId, session] of this.sessions) {
      if (now - session.lastActivity > this.sessionTTL) {
        this.sessions.delete(userId);
      }
    }
  }

  getActiveSessions() {
    return this.sessions.size;
  }
}

module.exports = new ContextManager();