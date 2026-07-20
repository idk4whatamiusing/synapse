## ADDED Requirements

### Requirement: Local-information group spaces
The system SHALL provide group spaces for local campus information where verified users can discuss and share.

#### Scenario: Create or join a space
- **WHEN** a verified user creates or joins a group space
- **THEN** they can post and read messages within that space

### Requirement: Realtime group messages over websocket + Redis
The system SHALL deliver group-space messages in real time via websocket backed by Redis pub/sub, and persist history in Postgres.

#### Scenario: Group message delivered
- **WHEN** a member posts in a group space
- **THEN** other members receive it live and it is stored for history
