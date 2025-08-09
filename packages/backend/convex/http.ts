import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { streamChat } from './streaming';

const http = httpRouter();

// CORS handler for preflight requests
const corsHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
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
