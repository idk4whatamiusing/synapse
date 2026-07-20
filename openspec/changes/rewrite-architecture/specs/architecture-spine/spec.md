## ADDED Requirements

### Requirement: Architecture spine and tech-stack decisions
The system SHALL be built as a monolith-first backend: bare React Native frontend; Gleam-on-BEAM primary backend with Rust NIFs for hot paths only; Postgres as system of record (adamas DB); Redis for cache/sessions/pub-sub; RabbitMQ for durable async (LLM jobs, notice fan-out, agent tasks); LLM via an OpenRouter/Bedrock provider abstraction. No microservices, GraphQL, or Kubernetes in v1.

#### Scenario: Topology is coherent and documented
- **WHEN** an agent reads the architecture spine
- **THEN** it finds the component topology, tech-stack decisions, and the deferred-list (photobooth, map nav, bus nav, location punch, Kafka) clearly recorded as ADRs

#### Scenario: Project state lives in openspec
- **WHEN** agents need the current task/feature state
- **THEN** they read `openspec/` change/spec/tasks files, and GitHub Issues are treated only as a human-facing mirror, never as source of truth
