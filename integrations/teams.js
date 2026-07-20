// integrations/teams.js - Microsoft Teams incoming webhook integration
const axios = require('axios');
const config = require('../config');

class TeamsIntegration {
  constructor() {
    this.webhookUrl = config.teams.webhookUrl || process.env.TEAMS_WEBHOOK_URL;
    this.enabled = config.teams.enabled || false;
  }

  async sendMessage(text, title = 'Adamas Campus Assistant') {
    if (!this.enabled || !this.webhookUrl) {
      // ponytail: no-op until Teams webhook is configured via env/config
      return { sent: false, reason: 'teams disabled or webhook not configured' };
    }
    try {
      await axios.post(this.webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0072C6',
        summary: title,
        sections: [{ activityTitle: title, text }]
      });
      return { sent: true };
    } catch (error) {
      return { sent: false, error: error.message };
    }
  }
}

module.exports = new TeamsIntegration();