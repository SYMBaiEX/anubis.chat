import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { streamChat } from './streaming';
import { auth } from './auth';

const http = httpRouter();

// Add Convex Auth HTTP routes (required for authentication)
auth.addHttpRoutes(http);

// CORS handler for preflight requests
const corsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
});

// Chat streaming endpoint with CORS support
http.route({
  path: '/stream-chat',
  method: 'OPTIONS',
  handler: corsHandler,
});

http.route({
  path: '/stream-chat',
  method: 'POST',
  handler: streamChat,
});

export default http;
