// integrations/transport.js - Transport system integration
const axios = require('axios');
const config = require('../config');

class TransportIntegration {
  constructor() {
    this.baseUrl = config.campusApis.transport;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getRoutes(query) {
    try {
      const response = await this.client.get('/routes', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Transport routes error:', error.message);
      return { error: 'Transport service temporarily unavailable' };
    }
  }

  async getSchedule(from, to, date) {
    try {
      const response = await this.client.get('/schedule', {
        params: { from, to, date }
      });
      return response.data;
    } catch (error) {
      console.error('Schedule error:', error.message);
      return { error: 'Could not fetch schedule' };
    }
  }

  async getRealTimeArrivals(stopId) {
    try {
      const response = await this.client.get('/arrivals', {
        params: { stopId }
      });
      return response.data;
    } catch (error) {
      console.error('Real-time arrivals error:', error.message);
      return { error: 'Could not fetch real-time arrivals' };
    }
  }

  async getBusLocations(routeId) {
    try {
      const response = await this.client.get('/bus-locations', {
        params: { routeId }
      });
      return response.data;
    } catch (error) {
      console.error('Bus locations error:', error.message);
      return { error: 'Could not fetch bus locations' };
    }
  }

  async getRouteInfo(routeId) {
    try {
      const response = await this.client.get(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error('Route info error:', error.message);
      return { error: 'Could not fetch route information' };
    }
  }
}

module.exports = new TransportIntegration();