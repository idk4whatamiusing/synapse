// backend/gateway.js - API Gateway for campus integrations
const express = require('express');
const hostelIntegration = require('../integrations/hostel');
const transportIntegration = require('../integrations/transport');
const academicsIntegration = require('../integrations/academics');
const noticesIntegration = require('../integrations/notices');
const clubsIntegration = require('../integrations/clubs');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      hostel: 'active',
      transport: 'active',
      academics: 'active',
      notices: 'active',
      clubs: 'active'
    }
  });
});

// Hostel endpoints
router.get('/hostels/search', async (req, res) => {
  try {
    const result = await hostelIntegration.searchHostels(req.query.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hostels/:id', async (req, res) => {
  try {
    const result = await hostelIntegration.getHostelDetails(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hostels/:id/availability', async (req, res) => {
  try {
    const result = await hostelIntegration.checkAvailability(req.params.id, req.query.roomType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transport endpoints
router.get('/transport/routes', async (req, res) => {
  try {
    const result = await transportIntegration.getRoutes(req.query.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transport/schedule', async (req, res) => {
  try {
    const result = await transportIntegration.getSchedule(req.query.from, req.query.to, req.query.date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transport/arrivals/:stopId', async (req, res) => {
  try {
    const result = await transportIntegration.getRealTimeArrivals(req.params.stopId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Academics endpoints
router.get('/academics/departments', async (req, res) => {
  try {
    const result = await academicsIntegration.getDepartments(req.query.school);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/academics/departments/:id', async (req, res) => {
  try {
    const result = await academicsIntegration.getDepartmentDetails(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/academics/departments/:id/faculty', async (req, res) => {
  try {
    const result = await academicsIntegration.getFaculty(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/academics/schools/:id', async (req, res) => {
  try {
    const result = await academicsIntegration.getSchoolInfo(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notices endpoints
router.get('/notices', async (req, res) => {
  try {
    const result = await noticesIntegration.getNotices(req.query.category, req.query.limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notices/emergency', async (req, res) => {
  try {
    const result = await noticesIntegration.getEmergencyNotices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notices/events', async (req, res) => {
  try {
    const result = await noticesIntegration.getEventNotices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clubs endpoints
router.get('/clubs', async (req, res) => {
  try {
    const result = await clubsIntegration.getClubs(req.query.category, req.query.department);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/clubs/:id', async (req, res) => {
  try {
    const result = await clubsIntegration.getClubDetails(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/clubs/:id/events', async (req, res) => {
  try {
    const result = await clubsIntegration.getClubEvents(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clubs/:id/join', async (req, res) => {
  try {
    const result = await clubsIntegration.joinClub(req.params.id, req.body.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;