## ADDED Requirements

### Requirement: Login against adamas DB
The system SHALL authenticate a user by validating roll number and credential against the adamas DB (Postgres). On success it SHALL load the user's school, department, and year.

#### Scenario: Valid credentials
- **WHEN** a user submits a known roll number and correct credential
- **THEN** the system returns a session and the user's school/department/year mapping

#### Scenario: Unknown roll number
- **WHEN** a user submits a roll number not present in the adamas DB
- **THEN** the system rejects login and returns an authentication error

### Requirement: Session via Redis
The system SHALL store the authenticated session in Redis and require it for protected endpoints and websocket connections.

#### Scenario: Protected request without session
- **WHEN** a request arrives without a valid Redis session
- **THEN** the system rejects it with an unauthorized response

### Requirement: Verification gates dept-year chat
The system SHALL admit a verified user only into the chat room matching their school/department/year derived from the adamas DB.

#### Scenario: Auto-placement into room
- **WHEN** a verified user connects to dept-year chat
- **THEN** they are placed into the room for their school/department/year and cannot join other years/departments
