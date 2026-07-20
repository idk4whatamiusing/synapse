// backend/server.js - Main chatbot server
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const config = require('../config');
const gateway = require('./gateway');
const hostelIntegration = require('../integrations/hostel');
const transportIntegration = require('../integrations/transport');
const academicsIntegration = require('../integrations/academics');
const noticesIntegration = require('../integrations/notices');
const clubsIntegration = require('../integrations/clubs');

const app = express();
app.use(express.json());
app.use('/api', gateway);

const nlp = require('../src/services/nlpProcessor');
const contextManager = require('../src/services/contextManager');
const languageDetector = require('../src/services/languageDetector');
const retrieval = require('../src/services/retrieval');
const responseTemplates = require('../src/services/responseTemplates');
const preferenceStore = require('../src/services/preferenceStore');
const feedbackStore = require('../src/services/feedbackStore');
const auth = require('../src/middleware/auth');
const logger = require('../src/services/logger');
const metrics = require('../src/services/metrics');
const improvementPipeline = require('../src/services/improvementPipeline');

// Cache layer
class Cache {
  constructor() {
    this.data = new Map();
    this.ttl = 300000; // 5 minutes
  }

  async get(key) {
    const item = this.data.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.value;
    }
    return null;
  }

  async set(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

class CampusChatbot {
  constructor() {
    this.cache = new Cache();
  }

  async handleMessage(message, userId) {
    const cacheKey = `${userId}:${message}`;
    let response = await this.cache.get(cacheKey);

    if (!response) {
      const intent = nlp.detectIntent(message).intent;
      const lang = languageDetector.detect(message);
      const session = contextManager.addMessage(userId, 'user', message, { intent, lang });
      preferenceStore.record(userId, { intent, lang });

      const kbMatches = retrieval.retrieve(message, intent);
      let kbResponse = responseTemplates.format(intent, kbMatches.map(m => m.record));
      kbResponse = await languageDetector.translate(kbResponse, lang);
      const apiResponse = await this.getCampusData(intent, message);

      const kbEmpty = !kbMatches.length;
      const apiEmpty = !apiResponse || (typeof apiResponse === 'object' && apiResponse.error);
      const intentConfidence = nlp.detectIntent(message).confidence;

      if (kbEmpty && apiEmpty) {
        if (intent === 'general' || intentConfidence < 0.3) {
          response = this.outOfDomain(message);
        } else {
          response = this.clarify(intent);
        }
      } else {
        response = this.combineResponses(kbResponse, apiResponse);
      }

      contextManager.updateContext(userId, { lastIntent: intent, lastLang: lang });
      contextManager.addMessage(userId, 'assistant', response, { intent, lang });
      await this.cache.set(cacheKey, response);
    }

    return {
      message: response,
      timestamp: new Date().toISOString(),
      userId
    };
  }

  async getCampusData(intent, query) {
    try {
      switch (intent) {
        case 'hostel':
          return await this.fetchHostelData(query);
        case 'transport':
          return await this.fetchTransportData(query);
        case 'academics':
          return await this.fetchAcademicData(query);
        case 'notices':
          return await this.fetchNotices(query);
        case 'clubs':
          return await this.fetchClubs(query);
        default:
          return 'I can help with information about hostels, transport, academic departments, notices, or clubs. Please specify what you need.';
      }
    } catch (error) {
      return 'I encountered an error fetching campus data. Please try again later.';
    }
  }

  async fetchHostelData(query) {
    try {
      const result = await hostelIntegration.searchHostels(query);
      return result.data || result;
    } catch (error) {
      return 'Hostel service temporarily unavailable. Please contact administration.';
    }
  }

  async fetchTransportData(query) {
    try {
      const result = await transportIntegration.getRoutes(query);
      return result.data || result;
    } catch (error) {
      return 'Transport service temporarily unavailable. Please check with transport office.';
    }
  }

  async fetchAcademicData(query) {
    try {
      const result = await academicsIntegration.getDepartments(query);
      return result.data || result;
    } catch (error) {
      return 'Academic service temporarily unavailable. Please contact your department.';
    }
  }

  async fetchNotices(query) {
    try {
      const result = await noticesIntegration.getNotices(null, 10);
      return result.data || result;
    } catch (error) {
      return 'Notice service temporarily unavailable. Please check campus notice board.';
    }
  }

  async fetchClubs(query) {
    try {
      const result = await clubsIntegration.getClubs(null, null);
      return result.data || result;
    } catch (error) {
      return 'Club service temporarily unavailable. Please contact clubs office.';
    }
  }

  combineResponses(knowledge, api) {
    let response = knowledge;
    if (api && api !== knowledge) {
      const apiText = typeof api === 'string' ? api : JSON.stringify(api, null, 2);
      response += '\n\n' + apiText;
    }
    return response;
  }

  outOfDomain(message) {
    return `I'm the Adamas Campus Assistant — I handle hostels, transport, academics, notices, and clubs. ` +
      `I couldn't match "${message}" to campus info. Try asking about those topics, or type "help" for examples.`;
  }

  clarify(intent) {
    const prompts = {
      hostel: `Which hostel or room type are you looking for (boys/girls, AC/non-AC)?`,
      transport: `What's your starting point and destination for the bus route?`,
      academics: `Which school or department do you mean (e.g. Engineering, Management)?`,
      notices: `Which notice category — academic, emergency, or event?`,
      clubs: `What kind of club — technical, cultural, sports, or literary?`
    };
    return prompts[intent] || 'Could you share a bit more detail about your campus query?';
  }
}

const chatbot = new CampusChatbot();

app.post('/chat', auth, async (req, res) => {
  const start = Date.now();
  metrics.inc('chat_requests');
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      metrics.inc('errors');
      return res.status(400).json({
        error: 'Message and userId are required'
      });
    }

    const response = await chatbot.handleMessage(message, userId);
    metrics.recordIntent(response.userId ? 'served' : 'served');
    metrics.recordLatency(Date.now() - start);
    logger.info('chat', { userId, intent: contextManager.getContext(userId).lastIntent });

    res.json(response);
  } catch (error) {
    metrics.inc('errors');
    logger.error('chat_failed', { error: error.message });
    // 5.4 error recovery: never crash the chat; return safe message
    res.status(200).json({
      message: 'Something went wrong processing your request. Please try rephrasing or type "help".',
      timestamp: new Date().toISOString(),
      error: true
    });
  }
});

app.post('/feedback', auth, (req, res) => {
  const { userId, message, rating, comment } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  metrics.inc('feedback');
  const entry = feedbackStore.add({ userId, message, rating, comment });
  res.json({ ok: true, entry });
});

app.get('/metrics', (req, res) => {
  res.json(metrics.snapshot());
});

// Admin dashboard (7.5): metrics + feedback summary in one view
app.get('/admin/dashboard', (req, res) => {
  res.json({
    metrics: metrics.snapshot(),
    feedback_summary: feedbackStore.summary(),
    feedback_recent: feedbackStore.getRecent(10),
    improvement_review: improvementPipeline.reviewItems(3)
  });
});

app.get('/help', (req, res) => {
  res.json({
    examples: [
      'Tell me about boys hostels near the main gate',
      'Bus route from campus to Kolkata station',
      'Departments in the School of Engineering',
      'Upcoming campus events',
      'Technical clubs I can join'
    ],
    topics: ['hostel', 'transport', 'academics', 'notices', 'clubs']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/context/:userId', (req, res) => {
  const { userId } = req.params;
  res.json({
    context: contextManager.getContext(userId),
    history: contextManager.getHistory(userId)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Campus Chatbot Service running on port ${PORT}`);
});
