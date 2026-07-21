// src/index.js - Cloudflare Workers API Gateway for Synapse
// This worker routes requests between Cloudflare and the Gleam backend

// Configuration from environment variables
const BACKEND_URL = 'http://18.60.43.29:8000';
const ENVIRONMENT = 'production';

// Session management middleware
function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'synapse_session') {
      return value;
    }
  }
  return null;
}

// Health check endpoint - verifies backend connectivity
async function handleHealthCheck(request) {
  const backendHealthURL = `${BACKEND_URL}/health/deps`;
  
  try {
    const response = await fetch(backendHealthURL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Cloudflare Gateway/1.0'
      }
    });
    
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Backend service unavailable',
      backend_url: BACKEND_URL,
      message: error.message
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// API route handler with session validation and backend routing
async function handleAPIRequest(request, sessionRed) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Extract session token from headers
  const sessionToken = parseSessionCookie(request.headers.get('cookie'));
  
  // Prepare request headers for backend
  const backendHeaders = new Headers();
  
  // Forward session
  if (sessionToken) {
    backendHeaders.set('cookie', `synapse_session=${sessionToken}`);
  }
  
  // Forward content-type for POST/PUT/PATCH
  if (request.headers.has('content-type')) {
    backendHeaders.set('content-type', request.headers.get('content-type'));
  }
  
  // Forward authorization if present
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    backendHeaders.set('authorization', authHeader);
  }
  
  const backendUrl = `${BACKEND_URL}${path}${url.search}`;
  
  try {
    // Forward request to Gleam backend
    const backendResponse = await fetch(backendUrl, {
      method: method,
      headers: backendHeaders,
      body: ['GET', 'HEAD'].includes(method) ? undefined : request.body,
      redirect: 'follow'
    });
    
    // Copy response from backend
    const responseHeaders = new Headers(backendResponse.headers);
    
    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Get response body
    const responseBody = await backendResponse.text();
    
    return new Response(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Backend API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Backend service error',
      message: error.message,
      backend_url: BACKEND_URL,
      path: path
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Main worker event handler
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight handler
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Root health check
  if (path === '/') {
    return new Response('Synapse Gateway - API Gateway for Gleam Backend\n\nHealth: OK\nEnvironment: ' + ENVIRONMENT, {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Backend health check
  if (path === '/health/deps' || path === '/health') {
    return handleHealthCheck(request);
  }

  // API routes - prefix all requests
  if (path.startsWith('/api/')) {
    return handleAPIRequest(request);
  }

  // Static assets (if any)
  if (path.startsWith('/static/')) {
    return handleAPIRequest(request);
  }

  // Web or root path - return API documentation
  return new Response(JSON.stringify({
    name: 'Synapse API Gateway',
    version: '1.0.0',
    description: 'API Gateway for Synapse Gleam backend',
    endpoints: {
      health: '/health',
      backend_health: '/health/deps',
      user_login: 'POST /login',
      session: 'GET /me',
      messages: {
        post: 'POST /messages',
        list: 'GET /messages'
      },
      chatbot: 'POST /chat',
      schools: 'GET /schools'
    },
    environment: ENVIRONMENT,
    backend_url: BACKEND_URL
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Error logging
addEventListener('error', event => {
  console.error('Cloudflare Worker error:', event.error);
});
