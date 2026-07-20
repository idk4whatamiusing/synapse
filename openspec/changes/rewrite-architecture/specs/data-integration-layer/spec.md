## ADDED Requirements

### Requirement: Internal data modules read Postgres
The system SHALL expose a single data/integration layer of internal modules that read and write the adamas DB (Postgres). It SHALL NOT call external microservices for campus data.

#### Scenario: Chatbot requests campus data
- **WHEN** the chatbot or frontend needs hostel/transport/academics/notices/clubs data
- **THEN** the integration layer returns it from Postgres, not from an external localhost service

### Requirement: Seed from adamas DB
The system SHALL provide migrations and a seed path that populate the adamas DB from authoritative campus records.

#### Scenario: Fresh database
- **WHEN** the database is initialized
- **THEN** schools, departments, years, and baseline campus data exist and are queryable by the integration layer
