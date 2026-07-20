# Make Chatbot Functional - Local Data Fallback

## Tasks

### Implementation

- [ ] 1.1 Create `data/campusSeed.js` with hostels, transport, academics, notices, clubs (reuse from `src/services/knowledgeBase.js` where aligned)
- [ ] 1.2 Add `config.campusApis.useLocalData` (env `USE_LOCAL_DATA`, default false)
- [ ] 1.3 Wire fallback into `integrations/hostel.js` (searchHostels, getHostelDetails, checkAvailability)
- [ ] 1.4 Wire fallback into `integrations/transport.js` (getRoutes, getSchedule, getRealTimeArrivals)
- [ ] 1.5 Wire fallback into `integrations/academics.js` (getDepartments, getDepartmentDetails, getFaculty, getSchoolInfo)
- [ ] 1.6 Wire fallback into `integrations/notices.js` (getNotices, getEmergencyNotices, getEventNotices)
- [ ] 1.7 Wire fallback into `integrations/clubs.js` (getClubs, getClubDetails, getClubEvents, joinClub)
- [ ] 1.8 Add unit tests asserting each integration returns seed data when `USE_LOCAL_DATA=true` (no network)
- [ ] 1.9 Update README + docs/DEPLOYMENT.md to document local mode
- [ ] 1.10 Verify `POST /chat` returns real answers for hostel/transport/academics/notices/clubs queries end-to-end

## Task Progress

### Task Summary
- **Total Tasks**: 10
- **Completed Tasks**: 0
- **Pending Tasks**: 10

### Phase Progress
- **Local Data Fallback**: 0/10 tasks (0% complete)
