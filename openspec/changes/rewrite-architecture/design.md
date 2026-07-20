## Context

The repo currently has only a 13-point product wishlist (`plan.md`) and one narrow openspec change (`make-chatbot-functional`) that papers over a missing backend with a local-data fallback. There is no auth, no realtime layer, no system of record, and no LLM wiring. We are replanning the entire architecture from scratch so BMad + GSD agents can build it in clean, non-overlapping lanes.

The stack is now locked: bare React Native frontend; Gleam-on-BEAM primary backend with Rust NIFs for hot paths; Postgres (the "adamas database") as system of record; Redis for cache/sessions/pub-sub; RabbitMQ for durable async; LLM via OpenRouter or Amazon Bedrock behind a provider abstraction.

## Goals / Non-Goals

**Goals:**
- A monolith-first backend (single Gleam/BEAM app) that is the only runtime for v1 — no microservices, no GraphQL, no Kubernetes.
- Real-time chat/notices over websockets backed by Redis pub/sub fan-out.
- Auth validated against the adamas DB; a verified user is auto-placed into their school/department/year chat room.
- An LLM chatbot with retrieval over a local knowledge base and a controllable agent that invokes backend modules.
- A clear, durable topology that agents can execute against without stepping on each other.

**Non-Goals:**
- Photobooth, AI map navigation, bus navigation, location punch-in/out (deferred to later changes).
- Kafka (no replay/event-log need yet).
- Splitting into multiple deployable services.
- Using GitHub Issues as source of truth (it is a tracker mirror only).

## Decisions

### 1. Bare React Native (no Expo)
Native iOS/Android builds via the React Native CLI. Rationale: you want true cross-platform without the Expo runtime/OTA layer. Trade-off: more native setup; accepted.

### 2. Gleam on BEAM as primary backend
Gleam compiles to Erlang and runs on OTP, giving cheap massive concurrency (websockets, long-lived connections, supervisors that auto-recover) — ideal for chat/location/notices. Alternative considered: Rust Axum as primary HTTP server. Rejected for v1 because BEAM's concurrency/erlang reliability is a better fit for the realtime workload and keeps one runtime.

### 3. Rust only as NIFs/hot paths
Rust is used where CPU-bound work matters: LLM stream parsing, geo math, image processing (later). Alternative: write everything in Gleam. Rejected where performance matters. `ponytail: Rust surface kept minimal — add a NIF only when a path is actually hot.`

### 4. Postgres = system of record, Redis = cache/sessions/pub-sub, RabbitMQ = durable async
- Postgres holds students, schools, departments, years, notices, clubs, chat messages, group spaces. This is the adamas DB.
- Redis holds sessions, hot caches, and websocket fan-out channels (pub/sub).
- RabbitMQ holds durable task queues: LLM jobs, notice fan-out, agent actions. `ponytail: RabbitMQ wired only at first genuine durable-queue need (LLM-agent pipeline); Redis pub/sub covers realtime day one.`

### 5. LLM provider abstraction (OpenRouter + Bedrock)
One interface, two backends. The chatbot and its agent select a provider at runtime (config/credential). Retrieval reads a local knowledge base; agent actions call backend modules via API/RabbitMQ. Alternative: single hardcoded provider. Rejected — you specified both OpenRouter and Bedrock.

### 6. Auth via adamas DB; verification = DB match
Login uses roll number + credential checked against Postgres (adamas DB). On match, the user's school/department/year is known and they are admitted to the corresponding dept-year chat room. No separate manual approval step in v1. `ponytail: if a real verification gap appears (e.g. fake roll numbers), add admin approval later — YAGNI now.`

### 7. Project state in openspec/, Issues as mirror
The `openspec/` change/spec/tasks files are the source of truth for what agents do. GitHub Issues may mirror task status for humans but are never read as state. `ponytail: one change dir per feature; do not scatter truth across the network.`

## Risks / Trade-offs

- **BEAM/Gleam + Rust NIF interop complexity** → Mitigation: keep NIF boundary tiny and well-typed; start with zero NIFs and add only on proven hot paths.
- **RabbitMQ adds infra** → Mitigation: defer wiring until the LLM-agent pipeline needs durability; Redis covers realtime first.
- **LLM cost/latency** → Mitigation: provider abstraction allows fallback (Bedrock ↔ OpenRouter) and caching of retrieval results in Redis.
- **Stale knowledge base → wrong answers** → Mitigation: KB is versioned in repo and refreshed from adamas DB seed.
- **Monolith becomes a bottleneck** → Mitigation: modules are cleanly bounded so a single module can be extracted to its own BEAM app later without rewrites.

## Migration Plan

1. Retire the `make-chatbot-functional` change (its requirements are superseded).
2. Stand up Postgres + Redis + RabbitMQ (managed or local docker-compose for dev).
3. Scaffold Gleam/BEAM app + Rust NIF crate + bare RN app.
4. Implement capabilities in dependency order: identity-auth → data-integration-layer → campus-chatbot → notices → dept-year-chat → group-spaces.
5. Rollback: capabilities are independently deployable; revert a change dir and its migration.

## Open Questions

- Managed Redis/Postgres/RabbitMQ provider preference (Upstash / ElastiCache / self-hosted)?
- Is a human-facing admin approval needed for dept-year rooms, or is DB match sufficient? (Default: DB match sufficient for v1.)
- WebSocket transport library choice on bare RN (to be picked by frontend agent).
