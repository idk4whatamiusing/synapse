// integrations/academics.js - Academic departments integration
const axios = require('axios');
const config = require('../config');

class AcademicsIntegration {
  constructor() {
    this.baseUrl = config.campusApis.academics;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getDepartments(school) {
    try {
      const response = await this.client.get('/departments', {
        params: { school }
      });
      return response.data;
    } catch (error) {
      console.error('Departments error:', error.message);
      return { error: 'Academic service temporarily unavailable' };
    }
  }

  async getDepartmentDetails(deptId) {
    try {
      const response = await this.client.get(`/departments/${deptId}`);
      return response.data;
    } catch (error) {
      console.error('Department details error:', error.message);
      return { error: 'Could not fetch department details' };
    }
  }

  async getFaculty(deptId) {
    try {
      const response = await this.client.get(`/departments/${deptId}/faculty`);
      return response.data;
    } catch (error) {
      console.error('Faculty error:', error.message);
      return { error: 'Could not fetch faculty information' };
    }
  }

  async getPrograms(deptId) {
    try {
      const response = await this.client.get(`/departments/${deptId}/programs`);
      return response.data;
    } catch (error) {
      console.error('Programs error:', error.message);
      return { error: 'Could not fetch program information' };
    }
  }

  async getCourses(deptId, year) {
    try {
      const response = await this.client.get(`/departments/${deptId}/courses`, {
        params: { year }
      });
      return response.data;
    } catch (error) {
      console.error('Courses error:', error.message);
      return { error: 'Could not fetch course information' };
    }
  }

  async getSchoolInfo(schoolId) {
    try {
      const response = await this.client.get(`/schools/${schoolId}`);
      return response.data;
    } catch (error) {
      console.error('School info error:', error.message);
      return { error: 'Could not fetch school information' };
    }
  }
}

module.exports = new AcademicsIntegration();