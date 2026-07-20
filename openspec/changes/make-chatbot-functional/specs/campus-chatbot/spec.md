## ADDED Requirements

### Requirement: Local campus data fallback for integrations
The system SHALL return structured campus data from a local seed module when the remote campus microservice is unreachable or `USE_LOCAL_DATA` is enabled, so that chatbot queries return real answers without the external services running.

#### Scenario: Remote hostel service down
- **WHEN** a user asks about hostels and `HOSTEL_API_URL` is unreachable
- **THEN** the chatbot returns hostel data from the local seed (name, gender, rooms, facilities, availability)

#### Scenario: USE_LOCAL_DATA enabled
- **WHEN** `USE_LOCAL_DATA=true` is set
- **THEN** all five integrations serve from the seed regardless of remote reachability

#### Scenario: Remote available
- **WHEN** the remote service responds successfully
- **THEN** the integration returns the remote response (fallback not used)

### Requirement: Single seed source of truth
The system SHALL maintain one seed data module (`data/campusSeed.js`) containing hostels, transport, academics, notices, and clubs, reused by all integration modules.

#### Scenario: Consistent data
- **WHEN** any integration reads fallback data
- **THEN** it reads from `data/campusSeed.js` and not a duplicated literal
