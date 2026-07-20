## ADDED Requirements

### Requirement: Publish notices
The system SHALL allow authorized publishers to create notices stored in Postgres.

#### Scenario: Authorized publish
- **WHEN** an authorized user publishes a notice
- **THEN** it is persisted and becomes available for push to clients

### Requirement: Push notices over websocket via Redis pub/sub
The system SHALL push new notices to connected clients in real time using Redis pub/sub fan-out to websockets.

#### Scenario: Notice delivered
- **WHEN** a notice is published
- **THEN** subscribed clients receive it over their open websocket connection without polling

#### Scenario: Emergency notices
- **WHEN** a notice is flagged emergency
- **THEN** it is pushed to all clients regardless of topic subscription
