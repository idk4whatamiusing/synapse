---
stepsCompleted: [step-01, step-02, step-03, step-04]
inputDocuments:
  - _bmad-output/planning-artifacts/synapse-prd/prd.md
  - _bmad-output/planning-artifacts/rewrite-architecture-spine/ARCHITECTURE-SPINE.md
---

# Synapse — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Synapse, decomposing the requirements from the PRD, and Architecture requirements (spine AD-1..AD-10) into implementable stories. No UX design contract exists yet; UI work follows the spine's bare-RN convention.

## Requirements Inventory

### Functional Requirements

FR-1: Dashboard — verified user views personalized dashboard aggregating academics/hostel/transport/notice summaries (from adamas DB).
FR-2: Account & Qualifications — user views/edits My Account, Previous Qualifications, Exams (via data layer).
FR-3: Academics/Hostel/Transport/Feedback — user accesses these sections; Feedback persists to Postgres.
FR-4: Logout — user logs out, invalidates Redis session; protected calls then 401.
FR-5: Login against adamas DB — user logs in with roll number + credential; validated vs Postgres, returns Redis session.
FR-6: Session guard — all protected routes + websocket connections require valid Redis session.
FR-7: Verification gates dept-year room — verified user admitted only to their School/Department/Year room.
FR-8: LLM provider abstraction — chatbot answers via one interface, OpenRouter + Bedrock backends, runtime-switchable, fallback on failure.
FR-9: Retrieval over local KB — campus queries answered via retrieval over local knowledge base.
FR-10: Controllable agent — chatbot drives agent invoking backend modules via API/RabbitMQ to act.
FR-11: Publish notice — authorized user publishes notice persisted in Postgres.
FR-12: Push notice realtime — new notices pushed to subscribed clients via websocket + Redis pub/sub.
FR-13: Emergency broadcast — emergency-flagged notices pushed to ALL clients regardless of subscription.
FR-14: Create/join group space — verified user creates/joins group space, posts/reads within it.
FR-15: Group messages realtime — group messages delivered live (ws+Redis) and persisted in Postgres.
FR-16: Join club — verified user joins club, views activity feed.
FR-17: Room per combo — exactly one room per School × Department × Year (10 schools × depts × 4 years).
FR-18: Verified-only admission — unverified / wrong-dept/year users rejected from dept-year room.
FR-19: Note sharing — room member uploads faculty notes (document) to room; persists + fans out live.
FR-20: Realtime room messages — dept-year messages delivered live (ws+Redis) and persisted.
FR-21: Internal data modules — campus data served from internal Postgres modules, not external localhost services.
FR-22: Seed from adamas DB — migrations + seed populate schools/departments/years/baseline data.

### NonFunctional Requirements

NFR-1 (Perf): Notice delivery latency publish→client < 2s (SM-3).
NFR-2 (Rel): Login reaches correct dept-year room without error > 95% (SM-1).
NFR-3 (Rel): Chatbot answer rate on campus queries > 90% (SM-2).
NFR-4 (Sec): All protected routes + sockets require valid Redis session (FR-6).
NFR-5 (Sec): No unverified user admitted to dept-year room (FR-18).
NFR-6 (Obs): Every message/notice persisted in Postgres for history/audit.

### Additional Requirements

- ARCH-AD-1: Monolith-first — one Gleam/BEAM app; no microservices/GraphQL/K8s in v1.
- ARCH-AD-2: Bare React Native (CLI), native iOS+Android, no Expo.
- ARCH-AD-3: Gleam primary; Rust NIFs only for hot paths (LLM stream parse, geo, image-later).
- ARCH-AD-4: Postgres = system of record; Redis = cache/sessions/pub-sub; RabbitMQ = durable async.
- ARCH-AD-5: RabbitMQ wired only at first durable-queue need (LLM-agent pipeline); Redis pub/sub covers realtime day one.
- ARCH-AD-6: LLM behind one provider abstraction (OpenRouter + Bedrock).
- ARCH-AD-7: Auth = adamas-DB match gates chat; no manual approval in v1.
- ARCH-AD-8: Realtime = websocket + Redis pub/sub; history in Postgres.
- ARCH-AD-9: openspec/ is source of truth; GitHub Issues = mirror only.
- ARCH-AD-10: Deferred — photobooth, map nav, bus nav, location punch, Kafka.

### UX Design Requirements

- None yet (no UX design contract produced). UI follows bare-RN convention from spine AD-2; create UX contract before frontend build if needed.

### FR Coverage Map

| FR | Epic |
| --- | --- |
| FR-1..4, FR-21..22 | E1 Foundation & Data |
| FR-5..7 | E2 Identity & Auth |
| FR-8..10 | E3 Campus Chatbot & Agent |
| FR-11..13 | E4 Notices |
| FR-14..15 | E5 Group Spaces |
| FR-16 | E6 Clubs |
| FR-17..20 | E7 Dept-Year Chat |

## Epic List

E1 Foundation & Data · E2 Identity & Auth · E3 Campus Chatbot & Agent · E4 Notices · E5 Group Spaces · E6 Clubs · E7 Dept-Year Chat

## Epic 1: Foundation & Data

Stand up the monolith Gleam/BEAM app, Postgres (adamas DB) schema + seed, internal data/integration modules, Redis + RabbitMQ clients, and the bare-RN app shell.

### Story 1.1: Scaffold Gleam/BEAM monolith
As a backend developer, I want a Gleam/BEAM app skeleton, So that all modules have one runtime.
**Acceptance Criteria:**
**Given** an empty repo
**When** the Gleam app is scaffolded with HTTP listener + OTP supervision
**Then** it boots and answers a health endpoint
**And** no microservice/GraphQL dependency is present (AD-1)

### Story 1.2: Provision Postgres + Redis + RabbitMQ
As a DevOps agent, I want Postgres/Redis/RabbitMQ available, So that state and realtime work.
**Acceptance Criteria:**
**Given** a dev environment
**When** the three stores are provisioned (managed or docker-compose)
**Then** the Gleam app can connect to all three (AD-4)

### Story 1.3: Postgres schema + adamas-DB seed
As a data agent, I want the schema + seed, So that schools/departments/years/baseline data exist.
**Acceptance Criteria:**
**Given** a fresh Postgres
**When** migrations + seed run
**Then** 10 schools, their departments, years 1–4, and baseline campus data are queryable (FR-22)

### Story 1.4: Internal data/integration modules
As a backend agent, I want internal data modules, So that campus data comes from Postgres not external services.
**Acceptance Criteria:**
**Given** the schema exists
**When** a data request (hostel/transport/academics/notices/clubs) is made
**Then** it returns from Postgres modules, never localhost:3001-3005 (FR-21, AD-1)

### Story 1.5: Bare-RN app shell
As a frontend agent, I want a bare-RN app, So that the cross-platform UI has a runtime.
**Acceptance Criteria:**
**Given** the project root
**When** the RN CLI app is scaffolded (no Expo)
**Then** it builds for iOS+Android and can call the backend health endpoint (AD-2)

## Epic 2: Identity & Auth

### Story 2.1: Login against adamas DB
As a student, I want to log in with roll number + credential, So that I'm verified.
**Acceptance Criteria:**
**Given** a known roll number + correct credential
**When** I submit login
**Then** I get a Redis session and my School/Department/Year is derived (FR-5, AD-7)
**And** an unknown roll number is rejected

### Story 2.2: Session guard
As a backend agent, I want protected routes + sockets guarded, So that only authed users act.
**Acceptance Criteria:**
**Given** a request without a valid Redis session
**When** it hits a protected route or opens a socket
**Then** it is rejected (401 / socket close) (FR-6, NFR-4)

### Story 2.3: Verification gates dept-year room
As a verified user, I want to land only in my dept-year room, So that rooms stay verified.
**Acceptance Criteria:**
**Given** a verified user of SOET/CSE/Year-1
**When** they request dept-year room admission
**Then** they are placed in SOET/CSE/Year-1 only, and cannot join other combos (FR-7, FR-18, NFR-5)

## Epic 3: Campus Chatbot & Agent

### Story 3.1: LLM provider abstraction
As a backend agent, I want one LLM interface with OpenRouter + Bedrock, So that provider is swappable.
**Acceptance Criteria:**
**Given** the chatbot configured with a provider
**When** the active provider is unavailable
**Then** it falls back to the other (FR-8, AD-6)

### Story 3.2: Retrieval over local KB
As a student, I want campus answers from the chatbot, So that I get real info.
**Acceptance Criteria:**
**Given** a KB-covered question
**When** I ask the chatbot
**Then** I get a sourced answer, not "unavailable" (FR-9, NFR-3)

### Story 3.3: Controllable agent
As a student, I want the chatbot to act via an agent, So that it does tasks not just answers.
**Acceptance Criteria:**
**Given** an actionable request (e.g. post to my group)
**When** the chatbot invokes the agent
**Then** the backend module runs and the result is reported (FR-10)
**And** RabbitMQ is engaged only when a durable queue is needed (AD-5)

## Epic 4: Notices

### Story 4.1: Publish notice
As an authorized publisher, I want to publish notices, So that students are informed.
**Acceptance Criteria:**
**Given** an authorized user
**When** they publish a notice
**Then** it persists in Postgres (FR-11)

### Story 4.2: Realtime push + emergency
As a student, I want notices pushed live, So that I see them immediately.
**Acceptance Criteria:**
**Given** a published notice
**When** it is pushed via Redis pub/sub → websocket
**Then** subscribed clients receive it without polling (FR-12, NFR-1)
**And** an emergency-flagged notice reaches ALL clients (FR-13)

## Epic 5: Group Spaces

### Story 5.1: Create/join group space
As a verified user, I want group spaces, So that I can discuss locally.
**Acceptance Criteria:**
**Given** a verified user
**When** they create/join a space
**Then** they can post/read within it; non-members cannot read (FR-14)

### Story 5.2: Realtime group messages
As a group member, I want live messages, So that discussion flows.
**Acceptance Criteria:**
**Given** a posted group message
**When** it fans out via ws+Redis
**Then** members receive it live and it persists in Postgres (FR-15, NFR-6)

## Epic 6: Clubs

### Story 6.1: Join club + activity
As a verified user, I want to join clubs and see activity, So that I engage campus life.
**Acceptance Criteria:**
**Given** a verified user
**When** they join a club
**Then** it appears in their club list with its activity feed (FR-16)

## Epic 7: Dept-Year Chat

### Story 7.1: Room per combo
As the system, I want one room per School×Dept×Year, So that structure is exact.
**Acceptance Criteria:**
**Given** the room set enumerated
**When** counted
**Then** there is exactly one room per 10 schools × departments × 4 years (FR-17)

### Story 7.2: Verified-only admission
As a wrong-dept user, I want to be rejected, So that rooms stay clean.
**Acceptance Criteria:**
**Given** an unverified or mismatched user
**When** they attempt to join
**Then** the join is rejected (FR-18, NFR-5)

### Story 7.3: Note sharing
As a room member, I want to upload faculty notes, So that we share study material.
**Acceptance Criteria:**
**Given** a room member
**When** they upload a document
**Then** it persists in Postgres and fans out live to members (FR-19)

### Story 7.4: Realtime room messages
As a room member, I want live messages, So that chat is instant.
**Acceptance Criteria:**
**Given** a sent room message
**When** it fans out via ws+Redis
**Then** members receive it live and it persists in Postgres (FR-20, NFR-6)
