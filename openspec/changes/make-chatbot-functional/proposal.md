## Why

The chatbot is scaffolded but currently returns "service temporarily unavailable" for every campus query, because all five integration modules (hostel, transport, academics, notices, clubs) only call external microservices at `localhost:3001-3005` that do not exist. The knowledge base exists (`src/services/knowledgeBase.js`) but the API-integration path always fails, so end-to-end answers are never returned from live data. Users perceive the system as "not working."

We need the bot to return real campus data end-to-end without requiring the external microservices to be running. This is the difference between a scaffold and a working MVP.

## What Changes

Add a **local data fallback** to every campus integration so that when the remote API is unreachable (or `USE_LOCAL_DATA=true`), the integration serves structured campus data from a single seed module. The remote path remains intact for production. Additionally:

- Add a seed data module (`data/campusSeed.js`) as the offline source of truth (hostels, transport, academics, notices, clubs).
- Each integration falls back to filtered seed data on network error, returning the same shape the remote API would.
- Wire `config.campusApis.useLocalData` (env `USE_LOCAL_DATA`) to force local mode.
- Add a small set of unit tests asserting integrations return real data in local mode (no network).
- Update README + deployment runbook to document local mode.

This makes `POST /chat` with a hostel/transport/academics/notices/clubs query return actual answers from `data/campusSeed.js`, closing the "nothing works" gap.

## Capabilities

### New Capabilities
- `local-campus-data`: offline campus data source that backs all integrations when remote services are down

### Modified Capabilities
- `campus-chatbot`: integrations now return real data via fallback instead of always "unavailable"

## Impact

- No change to external API contracts; remote path preserved.
- Makes the MVP demonstrably functional without standing up 5 microservices.
- Low risk: additive fallback, guarded by config flag and try/catch.
- Enables the frontend (Next.js web + React Native) to show real responses in dev/demo.
