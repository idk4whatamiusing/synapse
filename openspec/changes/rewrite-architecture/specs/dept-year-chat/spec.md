## ADDED Requirements

### Requirement: Verified-only dept-year rooms
The system SHALL provide chat rooms for every combination of the 10 schools × their departments × 4 years, accessible only to verified users matched to that school/department/year from the adamas DB.

#### Scenario: Room exists per combo
- **WHEN** the room set is enumerated
- **THEN** there is exactly one room per school/department/year combination

#### Scenario: Unverified user blocked
- **WHEN** an unverified or wrong-department user attempts to join a dept-year room
- **THEN** the system rejects the join

### Requirement: Realtime messages over websocket + Redis
The system SHALL deliver dept-year chat messages in real time via websocket backed by Redis pub/sub, and persist history in Postgres.

#### Scenario: Message sent
- **WHEN** a verified member sends a message
- **THEN** other members of the room receive it live and it is stored for history
