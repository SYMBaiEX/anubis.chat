/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';
import type * as admin from '../admin.js';
import type * as agents from '../agents.js';
import type * as auth from '../auth.js';
import type * as chats from '../chats.js';
import type * as documents from '../documents.js';
import type * as env from '../env.js';
import type * as healthCheck from '../healthCheck.js';
import type * as memories from '../memories.js';
import type * as messages from '../messages.js';
import type * as users from '../users.js';
import type * as workflows from '../workflows.js';

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  agents: typeof agents;
  auth: typeof auth;
  chats: typeof chats;
  documents: typeof documents;
  env: typeof env;
  healthCheck: typeof healthCheck;
  memories: typeof memories;
  messages: typeof messages;
  users: typeof users;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;
