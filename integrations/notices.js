// integrations/notices.js - Notices and announcements integration
const axios = require('axios');
const config = require('../config');

class NoticesIntegration {
  constructor() {
    this.baseUrl = config.campusApis.notices;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getNotices(category, limit) {
    try {
      const response = await this.client.get('/notices', {
        params: { category, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Notices error:', error.message);
      return { error: 'Notice service temporarily unavailable' };
    }
  }

  async getNoticeDetails(noticeId) {
    try {
      const response = await this.client.get(`/notices/${noticeId}`);
      return response.data;
    } catch (error) {
      console.error('Notice details error:', error.message);
      return { error: 'Could not fetch notice details' };
    }
  }

  async getEmergencyNotices() {
    try {
      const response = await this.client.get('/notices/emergency');
      return response.data;
    } catch (error) {
      console.error('Emergency notices error:', error.message);
      return { error: 'Could not fetch emergency notices' };
    }
  }

  async getEventNotices() {
    try {
      const response = await this.client.get('/notices/events');
      return response.data;
    } catch (error) {
      console.error('Event notices error:', error.message);
      return { error: 'Could not fetch event notices' };
    }
  }

  async getCategoryNotices(category) {
    try {
      const response = await this.client.get(`/notices/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Category notices error:', error.message);
      return { error: 'Could not fetch notices for this category' };
    }
  }
}

module.exports = new NoticesIntegration();