# Cloudflare Workers Gateway for Synapse

## Overview

This repository contains the Cloudflare Workers setup for deploying the Synapse campus assistant backend and frontend. The Workers act as an API gateway, routing requests between Cloudflare and the Gleam backend.

## Architecture

```
Cloudflare Edge
└── Workers Gateway
    ├── Reverse Proxy to Gleam Backend
    ├── Session Management
    ├── Rate Limiting
    └── Health Checks

Gleam Backend (AWS/Other)
└── API Endpoints (/login, /me, /messages, /chat, /health)

React Native Frontend
└── Web Build (/web/dist)
```

## Environment

### Backend (Gleam)
- **Runtime**: Gleam/Erlang
- **Host**: AWS Elastic Beanstalk, Railway, DigitalOcean Droplets, or any hosting platform
- **Port**: 8000 (default)
- **Database**: PostgreSQL
- **Session Cache**: Redis

### Frontend (React Native)
- **Build**: `react-native-web`
- **Output**: `./apps/mobile/web/dist`
- **Deployment**: Cloudflare Pages or served statically via Workers

## Configuration

### wrangler.toml

The `wrangler.toml` file configures the Cloudflare Worker gateway:

```toml
name = "synapse-gateway"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Environment configuration
[env.staging]
vars = { ENVIRONMENT = "staging" }

[env.production]
vars = { ENVIRONMENT = "production" }

# Route configuration
routes = [
  "synapse.adamas.edu/*",
]

[vars]
ENVIRONMENT = "production"

# KV Configuration for session storage
[kv]
binding = "SESSION_KV"

[limits]
running_time = 30
```

### Environment Variables

The Worker requires the following environment variables:

```bash
# Backend configuration
BACKEND_URL=https://your-gleam-backend.com

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/synapse

# Cloudflare KV binding token (for session storage)
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

These should be set via:

```bash
wrangler secret put BACKEND_URL
wrangler secret put OPENROUTER_API_KEY
wrangler secret put REDIS_URL
wrangler secret put DATABASE_URL
wrangler kv put SESSION_KV --file=session-data.json
```

## API Routes

The Cloudflare Workers gateway exposes the following routes:

### Root Path (`/`)
Returns a simple health check and API information:

```json
{
  "name": "Synapse API Gateway",
  "version": "1.0.0",
  "description": "API Gateway for Synapse Gleam backend",
  "endpoints": {
    "health": "/health",
    "backend_health": "/health/deps",
    "user_login": "POST /login",
    "session": "GET /me",
    "messages": {
      "post": "POST /messages",
      "list": "GET /messages"
    },
    "chatbot": "POST /chat",
    "schools": "GET /schools"
  },
  "environment": "production",
  "backend_url": "https://your-gleam-backend.com"
}
```

### Backend Health (`/health/deps`)
Proxies to the Gleam backend health endpoint:

```bash
curl -X GET https://synapse.adamas.edu/health/deps
```

### Standard Routes
All `/api/*` routes are proxied directly to the Gleam backend:

```bash
# Login
curl -X POST https://synapse.adamas.edu/api/login \
  -H "Content-Type: application/json" \
  -d '{"roll_number":"SOET/CSE/2024/001","credential":"test123"}'

# Protected endpoint with session
BEARER_TOKEN="synapse_session=abc123"
curl -X GET https://synapse.adamas.edu/api/me \
  -H "Cookie: $BEARER_TOKEN"

# Send a message to dept-year room
curl -X POST https://synapse.adamas.edu/api/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: $BEARER_TOKEN" \
  -d '{"body":"Hello dept-year room!"}'

# List messages from user's dept-year room
curl -X GET https://synapse.adamas.edu/api/messages \
  -H "Cookie: $BEARER_TOKEN"

# Chat with LLM (with KB context)
curl -X POST https://synapse.adamas.edu/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: $BEARER_TOKEN" \
  -d '{"message":"What is the campus wifi password?"}'
```

## Deployment

### Quick Setup

1. **Install Wrangler** (Cloudflare CLI):
   ```bash
   npm install -g wrangler
   wrangler init --yes
   ```

2. **Configure Environment Variables**:
   ```bash
   wrangler secret put BACKEND_URL
   wrangler secret put OPENROUTER_API_KEY
   wrangler secret put REDIS_URL
   wrangler secret put DATABASE_URL
   wrangler kv put SESSION_KV --file=session-data.json
   ```

3. **Deploy Worker**:
   ```bash
   wrangler deploy
   ```

### Production Deployment

For production deployment, it's recommended to:

1. **Use Cloudflare Pages for Frontend**:
   ```bash
   wrangler pages publish ./apps/mobile/web/dist
   ```

2. **Set up CI/CD Pipeline**:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Cloudflare
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Build web
           run: |
             cd apps/mobile
             npm ci
             npm run build:web
         
         - name: Deploy to Cloudflare Pages
           uses: cloudflare/pages-action@v1
           with:
             apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
             projectName: synapse
             directory: apps/mobile/web/dist
         
         - name: Deploy Worker
           run: |
             cd /path/to/cloudflare-project
             wrangler deploy
             env:
               BACKEND_URL: ${{ secrets.BACKEND_URL }}
               OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
   ```

### Local Development

For local development, you can run the Cloudflare Workers locally:

```bash
# In one terminal
wrangler dev

# In another terminal
# Make API calls to localhost:8080
```

## Monitoring & Logging

The Cloudflare Workers gateway provides:

1. **Health Check Endpoint** (`/health/deps`) - Tests backend connectivity
2. **Request Logging** - All API calls are logged in Cloudflare Logs
3. **Error Handling** - Graceful error responses when backend is unavailable
4. **Rate Limiting** - Configured to prevent abuse

You can monitor the gateway via:
- Cloudflare Dashboard (Analytics)
- Log insights in Cloudflare Workers Logs
- Error tracking via Cloudflare Errors

## Security Considerations

1. **HTTPS Enforcement** - Cloudflare Workers automatically serve over HTTPS
2. **Rate Limiting** - Built-in protection against abuse
3. **CORS Headers** - Appropriate CORS headers set for API access
4. **Environment Separation** - Staging and production environments

## Technical Details

### Session Management

The Cloudflare Workers gateway handles session management:

1. Extracts session tokens from incoming requests
2. Forwards them to the Gleam backend
3. Can optionally store short-lived session data in Cloudflare KV for caching

### Error Handling

The gateway provides graceful error handling:

- **502 Bad Gateway** - Backend service unavailable
- **503 Service Unavailable** - Backend health check failed
- **Timeout** - Backend request timeouts
- **Network Errors** - Connection issues to backend

### CORS Support

All API responses include appropriate CORS headers:

```javascript
corsHeaders.set('Access-Control-Allow-Origin', '*');
corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

## Troubleshooting

### Common Issues

1. **Backend Not Reachable**:
   - Verify `BACKEND_URL` environment variable
   - Check backend health: `curl https://synapse.adamas.edu/health/deps`

2. **API Response Not Received**:
   - Verify all environment variables are set
   - Check Cloudflare Workers logs for error details

3. **CORS Issues in Frontend**:
   - The gateway automatically handles CORS
   - Frontend can make calls directly

### Local Testing

For local testing without deploying:

```bash
# Start Cloudflare Worker locally
wrangler dev

# Test API endpoints
npm install curl-cli

# Test the health endpoint
curl -X GET http://localhost:8080/health/deps

# Test a protected endpoint
curl -X GET http://localhost:8080/me \
  -H "Cookie: synapse_session=test_token"
```

## Future Enhancements

Potential future improvements:

1. **Load Balancing** - Distribute traffic across multiple backend instances
2. **Caching** - Cache frequently accessed responses
3. **Authentication** - Implement API key-based authentication
4. **Monitoring** - Enhanced health checks and metrics
5. **Logging** - More detailed API access logs

## Conclusion

The Cloudflare Workers gateway provides a robust, scalable solution for deploying the Synapse API. It:

- Acts as a secure reverse proxy to the Gleam backend
- Provides CORS support for frontend access
- Includes health checks and error handling
- Supports environment-specific configurations
- Offers monitoring and logging capabilities
- Enables easy deployment and scaling

This setup allows you to deploy the complete Synapse ecosystem with minimal infrastructure management, while maintaining the benefits of Cloudflare's CDN, security, and global network.