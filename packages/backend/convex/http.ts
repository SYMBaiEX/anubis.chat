import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { auth } from './auth';
import { verifyPaymentTransaction } from './paymentVerification';
import { streamChat } from './streaming';

const http = httpRouter();

// Add Convex Auth HTTP routes (required for authentication)
auth.addHttpRoutes(http);

// CORS handler for preflight requests
const corsHandler = httpAction(
  async () =>
    new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
);

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

// Payment verification endpoint with CORS support
http.route({
  path: '/verify-payment',
  method: 'OPTIONS',
  handler: corsHandler,
});

http.route({
  path: '/verify-payment',
  method: 'POST',
  handler: verifyPaymentTransaction,
});

export default http;
