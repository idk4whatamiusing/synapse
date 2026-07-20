// integrations/clubs.js - Club and extracurricular activities integration
const axios = require('axios');
const config = require('../config');

class ClubsIntegration {
  constructor() {
    this.baseUrl = config.campusApis.clubs;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getClubs(category, department) {
    try {
      const response = await this.client.get('/clubs', {
        params: { category, department }
      });
      return response.data;
    } catch (error) {
      console.error('Clubs error:', error.message);
      return { error: 'Club service temporarily unavailable' };
    }
  }

  async getClubDetails(clubId) {
    try {
      const response = await this.client.get(`/clubs/${clubId}`);
      return response.data;
    } catch (error)      {
      console.error('Club details error:', error.message);
      return { error: 'Could not fetch club details' };
    }
  }

  async getClubEvents(clubId) {
    try {
      const response = await this.client.get(`/clubs/${clubId}/events`);
      return response.data;
    } catch (error) {
      console.error('Club events error:', error.message);
      return { error: 'Could not fetch club events' };
    }
  }

  async getClubMembership(clubId, userId) {
    try {
      const response = await this.client.get(`/clubs/${clubId}/membership`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Club membership error:', error.message);
      return { error: 'Could not fetch membership information' };
    }
  }

  async joinClub(clubId, userId) {
    try {
      const response = await this.client.post(`/clubs/${clubId}/join`, { userId });
      return response.data;
    } catch (error) {
      console.error('Join club error:', error.message);
      return { error: 'Could not join club' };
    }
  }

  async getClubSchedule(clubId) {
    try {
      const response = await this.client.get(`/clubs/${clubId}/schedule`);
      return response.data;
    } catch (error) {
      console.error('Club schedule error:', error.message);
      return { error: 'Could not fetch club schedule' };
    }
  }
}

module.exports = new ClubsIntegration();