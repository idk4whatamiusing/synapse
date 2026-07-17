# Synapse — Project Plan

Adamas University Campus Portal — Web + Mobile application

## 1. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Web Frontend** | Next.js 14+ (TypeScript) | SSR, SEO, API routes, excellent DX |
| **Mobile** | React Native + Expo | Shares TS types/logic with web; OTA updates |
| **Backend** | NestJS (TypeScript) | Structured, scalable, built-in WebSockets |
| **Database** | PostgreSQL + Redis | Relational data + caching/sessions/pub-sub |
| **ORM** | Prisma | Type-safe, auto-generated client |
| **Real-time** | Socket.io | Chat, notifications, live location |
| **AI Chatbot** | OpenAI API + RAG pipeline | Campus docs => vector embeddings => context-aware answers |
| **Maps** | Custom-built campus map (Canvas/WebGL) | Built from scratch for Adamas campus |
| **Auth** | JWT + UMS SSO bridge | Integrates with existing university credentials |
| **Payments** | Razorpay | Indian market standard for university fee collection |
| **Notifications** | Firebase Cloud Messaging + Web Push | Cross-platform push notifications |
| **File Storage** | AWS S3 / Cloudflare R2 | Scalable uploads (notes, photos, certificates) |
| **Infra** | Docker + Docker Compose | Reproducible dev & deployment environments |

## 2. Architecture — Monorepo Structure

```
synapse/
├── packages/
│   ├── web/                 # Next.js web application
│   │   ├── app/             # App router pages
│   │   ├── components/      # Shared UI components
│   │   └── features/        # Feature-specific modules
│   ├── mobile/              # React Native (Expo) app
│   │   ├── app/             # Expo Router screens
│   │   ├── components/      # Shared UI components
│   │   └── features/        # Feature-specific modules
│   ├── server/              # NestJS API backend
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication & UMS bridge
│   │   │   ├── chat/        # Department/year chat rooms
│   │   │   ├── notice/      # Notice publishing
│   │   │   ├── location/    # Punch in/out & tracking
│   │   │   ├── transport/   # Bus routes & scheduling
│   │   │   ├── hostel/      # Hostel management
│   │   │   ├── academics/   # Exams, courses, attendance
│   │   │   ├── club/        # Club management
│   │   │   ├── photobooth/  # Photo capture & gallery
│   │   │   ├── feedback/    # Feedback forms
│   │   │   └── payment/     # Fee collection
│   │   ├── gateway/         # WebSocket gateway (Socket.io)
│   │   └── common/          # Guards, filters, interceptors
│   ├── ai/                  # AI service
│   │   ├── chatbot/         # RAG pipeline & chat logic
│   │   ├── agent/           # Tool-calling AI agent
│   │   └── embeddings/      # Vector embedding pipeline
│   └── shared/              # Shared TypeScript types, schemas, constants
├── docker/                  # Docker Compose & Dockerfiles
├── docs/                    # Documentation
├── package.json             # Root workspace config (npm workspaces)
├── turbo.json               # Turborepo build orchestration
└── tsconfig.base.json       # Shared TypeScript configuration
```

## 3. Database Schema — High-Level Entities

```
User (extends UMS auth)
├── Student (school, department, year, semester, section)
├── Faculty (school, department, subjects)
└── Admin (role: super-admin, school-admin, dept-admin)

School (10 schools)
└── Department (3–6 per school)
    └── ChatRoom (year-wise: 1st, 2nd, 3rd, 4th year)
        ├── Message (sender, text, file attachments, timestamp)
        ├── ChatMember (user, role, verified-at)
        └── Note (title, file-url, uploaded-by-faculty, subject, timestamp)

Notice (title, body, category, target-school/department, publish-date, attachment)

Club (name, description, logo, lead-id)
├── ClubMembership (user, club, join-date, role)
└── ClubActivity (post, image, event-details, created-at)

LocationRecord (user-id, timestamp, latitude, longitude, punch-type: IN/OUT)

BusRoute (name, description, active?)
├── BusStop (name, order-index, latitude, longitude)
├── BusSchedule (direction, departure-time, stops)
└── BusLiveLocation (bus-id, latitude, longitude, heading, timestamp)

PhotoboothPhoto (user-id, image-url, frame-style, timestamp, is-public)

Feedback (user-id, category, message, rating, submitted-at, status)
```

## 4. Features and Requirements

### 4.1 Web Portal Sections
- Dashboard — Overview, notifications, quick links, attendance/grade summary
- My Account — Profile management, password change, settings
- Exams — Schedule, hall tickets, results, grade cards
- Previous Qualifications — Upload/view past certificates
- Academics — Semester registration, enrolled courses, attendance, syllabus
- Hostel — Room details, allocation requests, complaints, fee status
- Transport — Bus routes, schedules, e-pass, fee payment
- Feedback — Submit feedback, view responses

### 4.2 Communication & Community
- **Department/Year Chat Rooms**
  - Hierarchy: 10 Schools → Multiple Departments → 4 Year-wise chat rooms each
  - Verified enrollment only (admin/faculty approves)
  - Faculty can upload notes (PDFs, images) per chat room
  - File sharing, search, pinned messages
- **Group Space** — Campus-wide discussion forum for local information
- **Notice Publishing** — Role-based publishing (admin/faculty), push notification delivery

### 4.3 AI Chatbot & Agent
- **Chatbot**: Answers questions about Adamas campus using RAG (Retrieval-Augmented Generation)
  - Knowledge base: official website, academic calendar, policies, FAQ, building info
  - Streaming responses, conversation history
- **AI Agent**: Controlled by the chatbot, can execute actions
  - Tool-calling: look up faculty location, send notices, book transport seats, find rooms
  - Agentic loop: LLM interprets intent → selects tool → executes → responds

### 4.4 Custom Campus Map & Navigation
- **Interactive Campus Map**: Custom-built using Canvas/WebGL
  - Buildings, departments, facilities, parking, bus stops
  - Click-to-see-info on any location
  - Indoor floor plans (future)
- **AI Navigation**: Pathfinding between locations on campus map
  - Turn-by-turn directions
  - Estimated walking time
- **Bus Navigation**: Live bus tracking overlay on campus map
  - Route visualization
  - Real-time bus positions
  - Stop ETA

### 4.5 Location Tracking
- Students punch in on arrival, punch out on departure (college hours only)
- Location auto-disconnects after punch-out
- Faculty location visibility — helps students/staff find faculty members on campus
- Privacy: location only active during college hours; opt-out for students

### 4.6 Photobooth
- Camera capture with campus-themed frames & filters
- Gallery of captured photos
- Share to chat, notice, or social media

### 4.7 Club System
- Browse all clubs (open enrollment, no time restriction)
- Join/leave clubs anytime
- Club activity feed: posts, upcoming events, photos
- Club-specific chat rooms

### 4.8 Integration Layer
- **UMS Integration**: SSO authentication bridge with existing university system
- **Payment Gateway** (Razorpay): Hostel fees, transport pass fees, event registrations
- **Email/SMS Service**: Notifications, verification, alerts

## 5. Phased Development

### Phase 1 — Foundation (Weeks 1–2)
- Initialize monorepo with Turborepo + npm workspaces
- Set up NestJS server with Prisma + PostgreSQL
- Set up Next.js web app (Tailwind CSS, dark mode)
- Set up React Native (Expo) mobile scaffold
- Implement UMS SSO integration (auth bridge)
- Design and create database migrations
- Basic CI/CD pipeline (lint, typecheck, test)
- Create shared TypeScript types package

### Phase 2 — Web Academic Portal (Weeks 3–5)
- Dashboard page
- My Account (profile, settings, password)
- Exams (schedule, results, hall tickets)
- Previous Qualifications (upload/view)
- Academics (semester, courses, attendance)
- Hostel (room, complaints, fees)
- Transport (routes, schedules, passes)
- Feedback system

### Phase 3 — Communication & Community (Weeks 6–8)
- Department/Year chat room system
- Admin verification flow for chat access
- Faculty note upload feature
- Group Space forum
- Notice publishing with push notifications
- File upload infrastructure

### Phase 4 — Mobile App (Weeks 8–10)
- UMS login on mobile
- Mobile dashboard
- Location tracking (punch in/out)
- Faculty locator
- Mobile versions of all academic features
- FCM push notification setup

### Phase 5 — AI & Navigation (Weeks 10–13)
- Campus knowledge base curation
- RAG pipeline (chunking → embeddings → vector DB)
- Chatbot UI (web + mobile)
- AI Agent with tool-calling
- Custom campus map renderer (Canvas/WebGL)
- Pathfinding & navigation on map
- Bus route visualization & live tracking

### Phase 6 — Extras & Polish (Weeks 13–15)
- Photobooth feature
- Club system (join, activities, chat)
- Razorpay payment integration
- Email/SMS integration
- UMS data sync bridge
- Performance optimization
- Testing & bug fixes
- Deployment & production launch

## 6. Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Monorepo | Turborepo | Shared code, parallel builds, unified versioning |
| Auth | JWT + UMS SSO | Stateless, scalable, integrates with existing system |
| Real-time | Socket.io | Mature, fallback support, cross-platform |
| Chat storage | PostgreSQL (via Prisma) | Single DB reduces complexity; messages are relational |
| AI | OpenAI API (not self-hosted) | Faster to ship, better quality, lower ops cost |
| Maps | Custom (Canvas/WebGL) | Full control, no API costs, campus-specific features |
| File storage | S3/R2 | Scalable, cheap, CDN-ready |
| Payments | Razorpay | Best for Indian universities, UPI support |
| Mobile | Expo | Faster development, OTA updates, no native build pain |

## 7. Open Questions for Implementation

1. **Custom Campus Map** — Do you have existing campus blueprints, building coordinates, or map images? What level of detail (building outlines only vs. indoor floor plans)?
2. **UMS Integration** — Is there an existing API for the UMS, or would we need to reverse-engineer the login flow? Any contact with the university IT team?
3. **Location Tracking** — Should students be able to opt out? Should faculty see who is searching for them?
4. **Chat Verification** — Who performs the approval: HOD, class teacher, or a dedicated admin? Manual approval or auto-approve based on enrollment data?
5. **AI Agent Actions** — What specific actions should the agent be able to perform initially? (e.g., find faculty, book transport, check exam schedule)
