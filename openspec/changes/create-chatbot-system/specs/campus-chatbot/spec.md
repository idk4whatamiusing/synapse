## ADDED Requirements

### Requirement: Campus chatbot can answer general campus information queries
The system MUST allow users to ask general questions about Adamas campus and receive accurate, comprehensive answers covering all campus domains.

#### Scenario: General campus information query
- **WHEN** user asks "What are the hostels available?" or "How do I get to the library?"
- **THEN** system provides a concise answer with location, contact info, and available facilities

#### Scenario: Campus facilities query
- **WHEN** user asks "What clubs are available?" or "Which departments exist in SOET?"
- **THEN** system lists relevant clubs/departments with brief descriptions and contact information

#### Scenario: Multiple campus domains query
- **WHEN** user asks "What are the notice board items and hostel facilities available?"
- **THEN** system provides consolidated information from all requested campus domains

### Requirement: Campus chatbot can answer hostel-specific information
The system MUST provide comprehensive hostel information including availability, capacity, facilities, location, and contact details.

#### Scenario: Hostel search query
- **WHEN** user asks "Are there single rooms in Hostel A?" or "What's the capacity of Hostel B?"
- **THEN** system returns specific hostel details with availability status and key features

#### Scenario: Hostel contact query
- **WHEN** user asks "How do I apply for hostel accommodation?"
- **THEN** system provides application process, requirements, and contact information

### Requirement: Campus chatbot can answer transport and navigation queries
The system MUST provide real-time transport information and basic navigation assistance for the campus.

#### Scenario: Route query
- **WHEN** user asks "How do I get from Hostel A to SOET campus?"
- **THEN** system provides clear route information with landmarks and transportation options

#### Scenario: Schedule query
- **WHEN** user asks "What are the bus departure times from the main gate?"
- **THEN** system provides current schedule and frequency information

### Requirement: Campus chatbot can answer academic and departmental queries
The system MUST provide information about departments, schools, faculty contact, and academic programs.

#### Scenario: Department information query
- **WHEN** user asks "Which departments are under SOET School of Engineering and Technology?"
- **THEN** system lists all departments with brief descriptions and faculty contact

#### Scenario: Faculty contact query
- **WHEN** user asks "Who is the head of the CSE department?"
- **THEN** system provides faculty name, title, and contact information

### Requirement: Campus chatbot can answer club and extracurricular activity queries
The system MUST provide information about campus clubs, their activities, membership requirements, and schedules.

#### Scenario: Club information query
- **WHEN** user asks "What clubs are available for computer science students?"
- **THEN** system lists relevant clubs with descriptions, meeting schedules, and membership requirements

#### Scenario: Event schedule query
- **WHEN** user asks "When is the coding competition club meeting this week?"
- **THEN** system provides event details including date, time, location, and activity description

### Requirement: Campus chatbot can answer notice and announcement queries
The system MUST provide access to campus notices, announcements, and important alerts.

#### Scenario: Notice board query
- **WHEN** user asks "What are the latest campus notices?"
- **THEN** system displays recent notices organized by category (academic, events, maintenance, etc.)

#### Scenario: Emergency notice query
- **WHEN** user asks "Are there any campus closures or emergencies?"
- **THEN** system provides urgent notices with safety instructions and alternative arrangements

### Requirement: Campus chatbot has multi-language support
The system MUST support responses in multiple languages to accommodate diverse campus users.

#### Scenario: Multi-language query
- **WHEN** user asks a question in a language other than English
- **THEN** system recognizes the language and responds in the same language

#### Scenario: Language preference query
- **WHEN** user asks "Can you speak Hindi?" or "Do you support regional languages?"
- **THEN** system confirms language capabilities and responds accordingly

### Requirement: Campus chatbot maintains conversation context
The system MUST remember context from previous messages within the same conversation for better user experience.

#### Scenario: Context-aware query
- **WHEN** user asks "Which hostel did you just mention?" referring to a previous message
- **THEN** system references the previous context and provides relevant follow-up information

#### Scenario: Clarification query
- **WHEN** user asks "You said there are three hostels. Can you list them?"
- **THEN** system references the earlier mention and provides the list of hostels previously discussed

### Requirement: Campus chatbot has fallback mechanism for unknown queries
The system MUST handle queries outside its domain gracefully and provide appropriate guidance to users.

#### Scenario: Out-of-domain query
- **WHEN** user asks "How do I file a tax return?"
- **THEN** system responds "I can only help with Adamas campus information. For tax returns, please contact the accounts department"

#### Scenario: Ambiguous query
- **WHEN** user asks "What's available at the campus?"
- **THEN** system asks "What campus feature would you like to know about? I can help you find information about hostels, transport, notices, clubs, departments, or facilities"

### Requirement: Campus chatbot integrates with existing campus systems
The system MUST provide accurate, real-time information by integrating with existing campus databases and systems.

#### Scenario: Real-time integration
- **WHEN** user asks "Is Hostel A still available for new applications?"
- **THEN** system checks real-time hostel availability from the hostel management system

#### Scenario: System connectivity
- **WHEN** user asks "What are today's notices?"
- **THEN** system retrieves current notices from the campus notice board database

### Requirement: Campus chatbot has user authentication and session management
The system MUST support user authentication and maintain conversation sessions for personalized experience.

#### Scenario: User login
- **WHEN** user logs in with their campus credentials
- **THEN** system recognizes the user and personalizes responses based on their role (student, faculty, visitor)

#### Scenario: Session continuation
- **WHEN** user returns after a session break
- **THEN** system recognizes the previous conversation context and continues the dialogue

### Requirement: Campus chatbot has analytics and usage tracking
The system MUST track usage patterns, popular queries, and user satisfaction for continuous improvement.

#### Scenario: Query analytics
- **WHEN** user asks "What are the most common questions asked?"
- **THEN** system provides analytics on top queries and user engagement patterns

#### Scenario: Feedback collection
- **WHEN** user rates a response as helpful or not helpful
- **THEN** system records the feedback for model improvement and user experience enhancement