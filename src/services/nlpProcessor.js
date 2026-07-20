// src/services/nlpProcessor.js - NLP processing layer with LLaMA2 and LORA fine-tuning
const axios = require('axios');
const config = require('../../config');

class NLPProcessor {
  constructor() {
    this.modelEndpoint = config.chatbot.modelEndpoint || 'http://localhost:8080';
    this.model = config.chatbot.nlpModel || 'llama2';
    this.maxTokens = config.chatbot.maxTokens || 2048;
    this.temperature = config.chatbot.temperature || 0.7;
    this.contextWindow = config.chatbot.contextWindow || 4096;
    this.cache = new Map();
    this.cacheTTL = config.chatbot.cacheTTL || 300000;
    
    this.intentPatterns = {
      'hostel': /hostel|accommodation|room|available|live|stay|reside|dorm/i,
      'transport': /transport|bus|route|schedule|arrival|departure|commute|travel|shuttle/i,
      'academics': /academic|department|course|professor|faculty|school|program|degree|syllabus/i,
      'notices': /notice|announcement|alert|campus|urgent|update|circular/i,
      'clubs': /club|activity|group|event|meeting|society|extracurricular/i,
      'general': /help|information|what|how|where|when|who|why|can you|tell me/i
    };
  }

  async initialize() {
    try {
      const response = await axios.get(`${this.modelEndpoint}/health`);
      if (response.data.status === 'healthy') {
        console.log('LLaMA2 model initialized successfully');
        return true;
      }
      console.warn('LLaMA2 model health check returned unhealthy status');
      return false;
    } catch (error) {
      console.error('Failed to initialize LLaMA2 model:', error.message);
      return false;
    }
  }

  detectIntent(message) {
    const lowerMsg = message.toLowerCase();
    let bestMatch = { intent: 'general', confidence: 0 };
    
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      const matches = lowerMsg.match(pattern);
      if (matches) {
        const confidence = matches.length / (message.split(' ').length || 1);
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
        }
      }
    }
    
    return bestMatch;
  }

  extractEntities(message, intent) {
    const entities = {
      hostel: this.extractHostelEntities(message),
      transport: this.extractTransportEntities(message),
      academics: this.extractAcademicEntities(message),
      notices: this.extractNoticeEntities(message),
      clubs: this.extractClubEntities(message),
      general: this.extractGeneralEntities(message)
    };
    
    return entities[intent] || {};
  }

  extractHostelEntities(message) {
    const entities = {};
    const hostelMatch = message.match(/hostel\s+([a-z\s]+?)(?=\s+in|\s+at|\s+near|\s*$)/i);
    if (hostelMatch) entities.hostelName = hostelMatch[1].trim();
    
    const roomTypeMatch = message.match(/(single|double|triple|shared|ac|non-ac)\s+room/i);
    if (roomTypeMatch) entities.roomType = roomTypeMatch[1].toLowerCase();
    
    return entities;
  }

  extractTransportEntities(message) {
    const entities = {};
    const fromMatch = message.match(/from\s+([a-z\s]+?)(?=\s+to|\s*$)/i);
    if (fromMatch) entities.from = fromMatch[1].trim();
    
    const toMatch = message.match(/to\s+([a-z\s]+?)(?=\s+at|\s+by|\s*$)/i);
    if (toMatch) entities.to = toMatch[1].trim();
    
    const timeMatch = message.match(/(morning|afternoon|evening|night|\d{1,2}(am|pm))/i);
    if (timeMatch) entities.time = timeMatch[1].toLowerCase();
    
    return entities;
  }

  extractAcademicEntities(message) {
    const entities = {};
    const deptMatch = message.match(/department\s+of\s+([a-z\s]+?)(?=\s+in|\s+at|\s*$)/i);
    if (deptMatch) entities.department = deptMatch[1].trim();
    
    const schoolMatch = message.match(/school\s+of\s+([a-z\s]+?)(?=\s+in|\s+at|\s*$)/i);
    if (schoolMatch) entities.school = schoolMatch[1].trim();
    
    const yearMatch = message.match(/(\d)(st|nd|rd|th)\s+year/i);
    if (yearMatch) entities.year = yearMatch[1];
    
    return entities;
  }

  extractNoticeEntities(message) {
    const entities = {};
    const categoryMatch = message.match(/(academic|event|emergency|general|exam|holiday)\s+notice/i);
    if (categoryMatch) entities.category = categoryMatch[1].toLowerCase();
    
    return entities;
  }

  extractClubEntities(message) {
    const entities = {};
    const clubMatch = message.match(/club\s+([a-z\s]+?)(?=\s+in|\s+at|\s+for|\s*$)/i);
    if (clubMatch) entities.clubName = clubMatch[1].trim();
    
    const activityMatch = message.match(/(technical|cultural|sports|literary|social)\s+(club|activity|group)/i);
    if (activityMatch) entities.activityType = activityMatch[1].toLowerCase();
    
    return entities;
  }

  extractGeneralEntities(message) {
    const entities = {};
    const locationMatch = message.match(/(where|location|address|directions?)\s+(?:is|are|to)?\s*([a-z\s]+?)(?=\?|\.|$)/i);
    if (locationMatch) entities.location = locationMatch[2].trim();
    
    return entities;
  }

  async generateResponse(message, context = {}) {
    const cacheKey = `resp:${message}:${JSON.stringify(context)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.response;
    }

    try {
      const prompt = this.buildPrompt(message, context);
      const response = await axios.post(`${this.modelEndpoint}/generate`, {
        model: this.model,
        prompt,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        context_window: this.contextWindow
      });
      
      const generated = response.data.generated_text || response.data.response;
      this.cache.set(cacheKey, {
        response: generated,
        timestamp: Date.now()
      });
      
      return generated;
    } catch (error) {
      console.error('LLaMA2 generation error:', error.message);
      return this.getFallbackResponse(message, context);
    }
  }

  buildPrompt(message, context) {
    let prompt = `You are Adamas Campus Assistant, an AI chatbot for Adamas Knowledge City campus.\n\n`;
    prompt += `Context: ${JSON.stringify(context)}\n\n`;
    prompt += `User: ${message}\n\n`;
    prompt += `Assistant: `;
    return prompt;
  }

  getFallbackResponse(message, context) {
    const intent = this.detectIntent(message);
    const responses = {
      hostel: `I can help you with hostel information. Please specify which hostel you're interested in, or ask about availability, facilities, or application process.`,
      transport: `I can help you with transport schedules and routes. Please specify your starting point and destination.`,
      academics: `I can provide information about departments, courses, and faculty. Please specify your school or department.`,
      notices: `I can show you campus notices and announcements. Would you like to see recent notices or specific categories?`,
      clubs: `I can help you find clubs and activities. Please specify your interests or department.`,
      general: `I can help you with information about Adamas campus. Please ask about hostels, transport, academics, notices, or clubs.`
    };
    
    return responses[intent.intent] || responses.general;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL
    };
  }
}

module.exports = new NLPProcessor();