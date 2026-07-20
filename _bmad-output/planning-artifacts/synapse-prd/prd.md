---
title: Synapse — Adamas Campus Super-App
created: 2026-07-21
updated: 2026-07-21
---

# PRD: Synapse — Adamas Campus Super-App
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the PM/architecture/agent teams building Synapse, a cross-platform app replicating and extending the Adamas UMS (hostel portal) into a campus super-app. It groups the 13 source features from `plan.md` into capabilities with globally-numbered FRs. The architecture spine (`_bmad-output/planning-artifacts/rewrite-architecture-spine/ARCHITECTURE-SPINE.md`) governs tech decisions; the `openspec/changes/rewrite-architecture` specs are the executable contract. Inline `[ASSUMPTION]` tags flag inferences for review.

## 1. Vision

Synapse is the single mobile app every Adamas University student and faculty member opens for campus life: a UMS replica (dashboard, account, exams, qualifications, academics, hostel, transport, feedback, logout) plus a campus-aware layer — an LLM chatbot that answers anything about the campus, an AI-navigated map and bus system, notice push, local group spaces, a photobooth, club activity, and verified department-year chat rooms where students share faculty notes. It is the connective tissue of a 10-school, multi-department university, reachable from one cross-platform native app.

## 2. Target User

### 2.1 Jobs To Be Done
- **Functional:** check hostel/academics/exam status; get campus answers from the chatbot; receive notices; join dept-year note-sharing rooms; find rooms/buses on a map.
- **Social:** feel connected to their department cohort and the wider campus.
- **Contextual:** only verified members belong in a dept-year room; location is known only during college hours after punch-in.

### 2.2 Non-Users (v1)
- **Visitors / applicants** without an Adamas roll number (no adamas-DB record → no auth).
- **Other universities' students** — single-tenant to Adamas in v1.

### 2.3 Key User Journeys
- **UJ-1. A first-year CSE student verifies and lands in their room.** Riya installs the bare-RN app, logs in with her roll number + credential; the system matches her in the adamas DB, derives SOET/CSE/Year-1, and drops her into that dept-year chat plus the CSE group space. Realizes FR-7, FR-19.
- **UJ-2. A student asks the chatbot a campus question.** Arjun opens the chatbot, asks "when is the SOET exam form deadline?"; the LLM (OpenRouter/Bedrock) retrieves from the KB + live data and answers, offering to perform an action via the agent. Realizes FR-13, FR-15.
- **UJ-3. A notice reaches every student instantly.** The hostel office publishes a water-supply emergency; it pushes over Redis pub/sub → websocket to all clients. Realizes FR-16, FR-17.
- **UJ-4. A student shares a faculty note.** Mei uploads a PDF to her dept-year room; it persists in Postgres and fans out live to room members. Realizes FR-20.

## 3. Glossary
- **Adamas DB** — the Postgres system of record holding students, schools, departments, years, notices, clubs, messages, group spaces.
- **School** — one of 10 top-level academic units (e.g. SOET). Adamas has exactly 10.
- **Department** — a unit under a School (e.g. CSE under SOET); multiple per school.
- **Year** — academic year 1–4 a student is in.
- **Dept-Year Room** — a verified-only chat room for one Department × one Year.
- **Group Space** — an open local-information discussion space for verified users.
- **Verification** — a successful adamas-DB match on login; gates dept-year room admission.
- **Punch-In/Out** — future location feature; user becomes locatable only between punch-in and punch-out during college hours.
- **Agent** — the controllable LLM-driven assistant that invokes backend modules to act, not just answer.

## 4. Features

### 4.1 UMS Replica
**Description:** A mobile replica of the Adamas hostel/UMS portal with Dashboard, My Account, Exams, Previous Qualifications, Academics, Hostel, Transport, Feedback, and Logout sections. Data served from the integration layer over the adamas DB. `[ASSUMPTION: exact UMS field list is taken from the live portal at https://adamasknowledgecity.ac.in/student/hostel; we mirror structure, not pixel layout.]`

**Functional Requirements:**
#### FR-1: Dashboard
A verified user can view a personalized dashboard aggregating their academics, hostel, transport, and notice summaries. Realizes UJ-1.
- **Consequences:** Dashboard renders after auth with no external service call (data from adamas DB).

#### FR-2: Account & Qualifications
A user can view and edit My Account and view Previous Qualifications and Exams records.
- **Consequences:** Reads/writes go through the data-integration layer only.

#### FR-3: Academics, Hostel, Transport, Feedback
A user can access Academics, Hostel, Transport, and submit Feedback. Realizes UJ-2.
- **Consequences:** Each section returns structured data from the integration layer; Feedback persists to Postgres.

#### FR-4: Logout
A user can log out, invalidating their Redis session.
- **Consequences:** Logout deletes the session key; subsequent protected calls return 401.

### 4.2 Identity & Auth
**Description:** Login validates roll number + credential against the adamas DB; on match the user's School/Department/Year is known and used to verify them into the correct dept-year room. No manual approval in v1.

**Functional Requirements:**
#### FR-5: Login against adamas DB
A user can log in with roll number + credential; the system validates against Postgres and returns a Redis session. Realizes UJ-1.
- **Consequences:** Unknown roll number → auth error; valid login → session stored in Redis.

#### FR-6: Session guard
The system requires a valid Redis session for all protected routes and websocket connections.
- **Consequences:** Request without session → 401/unauthorized socket close.

#### FR-7: Verification gates dept-year room
The system admits a verified user only into the room for their School/Department/Year. Realizes UJ-1, UJ-4.
- **Consequences:** User cannot join a room of a different department or year.

### 4.3 Campus Chatbot + Agent
**Description:** An LLM chatbot answers anything about the Adamas campus, backed by a local knowledge base and live data. A controllable agent can perform actions by invoking backend modules. Provider abstraction supports OpenRouter and Amazon Bedrock.

**Functional Requirements:**
#### FR-8: LLM provider abstraction
The system answers chatbot queries through one interface with OpenRouter and Bedrock backends, switchable at runtime. Realizes UJ-2.
- **Consequences:** If the active provider is unavailable, the system falls back to the other.

#### FR-9: Retrieval over local KB
The chatbot answers campus queries using retrieval over a local knowledge base. Realizes UJ-2.
- **Consequences:** A KB-covered question returns a sourced answer, not "unavailable".

#### FR-10: Controllable agent
The chatbot can drive an agent that calls backend modules via API/RabbitMQ to perform actions. Realizes UJ-2.
- **Consequences:** An actionable request (e.g. "post this to my group") invokes the module and reports result.

### 4.4 AI Navigation (Map)
**Description:** An in-app map with AI navigation assistance. `[ASSUMPTION: deferred to a later change per spine AD-10; captured here for completeness.]`
**Out of Scope (v1):** See §6.2.

### 4.5 Notices
**Description:** Authorized publishers post notices; they push to clients in real time via Redis pub/sub → websocket.

**Functional Requirements:**
#### FR-11: Publish notice
An authorized user can publish a notice persisted in Postgres. Realizes UJ-3.
- **Consequences:** Published notice is stored and available for push.

#### FR-12: Push notice realtime
The system pushes new notices to subscribed clients over websocket via Redis pub/sub. Realizes UJ-3.
- **Consequences:** Subscribed client receives notice without polling.

#### FR-13: Emergency broadcast
The system pushes emergency-flagged notices to all clients regardless of subscription. Realizes UJ-3.
- **Consequences:** Emergency notice reaches every connected client.

### 4.6 Group Spaces
**Description:** Local-information discussion spaces for verified users, realtime over websocket + Redis, history in Postgres.

**Functional Requirements:**
#### FR-14: Create/join group space
A verified user can create or join a group space and post/read within it. Realizes UJ-1.
- **Consequences:** Member can post; non-member cannot read.

#### FR-15: Group messages realtime
Group messages deliver live via websocket + Redis pub/sub and persist in Postgres. Realizes UJ-1.
- **Consequences:** Posted message reaches members live and is stored.

### 4.7 Photobooth
**Description:** In-app photo capture/share. `[ASSUMPTION: deferred per AD-10.]`
**Out of Scope (v1):** See §6.2.

### 4.8 Clubs
**Description:** A user can join clubs anytime and view club activity.

**Functional Requirements:**
#### FR-16: Join club
A verified user can join a club and view its activity feed. Realizes UJ-1.
- **Consequences:** Joined club appears in user's club list with activity.

### 4.9 Dept-Year Chat
**Description:** Verified-only chat rooms for every School × Department × Year combination; realtime via websocket + Redis, history in Postgres. Note-sharing (faculty notes upload) lives here.

**Functional Requirements:**
#### FR-17: Room per combo
The system provides exactly one room per School × Department × Year. Realizes UJ-4.
- **Consequences:** Enumerating rooms yields 10 schools × departments × 4 years, one each.

#### FR-18: Verified-only admission
Unverified or wrong-department/year users are rejected from a dept-year room. Realizes UJ-4.
- **Consequences:** Join attempt by non-matching user → rejected.

#### FR-19: Note sharing
A room member can upload faculty notes (document) to the room. Realizes UJ-4.
- **Consequences:** Upload persists in Postgres and fans out live to members.

#### FR-20: Realtime room messages
Dept-year messages deliver live via websocket + Redis and persist in Postgres. Realizes UJ-4.
- **Consequences:** Sent message reaches members live and is stored.

### 4.10 Bus Navigation
**Description:** AI-assisted bus navigation. `[ASSUMPTION: deferred per AD-10.]`
**Out of Scope (v1):** See §6.2.

### 4.11 Location System (Punch-In/Out)
**Description:** User becomes locatable only between punch-in and punch-out during college hours; helps find faculty. `[ASSUMPTION: deferred per AD-10.]`
**Out of Scope (v1):** See §6.2.

### 4.12 Integration Layer
**Description:** A single internal data/integration layer reads/writes the adamas DB; no external microservices.

**Functional Requirements:**
#### FR-21: Internal data modules
The system serves campus data (hostel/transport/academics/notices/clubs) from internal Postgres modules, not external localhost services. Realizes UJ-2.
- **Consequences:** Chatbot/UI data request returns from Postgres.

#### FR-22: Seed from adamas DB
The system provides migrations + seed populating schools/departments/years/baseline data. Realizes UJ-1.
- **Consequences:** Fresh DB has queryable schools/departments/years.

## 5. Non-Goals (Explicit)
- Not a multi-tenant platform for other universities in v1.
- Not building the external microservices assumed by the old plan (`localhost:3001-3005`) — internal modules instead.
- Not introducing manual chat verification approval in v1 (DB match suffices).

## 6. MVP Scope

### 6.1 In Scope
- UMS replica (FR-1..4), Identity/Auth (FR-5..7), Chatbot+Agent (FR-8..10), Notices (FR-11..13), Group Spaces (FR-14..15), Clubs (FR-16), Dept-Year Chat (FR-17..20), Integration Layer (FR-21..22).
- Stack: bare RN, Gleam/BEAM, Rust NIFs, Postgres/Redis/RabbitMQ, OpenRouter/Bedrock.

### 6.2 Out of Scope for MVP
- AI Map Navigation (FR-4.4) — `NON-GOAL for MVP`, needs geospatial + rendering work.
- Photobooth (FR-4.7) — needs Rust image NIF + storage.
- Bus Navigation (FR-4.10) — depends on map nav + live transit.
- Location Punch-In/Out (FR-4.11) — needs realtime geo + presence.
- Kafka — no replay/event-log need in v1.
- `[NOTE FOR PM]` Map/photobooth/bus/location are emotionally load-bearing; revisit for v2 if timeline allows.

## 7. Success Metrics
**Primary**
- **SM-1**: % of logins that reach the correct dept-year room without error — target >95%. Validates FR-5, FR-7.
- **SM-2**: Chatbot answer rate on campus queries (non-"unavailable") — target >90%. Validates FR-8, FR-9.
**Secondary**
- **SM-3**: Notice delivery latency (publish → client) — target <2s. Validates FR-12.
**Counter-metrics (do not optimize)**
- **SM-C1**: Number of features shipped — do not trade core reliability (SM-1) for breadth.

## 8. Open Questions
1. Which roles may publish notices / are all faculty authorized? (affects FR-11 authz)
2. Managed vs self-hosted Redis/Postgres/RabbitMQ?
3. Is a human admin approval needed for dept-year rooms, or is DB match enough? (spine AD-7 says DB match; confirm)
4. Chatbot content moderation / guardrails policy?

## 9. Assumptions Index
- Inline assumption from §4.1 — UMS field list mirrors the live Adamas portal structure.
- Inline assumption from §4.4/4.7/4.10/4.11 — these four features deferred to later changes per spine AD-10.
- Inline assumption from §4.12 — internal modules replace the old external microservices.
