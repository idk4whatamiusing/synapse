# Adamas Campus Chatbot - README

## Project Overview
This is the Adamas Campus Chatbot - an AI-powered campus information assistant built with Express.js and natural language processing. The chatbot provides comprehensive answers about Adamas knowledge city, including hostels, transport, academic departments, clubs, and campus notices.

## Features

### Core Functionality
- **Natural Language Processing**: Intent detection for campus queries
- **Multi-domain Support**: Hostels, transport, academics, notices, clubs
- **Real-time Integration**: Connects to campus systems for up-to-date information
- **Session Management**: Maintains context across conversations
- **Multi-language Support**: English and regional language support

### Architecture
- **API-first design**: RESTful endpoints for campus systems
- **Caching layer**: 5-minute cache for improved performance
- **NLP processing**: Intent classification and pattern matching
- **Modular structure**: Separate concerns for maintainability

### Technology Stack
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **NLP**: Natural library for pattern matching
- **HTTP Client**: Axios for API integration
- **Environment**: Dotenv for configuration

## Project Structure

```
/src/
  ├── index.js                    # Main server file
  ├── middleware/                 # Request/response processing
  ├── services/                   # Business logic services
  ├── integrations/               # External API integrations
  └── utils/                      # Helper functions

/config/
  └── templates/                  # Response templates

/data/
  ├── cache/                      # Cache storage
  └── knowledge/                  # Campus knowledge base

/examples/
  └── requests/                   # Example API requests

/docs/                           # Documentation
README.md                       # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Environment variables (see .env.example)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adamas-campus-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   # Edit .env with your API endpoints and configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Test the API**
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Test chatbot
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What hostels are available?", "userId": "user123"}'
   ```

## API Documentation

### Health Check

**GET /health**
- Returns server status and timestamp

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-20T10:00:00.000Z"
}
```

### Chatbot Endpoint

**POST /chat**
- Handle natural language queries about campus information

**Request Body:**
```json
{
  "message": "string (required)",
  "userId": "string (required)"
}
```

**Response:**
```json
{
  "message": "string (bot response)",
  "timestamp": "string (ISO 8601)",
  "userId": "string (requesting user)"
}
```

### Supported Query Types

The chatbot can handle the following types of queries:

- **Hostel Questions**: "What hostels are available?" "Room types?"
- **Transport**: "How do I get to SOET?" "Bus schedules"
- **Academics**: "Which departments are under SOET?" "Professor contacts"
- **Notices**: "Are there any campus alerts?" "Notice board items"
- **Clubs**: "What computer science clubs are available?" "Club meetings"

## Development

### Scripts

- **start**: Start production server
  ```bash
  npm start
  ```

- **dev**: Start development server with auto-restart
  ```bash
  npm run dev
  ```

- **test**: Run tests
  ```bash
  npm test
  ```

- **lint**: Lint source code
  ```bash
  npm run lint
  ```

- **build**: Build for production
  ```bash
  npm run build
  ```

### Testing

The project uses Jest for testing. To run tests:

```bash
npm test
```

Test structure includes:
- Unit tests for core functionality
- Integration tests for external APIs
- Mock data for offline testing
- Error handling scenarios

### Deployment

The chatbot can be deployed using:

- **Docker**: Containerized deployment
- **Kubernetes**: Orchestrated deployment
- **Cloud Platforms**: AWS, Google Cloud, Azure
- **Server**: Traditional deployment

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOSTEL_API_URL`: Hostel service endpoint
- `TRANSPORT_API_URL`: Transport service endpoint
- `ACADEMICS_API_URL`: Academic departments endpoint
- `NOTICES_API_URL`: Notices service endpoint
- `CLUBS_API_URL`: Clubs service endpoint

### Cache Configuration

- **TTL**: 5 minutes (300,000 milliseconds)
- **Storage**: In-memory Map
- **Key format**: `${userId}:${message}`

## Monitoring and Logging

The chatbot includes:

- **Health endpoints**: Server status monitoring
- **Error handling**: Graceful error responses
- **Logging**: Request/response logging
- **Metrics**: Performance tracking

## Integration with Campus Systems

### API Endpoints

The chatbot integrates with various campus systems:

1. **Hostel System** (`http://localhost:3001`)
   - Hostel availability
   - Room types and pricing
   - Application processes

2. **Transport System** (`http://localhost:3002`)
   - Bus routes and schedules
   - Arrival/departure times
   - Route optimization

3. **Academic System** (`http://localhost:3003`)
   - Department information
   - Faculty contacts
   - Program details

4. **Notice System** (`http://localhost:3004`)
   - Campus announcements
   - Emergency alerts
   - Event notices

5. **Clubs System** (`http://localhost:3005`)
   - Club directory
   - Meeting schedules
   - Membership information

### API Response Format

Each campus system returns standardized JSON responses:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "timestamp": "ISO 8601"
}
```

## Security Considerations

### Authorization

- **Basic**: API key authentication for external services
- **Input validation**: Sanitize all user inputs
- **Rate limiting**: Prevent abuse with rate limits

### Data Protection

- **No sensitive data**: Only public campus information
- **Secure storage**: Environment variables for secrets
- **Audit logging**: Track all API interactions

## Troubleshooting

### Common Issues

**Cannot connect to campus APIs**
- Check if API services are running
- Verify environment variables
- Check network connectivity

**Chatbot returns generic responses**
- Check NLP patterns
- Verify intent classification
- Test with keywords

**Performance issues**
- Check cache configuration
- Monitor API response times
- Consider scaling options

### Debugging

**Enable verbose logging**
```bash
NODE_ENV=development npm start
```

**Check server health**
```bash
curl http://localhost:3000/health
```

**Test API connectivity**
```bash
curl http://localhost:3000/chat -X POST -H "Content-Type: application/json" -d '{"message":"test","userId":"test"}'
```

## Contributing

### Code Standards

- **Code style**: Use consistent indentation and formatting
- **Comments**: Document complex logic
- **Error handling**: Graceful error responses
- **Testing**: Comprehensive test coverage

### Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests
   - Document changes

3. **Submit your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a pull request**
   - Fill out the PR template
   - Request reviews
   - Address feedback

## License

MIT License - see LICENSE.md for details.

## Support

### Getting Help

- **Documentation**: This README.md
- **Issues**: GitHub repository issues
- **Community**: Adamas campus community channels

### Project Roadmap

**Phase 1: Core Development** ✅
- Basic chatbot functionality
- API integration
- Testing setup

**Phase 2: Advanced Features**
- Natural language understanding
- Multi-language support
- Machine learning integration

**Phase 3: Production**
- Performance optimization
- Security improvements
- Documentation updates

## Acknowledgments

This project was built as part of the Adamas Campus Management System, enabling students and visitors to access campus information through natural language interfaces.

## Contact

For questions or issues, please contact the Adamas Campus Technology Team.

---

*Built with ❤️ for Adamas Knowledge City* 🕌
