/**
 * Cloudflare Worker Entry Point
 * Handles incoming HTTP requests and routes them appropriately
 */

// Environment variables and configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Main request handler
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Execution context
 * @returns {Response} - The response to send back
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      // Parse the request URL
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Log the request for debugging
      console.log(`${method} ${path}`);

      // Route handling
      if (path === '/') {
        return handleHome(request, env);
      } else if (path === '/health') {
        return handleHealth(request, env);
      } else if (path.startsWith('/api/')) {
        return handleAPI(request, env, path);
      } else if (path.startsWith('/static/')) {
        return handleStatic(request, env, path);
      } else {
        return handleNotFound(request, env);
      }

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
};

/**
 * Handle home page requests
 */
async function handleHome(request, env) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Waitlist Management System</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 600px;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          margin: 0 10px;
        }
        .button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .status {
          margin-top: 3rem;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎯 Waitlist Management</h1>
        <p>Your comprehensive queue management system is running on Cloudflare Workers</p>
        
        <div>
          <a href="/api/health" class="button">API Health Check</a>
          <a href="/api/status" class="button">System Status</a>
        </div>
        
        <div class="status">
          <h3>🚀 System Status</h3>
          <p>Worker is running successfully</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle health check requests
 */
async function handleHealth(request, env) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    worker: 'waitlist-management-worker',
    version: '1.0.0',
    uptime: Date.now(),
  };

  return new Response(JSON.stringify(health, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle API requests
 */
async function handleAPI(request, env, path) {
  const url = new URL(request.url);
  const method = request.method;

  // Remove /api prefix
  const apiPath = path.replace('/api', '');

  switch (apiPath) {
    case '/status':
      return handleAPIStatus(request, env);
    
    case '/queue':
      return handleQueueAPI(request, env, method);
    
    case '/locations':
      return handleLocationsAPI(request, env, method);
    
    case '/checkin':
      return handleCheckinAPI(request, env, method);
    
    default:
      return new Response(
        JSON.stringify({
          error: 'API endpoint not found',
          path: apiPath,
          available_endpoints: ['/status', '/queue', '/locations', '/checkin'],
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
  }
}

/**
 * Handle API status requests
 */
async function handleAPIStatus(request, env) {
  const status = {
    api: 'waitlist-management-api',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      queue: 'operational',
      locations: 'operational',
      checkin: 'operational',
    },
    performance: {
      response_time: '< 100ms',
      uptime: '99.9%',
    },
  };

  return new Response(JSON.stringify(status, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle queue API requests
 */
async function handleQueueAPI(request, env, method) {
  switch (method) {
    case 'GET':
      // Return mock queue data
      const queueData = {
        queue: [
          {
            id: '1',
            customerName: 'Alice Johnson',
            customerPhone: '+1234567890',
            position: 1,
            estimatedWaitTime: 15,
            status: 'waiting',
            joinedAt: new Date().toISOString(),
          },
          {
            id: '2',
            customerName: 'Bob Smith',
            customerPhone: '+1234567891',
            position: 2,
            estimatedWaitTime: 30,
            status: 'waiting',
            joinedAt: new Date().toISOString(),
          },
        ],
        stats: {
          totalWaiting: 2,
          averageWaitTime: 22,
          customersServedToday: 15,
        },
      };

      return new Response(JSON.stringify(queueData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });

    case 'POST':
      // Handle adding to queue
      const body = await request.json();
      const newEntry = {
        id: Date.now().toString(),
        ...body,
        position: 3,
        estimatedWaitTime: 45,
        status: 'waiting',
        joinedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify(newEntry, null, 2), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });

    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
  }
}

/**
 * Handle locations API requests
 */
async function handleLocationsAPI(request, env, method) {
  if (method === 'GET') {
    const locations = [
      {
        id: '1',
        name: 'Downtown Salon',
        address: '123 Main St, Downtown City, DC 12345',
        phone: '+1234567890',
        isActive: true,
        currentQueue: 2,
      },
      {
        id: '2',
        name: 'Uptown Branch',
        address: '456 Oak Ave, Uptown City, UC 67890',
        phone: '+1234567891',
        isActive: true,
        currentQueue: 1,
      },
    ];

    return new Response(JSON.stringify(locations, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    }
  );
}

/**
 * Handle checkin API requests
 */
async function handleCheckinAPI(request, env, method) {
  if (method === 'POST') {
    const body = await request.json();
    const checkinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const checkinResponse = {
      success: true,
      checkinCode,
      message: 'Successfully checked in',
      estimatedWaitTime: 25,
      position: 3,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(checkinResponse, null, 2), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    }
  );
}

/**
 * Handle static file requests
 */
async function handleStatic(request, env, path) {
  // In a real implementation, you would serve static files from KV storage or R2
  return new Response('Static file serving not implemented', {
    status: 501,
    headers: CORS_HEADERS,
  });
}

/**
 * Handle 404 not found requests
 */
async function handleNotFound(request, env) {
  const notFoundResponse = {
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: new URL(request.url).pathname,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(notFoundResponse, null, 2), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}