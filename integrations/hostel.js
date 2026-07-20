// integrations/hostel.js - Hostel system integration
const axios = require('axios');
const config = require('../config');

class HostelIntegration {
  constructor() {
    this.baseUrl = config.campusApis.hostels;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async searchHostels(query) {
    try {
      const response = await this.client.get('/hostels/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Hostel API error:', error.message);
      return { error: 'Hostel service temporarily unavailable' };
    }
  }

  async getHostelDetails(hostelId) {
    try {
      const response = await this.client.get(`/hostels/${hostelId}`);
      return response.data;
    } catch (error) {
      console.error('Hostel details error:', error.message);
      return { error: 'Could not fetch hostel details' };
    }
  }

  async checkAvailability(hostelId, roomType) {
    try {
      const response = await this.client.get(`/hostels/${hostelId}/availability`, {
        params: { roomType }
      });
      return response.data;
    } catch (error) {
      console.error('Availability check error:', error.message);
      return { error: 'Could not check availability' };
    }
  }

  async getApplicationProcess() {
    try {
      const response = await this.client.get('/hostels/application-process');
      return response.data;
    } catch (error) {
      console.error('Application process error:', error.message);
      return { error: 'Could not fetch application process' };
    }
  }

  async submitApplication(applicationData) {
    try {
      const response = await this.client.post('/hostels/applications', applicationData);
      return response.data;
    } catch (error) {
      console.error('Application submission error:', error.message);
      return { error: 'Could not submit application' };
    }
  }
}

module.exports = new HostelIntegration();