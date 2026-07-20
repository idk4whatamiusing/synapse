## Why

The current `plan.md` is a 13-point product wishlist with no executable architecture, and the only openspec change (`make-chatbot-functional`) is a tiny local-data fallback for a chatbot that has no real backend, no auth, and no realtime layer. We need to replan the entire architecture from scratch so agents (BMad + GSD) can build it smoothly: a cross-platform app backed by a coherent Gleam/Rust/Redis/RabbitMQ/Postgres stack with an LLM-powered chatbot+agent.

## What Changes

- **BREAKING**: Discard the microservice-at-localhost approach from prior work. Adopt a monolith-first backend (no microservices, no GraphQL, no Kubernetes in v1).
- **Frontend**: Bare React Native (iOS + Android native builds, no Expo).
- **Backend**: Gleam on the BEAM as the primary runtime (HTTP + websockets + OTP business logic), with Rust NIFs for hot paths only (LLM stream parsing, geo math, image processing later).
- **State**: Postgres as system of record (the "adamas database"); Redis for cache, sessions, and websocket pub/sub fan-out; RabbitMQ for durable async work (LLM jobs, notice fan-out, agent tasks).
- **LLM**: Provider abstraction supporting OpenRouter and Amazon Bedrock; the chatbot can drive a controllable agent that calls backend modules.
- **Auth/identity**: Login validated against the adamas DB (roll number → school/department/year). A DB match verifies the user and gates entry into the correct dept-year chat rooms.
- **v1 scope (core)**: identity/auth, data/integration layer (internal modules, no external services), campus chatbot + agent, notices with push, dept-year verified chat (10 schools × departments × 4 years), group spaces.
- **Deferred (later changes)**: photobooth, AI map navigation, bus navigation, location punch-in/out, Kafka.
- **Project state**: lives in `openspec/`; GitHub Issues used only as a human-facing tracker mirror, never as source of truth.

## Capabilities

### New Capabilities
- `architecture-spine`: the locked component topology, tech-stack decisions, and ADRs (monolith Gleam+BEAM, Rust NIFs, Redis/RabbitMQ/Postgres, bare RN, LLM abstraction). Foundation all other capabilities build on.
- `identity-auth`: login against adamas DB, session via Redis, roll-number → school/department/year mapping that verifies users into dept-year chat rooms.
- `data-integration-layer`: internal data modules reading Postgres; the single "integration layer" (no external microservices).
- `campus-chatbot`: LLM-backed chatbot (OpenRouter/Bedrock) with retrieval over a local knowledge base; controllable agent that invokes backend modules via RabbitMQ/API.
- `notices`: publish notices and push them to clients via Redis pub/sub → websocket.
- `dept-year-chat`: verified-only chat rooms for 10 schools × departments × 4 years, realtime over websocket + Redis.
- `group-spaces`: local-information discussion spaces, realtime over websocket + Redis.

### Modified Capabilities
- `campus-chatbot`: supersedes the prior `make-chatbot-functional` change (local-data fallback is obsolete once the real backend + data layer exist). The prior change's requirements are replaced by the new `campus-chatbot` and `data-integration-layer` capabilities.

## Impact

- Replaces the foundational assumptions of all prior openspec work; the `make-chatbot-functional` change is retired.
- New dependencies: Gleam toolchain, Rust (for NIFs), Postgres, Redis, RabbitMQ, an OpenRouter or Bedrock credential.
- New repo structure: Gleam/BEAM backend service, Rust NIF crate, bare React Native app, Postgres migrations, `openspec/` as project state.
- Risks: BEAM/Gleam + Rust NIF interop complexity; RabbitMQ adds an infra component (deferred wiring to first durable-queue need — LLM-agent pipeline); LLM cost/latency governed by provider abstraction.
