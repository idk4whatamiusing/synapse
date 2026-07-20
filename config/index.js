// config/index.js - Configuration management
require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Campus API endpoints
  campusApis: {
    hostels: process.env.HOSTEL_API_URL || 'http://localhost:3001',
    transport: process.env.TRANSPORT_API_URL || 'http://localhost:3002',
    academics: process.env.ACADEMICS_API_URL || 'http://localhost:3003',
    notices: process.env.NOTICES_API_URL || 'http://localhost:3004',
    clubs: process.env.CLUBS_API_URL || 'http://localhost:3005'
  },

  // Chatbot configuration
  chatbot: {
    nlpModel: process.env.NLP_MODEL || 'llama2',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    contextWindow: parseInt(process.env.CONTEXT_WINDOW) || 4096,
    cacheTTL: parseInt(process.env.CACHE_TTL) || 300000
  },

  // Teams integration
  teams: {
    appId: process.env.TEAMS_APP_ID,
    appPassword: process.env.TEAMS_APP_PASSWORD,
    tenantId: process.env.TEAMS_TENANT_ID
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/adamas-chatbot',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Cache configuration
  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    ttl: parseInt(process.env.CACHE_TTL) || 300000
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'adamas-chatbot-secret',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  }
};