// src/services/knowledgeBase.js - Structured campus knowledge base
module.exports = {
  hostels: [
    {
      id: 'h1',
      name: 'Aurobindo Hostel',
      type: 'boys',
      gender: 'male',
      rooms: 'single, double, triple',
      ac: true,
      facilities: ['wifi', 'mess', 'laundry', 'gym', 'study room'],
      proximity: 'near academic block A'
    },
    {
      id: 'h2',
      name: 'Vivekananda Hostel',
      type: 'boys',
      gender: 'male',
      rooms: 'double, triple',
      ac: false,
      facilities: ['wifi', 'mess', 'common room'],
      proximity: 'near main gate'
    },
    {
      id: 'h3',
      name: 'Sarojini Hostel',
      type: 'girls',
      gender: 'female',
      rooms: 'single, double',
      ac: true,
      facilities: ['wifi', 'mess', 'laundry', 'reading room'],
      proximity: 'near academic block B'
    }
  ],
  transport: [
    {
      id: 'r1',
      route: 'Campus to Kolkata Station',
      stops: ['Main Gate', 'City Center', 'Salt Lake', 'Kolkata Station'],
      departure: '07:00, 13:30, 17:45',
      frequency: '3 trips/day'
    },
    {
      id: 'r2',
      route: 'Campus to Barasat',
      stops: ['Main Gate', 'Barasat Bus Stand'],
      departure: '08:00, 15:00',
      frequency: '2 trips/day'
    }
  ],
  academics: [
    {
      id: 's1',
      school: 'School of Engineering',
      departments: ['CSE', 'ECE', 'ME', 'CE'],
      programs: ['B.Tech', 'M.Tech', 'PhD']
    },
    {
      id: 's2',
      school: 'School of Management',
      departments: ['MBA', 'BBA'],
      programs: ['BBA', 'MBA']
    },
    {
      id: 's3',
      school: 'School of Sciences',
      departments: ['Physics', 'Chemistry', 'Mathematics'],
      programs: ['B.Sc', 'M.Sc', 'PhD']
    }
  ],
  clubs: [
    { id: 'c1', name: 'Coding Club', category: 'technical', department: 'CSE' },
    { id: 'c2', name: 'Dramatics Society', category: 'cultural', department: 'all' },
    { id: 'c3', name: 'Robotics Club', category: 'technical', department: 'ME' },
    { id: 'c4', name: 'Photography Club', category: 'cultural', department: 'all' }
  ],
  notices: [
    { id: 'n1', title: 'Semester Registration Open', category: 'academic', date: '2026-07-15' },
    { id: 'n2', title: 'Campus Flood Advisory', category: 'emergency', date: '2026-07-18' },
    { id: 'n3', title: 'Annual Tech Fest', category: 'event', date: '2026-08-01' }
  ],
  facilities: [
    { id: 'f1', name: 'Central Library', location: 'Academic Block A, 2nd floor', hours: '8am-10pm' },
    { id: 'f2', name: 'Health Center', location: 'Near hostel zone', hours: '24x7' },
    { id: 'f3', name: 'Cafeteria', location: 'Student Plaza', hours: '7am-11pm' }
  ]
};