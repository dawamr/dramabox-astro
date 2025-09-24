import type { APIRoute } from 'astro';
import axios from 'axios';
import { getHeaders } from '../../../api/dramaboxHelper.ts';

// Disable prerendering for dynamic API routes
export const prerender = false;

const handleRequest: APIRoute = async ({ params, request }) => {
  try {
    // Get the path from the URL params - handle both string and array
    const pathParam = params.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
    
    // Construct the target URL
    const targetUrl = `https://sapi.dramaboxdb.com/${path}`;
    
    console.log(`Proxying ${request.method} ${targetUrl}`);
    
    // Get the request body if it exists
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          body = await request.json();
        } catch (e) {
          console.error('Failed to parse JSON body:', e);
        }
      } else {
        try {
          body = await request.text();
        } catch (e) {
          console.error('Failed to parse text body:', e);
        }
      }
    }
    
    // Get headers from the original request
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Skip certain headers that might cause issues
      const skipHeaders = ['host', 'origin', 'referer', 'content-length', 'transfer-encoding'];
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    // Generate proper authentication headers server-side
    const authHeaders = await getHeaders();
    
    // Merge authentication headers with request headers (auth headers take precedence)
    const finalHeaders = { ...headers, ...authHeaders };
    
    console.log('Request body:', body);
    console.log('Final headers:', finalHeaders);
    
    // Make the proxied request
    const response = await axios({
      method: request.method as any,
      url: targetUrl,
      data: body,
      headers: finalHeaders,
      timeout: 30000,
      validateStatus: () => true, // Accept any status code
    });
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    return new Response(JSON.stringify(response.data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
    
  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    }
    
    // Special handling for authentication errors
    if (error.response?.data?.status === 12) {
      console.error('Authentication failed - possible token/header issue');
    }
    
    return new Response(JSON.stringify({ 
      error: 'Proxy request failed',
      message: error.message,
      details: error.response?.data || null,
      statusCode: error.response?.status
    }), {
      status: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// Export specific HTTP methods
export const GET: APIRoute = handleRequest;
export const POST: APIRoute = handleRequest;
export const PUT: APIRoute = handleRequest;
export const DELETE: APIRoute = handleRequest;

// Handle preflight OPTIONS requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
};