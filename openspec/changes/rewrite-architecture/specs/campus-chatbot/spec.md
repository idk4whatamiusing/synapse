## ADDED Requirements

### Requirement: LLM provider abstraction
The system SHALL support both OpenRouter and Amazon Bedrock behind one provider interface, selected at runtime by configuration/credential, so the chatbot can fall back between providers.

#### Scenario: Provider selected
- **WHEN** the chatbot handles a query
- **THEN** it uses the configured provider (OpenRouter or Bedrock) and can switch if the active provider is unavailable

### Requirement: Retrieval over local knowledge base
The system SHALL answer campus queries using retrieval over a local knowledge base, returning sourced answers rather than always "unavailable".

#### Scenario: Campus query
- **WHEN** a user asks a campus question covered by the knowledge base
- **THEN** the chatbot returns an answer derived from the KB (and live data via the integration layer where relevant)

### Requirement: Controllable agent invokes backend modules
The chatbot SHALL be able to drive a controllable agent that performs actions by calling backend modules via API or RabbitMQ tasks.

#### Scenario: Agent action
- **WHEN** the user requests an action the agent can perform (e.g. fetch notices, post to a group)
- **THEN** the agent invokes the corresponding backend module and reports the result

### Requirement: Supersedes prior chatbot fallback
The system SHALL replace the prior `make-chatbot-functional` local-data fallback, which is obsolete once the real backend and data layer exist.

#### Scenario: Old fallback retired
- **WHEN** this capability is implemented
- **THEN** the `make-chatbot-functional` change is retired and its requirements removed
