# AGENTS.md

## Project Overview

**Project**: Adamas Campus Management System
**Goal**: Comprehensive campus platform with student services, campus navigation, communication tools, and AI assistants

## Required Agent Roles

### 1. Campus System Architect
- **Purpose**: Design overall system architecture for campus management platform
- **Responsibilities**:
  - Define data models for students, courses, hostels, transport
  - Design API structure for all services
  - Create authentication and authorization scheme
  - Plan AI integration architecture
  - Design database schema and relationships
  - Define scalability requirements for campus population

### 2. Backend Developer (Go/Python/Node.js)
- **Purpose**: Implement core services and APIs
- **Responsibilities**:
  - User management system (auth, profiles)
  - Hostel allocation system
  - Exam and academic records management
  - Transport tracking and bus navigation
  - Notice/notification system
  - API for mobile/web frontend
  - Integration layer services

### 3. Frontend Developer
- **Purpose**: Build user interfaces for students and staff
- **Responsibilities**:
  - Dashboard interface
  - Hostel, transport, exam sections
  - Chatbot UI integration
  - Map-based navigation system
  - Club and department interfaces
  - Photobooth application
  - User account management

### 4. AI/ML Engineer
- **Purpose**: Develop intelligent features and AI agents
- **Responsibilities**:
  - Chatbot development for campus information
  - AI navigation system (map integration)
  - Bus route optimization
  - Location-based services (arrival/departure tracking)
  - Department/year chat content moderation
  - AI assistant for student queries

### 5. DevOps Engineer
- **Purpose**: Deploy and maintain the campus system
- **Responsibilities**:
  - CI/CD pipelines
  - Infrastructure as Code
  - Monitoring and logging
  - Security and access control
  - Performance optimization
  - Backup and recovery procedures

### 6. Quality Assurance Engineer
- **Purpose**: Ensure system reliability and quality
- **Responsibilities**:
  - Test student workflows (hostel booking, exam access)
  - Test AI response accuracy
  - Performance testing for navigation
- Manual testing of club/chat systems
- Security testing for integration layer

### 7. Security Specialist
- **Purpose**: Protect campus data and systems
- **Responsibilities**:
  - Student data privacy protection
  - Secure authentication implementation
  - Authorization controls for sensitive areas
  - Data encryption for personal information
  - Integration layer security
  - API security

### 8. Technical Writer
- **Purpose**: Document the campus system
- **Responsibilities**:
  - API documentation
  - User guides for campus services
  - Technical implementation notes
  - Architecture diagrams
  - System operation manuals

### 9. Deployment Manager
- **Purpose**: Coordinate campus system rollout
- **Responsibilities**:
  - Phased implementation planning
  - User training and documentation
  - Support during deployment phases
  - Feedback collection from campus users
  - System optimization based on usage

## Development Workflow

### Sp integration
- Each feature requires OpenSpec specification before implementation
- Follow spec-driven development with proposal, design, and tasks phases
- Requirements from plan.md drive all development decisions

### Key Integration Points

1. **User System** → All other services ( hostels, transport, notices)
2. **AI Chatbot** → Multiple chat interfaces and help systems
3. **Navigation** → Map and transport systems
4. **Integration Layer** → Connect all microservices

## Technical Requirements (from plan.md)

1. **Core Services**: Dashboard, user account, exams, qualifications, academics, hostel, transport, feedback, logout
2. **AI Features**: Campus info chatbot, AI navigation, notice publishing via notifications
3. **Social Features**: Group spaces for campus info, photobooth, club joining
4. **Academic Features**: 10 schools, department/year chat sections with faculty note uploads
5. **Advanced Features**: AI agent controlled by chatbot, bus navigation, campus time tracking
6. **Security**: Faculty verification for chat section access