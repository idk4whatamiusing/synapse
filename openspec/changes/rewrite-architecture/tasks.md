# Rewrite Architecture - Implementation Tasks

## 1. Infrastructure & Scaffold

- [ ] 1.1 Stand up Postgres, Redis, RabbitMQ (dev docker-compose or managed)
- [ ] 1.2 Scaffold Gleam/BEAM backend app (HTTP + websocket listener)
- [ ] 1.3 Scaffold Rust NIF crate alongside the Gleam app
- [ ] 1.4 Scaffold bare React Native app (iOS + Android, no Expo)

## 2. Data & Integration Layer

- [ ] 2.1 Design Postgres schema: students, schools, departments, years, notices, clubs, messages, group_spaces
- [ ] 2.2 Write migrations + seed path from adamas DB records
- [ ] 2.3 Implement internal data/integration modules reading Postgres (hostel/transport/academics/notices/clubs)

## 3. Identity & Auth

- [ ] 3.1 Implement login validating roll number + credential against adamas DB
- [ ] 3.2 Implement Redis session store + protected-endpoint/socket guards
- [ ] 3.3 Derive school/department/year and gate dept-year room admission

## 4. Realtime Transport

- [ ] 4.1 Implement websocket server on BEAM with Redis pub/sub fan-out
- [ ] 4.2 Implement RN websocket client + reconnect/session handling

## 5. Campus Chatbot & Agent

- [ ] 5.1 Implement LLM provider abstraction (OpenRouter + Bedrock backends)
- [ ] 5.2 Build local knowledge base + retrieval
- [ ] 5.3 Wire chatbot query pipeline (intent → retrieval → integration → response)
- [ ] 5.4 Implement controllable agent invoking backend modules via API/RabbitMQ
- [ ] 5.5 Retire `make-chatbot-functional` change

## 6. Notices

- [ ] 6.1 Implement authorized notice publish (Postgres)
- [ ] 6.2 Implement realtime push via Redis pub/sub → websocket (incl. emergency broadcast)

## 7. Dept-Year Chat

- [ ] 7.1 Generate rooms for 10 schools × departments × 4 years
- [ ] 7.2 Enforce verified-only admission per school/department/year
- [ ] 7.3 Persist message history in Postgres; deliver live via websocket

## 8. Group Spaces

- [ ] 8.1 Implement create/join group spaces for verified users
- [ ] 8.2 Persist + deliver group messages realtime (websocket + Redis)

## 9. Docs & Agent Lanes

- [ ] 9.1 Write `AGENTS.md` with BMad + GSD lane split (architect, PM/analyst, designer, frontend, Gleam backend, Rust NIF, data, llm/agent, qa)
- [ ] 9.2 Document deferred list + ponytail flags (no microservices/GraphQL/K8s, RabbitMQ deferred wiring, Issues=mirror only)

## Task Progress

- **Total Tasks**: 27
- **Completed**: 0
- **Pending**: 27
