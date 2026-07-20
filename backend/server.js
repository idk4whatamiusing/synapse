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

// NLP processing (simplified)
class SimpleNLPProcessor {
  constructor() {
    this.patterns = {
      'hostel': /hostel|accommodation|room|available|live/i,
      'transport': /transport|bus|route|schedule|arrival|departure/i,
      'academics': /academic|department|course|professor|faculty|school/i,
      'notices': /notice|announcement|alert|campus|urgent/i,
      'clubs': /club|activity|group|event|meeting/i
    };
  }

  detectIntent(message) {
    const lowerMsg = message.toLowerCase();
    for (const [intent, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(lowerMsg)) {
        return intent;
      }
    }
    return 'general';
  }

  generateResponse(intent, context) {
    return `Based on your query about ${intent}, I can help you with campus information. Please provide more details about your specific need.`;
  }
}

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
    this.nlp = new SimpleNLPProcessor();
    this.cache = new Cache();
  }

  async handleMessage(message, userId) {
    const cacheKey = `${userId}:${message}`;
    let response = await this.cache.get(cacheKey);

    if (!response) {
      const intent = this.nlp.detectIntent(message);
      const knowledgeResponse = this.nlp.generateResponse(intent, message);
      const apiResponse = await this.getCampusData(intent, message);
      response = this.combineResponses(knowledgeResponse, apiResponse);
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
      response += '\n\n' + api;
    }
    return response;
  }
}

const chatbot = new CampusChatbot();

app.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        error: 'Message and userId are required'
      });
    }

    const response = await chatbot.handleMessage(message, userId);

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Campus Chatbot Service running on port ${PORT}`);
});
