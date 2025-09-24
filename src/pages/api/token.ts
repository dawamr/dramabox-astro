import type { APIRoute } from 'astro';
import axios from 'axios';

// Disable prerendering for this API route
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Fetch token from the external API server-side (no CORS issues)
    const response = await axios.get('https://dramabox-api.vercel.app/api/token');
    
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Add CORS headers to allow your frontend to access this endpoint
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Error fetching token:', error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch token',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};