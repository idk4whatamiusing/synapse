## Context

The `campus-chatbot` change built the full pipeline (NLP → intent → retrieval → KB templates → integration fetch → response). But the integration fetch step calls `config.campusApis.*` URLs that point at `localhost:3001-3005` microservices which are not running. Every call throws, the `catch` returns `{ error: '...unavailable' }`, and the user sees no real answer.

The knowledge base (`src/services/knowledgeBase.js`) already holds structured campus data. The integrations should reuse a single seed module as a fallback so the system is functional standalone.

## Goals / Non-Goals

**Goals:**
- Integrations return real, filtered campus data when remote is unreachable.
- Single seed source (`data/campusSeed.js`) shared by all five integrations.
- Config-flagged (`USE_LOCAL_DATA`) so production can disable it.
- Unit-testable without network.

**Non-Goals:**
- Building the real microservices (separate effort).
- Replacing the remote path; it stays primary when available.

## Decisions

### 1. Fallback strategy
Each integration method: try remote `axios` call; on error (or `useLocalData` true) return filtered seed data shaped like the remote response. No new dependency — plain JS filter.

### 2. Seed location
`data/campusSeed.js` exports `{ hostels, transport, academics, notices, clubs }`. Integrations `require` it directly. Single source of truth; real services supersede later.

### 3. Config
`config.campusApis.useLocalData` (env `USE_LOCAL_DATA`, default `false` but auto-engaged on network failure). README documents setting it `true` for local dev/demo.

## Risks / Trade-offs

**Stale data → wrong answers** — seed is static. Mitigation: clearly documented as offline fallback; remote path is source of truth when live.

**Shape drift** — seed must match remote response shape. Mitigation: keep seed minimal and aligned with gateway route contracts already defined in `backend/gateway.js`.
